using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;
using EliteClinic.Domain.Entities;
using EliteClinic.Domain.Enums;
using EliteClinic.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EliteClinic.Application.Features.Clinic.Services;

public class QueueService : IQueueService
{
    private readonly EliteClinicDbContext _context;
    private readonly IMessageService _messageService;
    private readonly IInvoiceNumberService _invoiceNumberService;
    private readonly IPatientCreditService _patientCreditService;

    public QueueService(
        EliteClinicDbContext context,
        IMessageService messageService,
        IInvoiceNumberService invoiceNumberService,
        IPatientCreditService patientCreditService)
    {
        _context = context;
        _messageService = messageService;
        _invoiceNumberService = invoiceNumberService;
        _patientCreditService = patientCreditService;
    }

    // ── Sessions ───────────────────────────────────────────────────

    public async Task<ApiResponse<QueueSessionDto>> OpenSessionAsync(Guid tenantId, CreateQueueSessionRequest request, Guid callerUserId)
    {
        var callerDoctor = await ResolveCallerDoctorAsync(tenantId, callerUserId);
        if (callerDoctor != null)
        {
            if (request.DoctorId.HasValue && request.DoctorId.Value != callerDoctor.Id)
                return ApiResponse<QueueSessionDto>.Error("Doctors can only open their own sessions");

            request.DoctorId = callerDoctor.Id;
        }

        // Validate doctor exists if provided
        if (request.DoctorId.HasValue)
        {
            var doctor = await _context.Doctors.FirstOrDefaultAsync(d => d.Id == request.DoctorId.Value && d.TenantId == tenantId && !d.IsDeleted);
            if (doctor == null)
                return ApiResponse<QueueSessionDto>.Error("Doctor not found");
        }

        // Check for existing active session for this tenant today (or for specific doctor)
        var today = DateTime.UtcNow.Date;
        var existingQuery = _context.QueueSessions
            .Where(s => s.TenantId == tenantId && s.IsActive && !s.IsDeleted && s.StartedAt.Date == today);

        if (request.DoctorId.HasValue)
            existingQuery = existingQuery.Where(s => s.DoctorId == request.DoctorId.Value);
        else
            existingQuery = existingQuery.Where(s => s.DoctorId == null);

        var existing = await existingQuery.FirstOrDefaultAsync();
        if (existing != null)
            return ApiResponse<QueueSessionDto>.Error("An active session already exists for today");

        var session = new QueueSession
        {
            TenantId = tenantId,
            DoctorId = request.DoctorId,
            Notes = request.Notes,
            IsActive = true,
            StartedAt = DateTime.UtcNow
        };

        _context.QueueSessions.Add(session);
        await _context.SaveChangesAsync();

        // ── Auto-convert confirmed bookings into waiting tickets ──
        int convertedCount = 0;
        if (request.DoctorId.HasValue)
        {
            var confirmedBookings = await _context.Bookings
                .Where(b => b.TenantId == tenantId
                    && b.DoctorId == request.DoctorId.Value
                    && b.BookingDate.Date == today
                    && b.Status == BookingStatus.Confirmed
                    && b.QueueTicketId == null
                    && !b.IsDeleted)
                .OrderBy(b => b.BookingTime)
                .ToListAsync();

            int ticketNum = 0;
            foreach (var booking in confirmedBookings)
            {
                // Skip if patient already has an active ticket
                var hasActive = await _context.QueueTickets
                    .AnyAsync(t => t.PatientId == booking.PatientId && t.TenantId == tenantId && !t.IsDeleted
                        && (t.Status == TicketStatus.Waiting || t.Status == TicketStatus.Called || t.Status == TicketStatus.InVisit));
                if (hasActive) continue;

                ticketNum++;
                var ticket = new QueueTicket
                {
                    TenantId = tenantId,
                    SessionId = session.Id,
                    PatientId = booking.PatientId,
                    DoctorId = booking.DoctorId,
                    DoctorServiceId = booking.DoctorServiceId,
                    TicketNumber = ticketNum,
                    Status = TicketStatus.Waiting,
                    IsUrgent = false,
                    IssuedAt = DateTime.UtcNow,
                    Notes = $"Auto-created from booking on {booking.BookingDate:yyyy-MM-dd} at {booking.BookingTime:hh\\:mm}"
                };
                _context.QueueTickets.Add(ticket);
                booking.QueueTicketId = ticket.Id;
                convertedCount++;
            }

            if (convertedCount > 0)
                await _context.SaveChangesAsync();
        }

        var saved = await GetSessionWithIncludes(tenantId, session.Id);
        var message = convertedCount > 0
            ? $"Queue session opened successfully. {convertedCount} booking(s) auto-converted to tickets."
            : "Queue session opened successfully";
        return ApiResponse<QueueSessionDto>.Created(MapSessionToDto(saved!), message);
    }

    public async Task<ApiResponse<QueueSessionDto>> CloseSessionAsync(Guid tenantId, Guid sessionId, Guid callerUserId, bool forceClose = false)
    {
        var session = await _context.QueueSessions
            .Include(s => s.Tickets.Where(t => !t.IsDeleted))
            .Include(s => s.Doctor)
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.TenantId == tenantId && !s.IsDeleted);

        if (session == null)
            return ApiResponse<QueueSessionDto>.Error("Session not found");

        if (!session.IsActive)
            return ApiResponse<QueueSessionDto>.Error("Session is already closed");

        var callerDoctor = await ResolveCallerDoctorAsync(tenantId, callerUserId);
        if (callerDoctor != null && session.DoctorId != callerDoctor.Id)
            return ApiResponse<QueueSessionDto>.Error("Doctors can only close their own sessions");

        // Reject close if any tickets are InVisit
        var inVisitTickets = session.Tickets.Where(t => t.Status == TicketStatus.InVisit).ToList();
        if (inVisitTickets.Any() && !forceClose)
            return ApiResponse<QueueSessionDto>.Error("Cannot close session while tickets are in-visit. Use force=true only for explicit operational closure.");

        if (inVisitTickets.Any() && forceClose)
        {
            foreach (var ticket in inVisitTickets)
            {
                ticket.Status = TicketStatus.NoShow;
                await PreserveCreditForUnservedTicketAsync(tenantId, ticket.Id, CreditReason.SessionForceClosedUnserved, session.Id);
            }
        }

        // Mark remaining Waiting/Called tickets as NoShow
        foreach (var ticket in session.Tickets.Where(t => t.Status == TicketStatus.Waiting || t.Status == TicketStatus.Called))
        {
            ticket.Status = TicketStatus.NoShow;
            await PreserveCreditForUnservedTicketAsync(tenantId, ticket.Id, CreditReason.NoShowRetainedByPolicy, session.Id);
        }

        session.IsActive = false;
        session.ClosedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return ApiResponse<QueueSessionDto>.Ok(MapSessionToDto(session), forceClose
            ? "Session force-closed. Unserved tickets marked as no-show with financial entitlement preserved where applicable."
            : "Session closed. Remaining tickets marked as no-show.");
    }

    public async Task<ApiResponse<int>> CloseAllSessionsForDateAsync(Guid tenantId, DateTime date)
    {
        var targetDate = date.Date;
        var sessions = await _context.QueueSessions
            .Include(s => s.Tickets.Where(t => !t.IsDeleted))
            .Where(s => s.TenantId == tenantId && s.IsActive && !s.IsDeleted && s.StartedAt.Date <= targetDate)
            .ToListAsync();

        if (!sessions.Any())
            return ApiResponse<int>.Ok(0, "No active sessions found for the given date");

        foreach (var session in sessions)
        {
            foreach (var ticket in session.Tickets.Where(t => t.Status == TicketStatus.Waiting || t.Status == TicketStatus.Called))
            {
                ticket.Status = TicketStatus.NoShow;
                await PreserveCreditForUnservedTicketAsync(tenantId, ticket.Id, CreditReason.SessionAutoClosedUnserved, session.Id);
            }
            session.IsActive = false;
            session.ClosedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return ApiResponse<int>.Ok(sessions.Count, $"Closed {sessions.Count} session(s). Remaining tickets marked as no-show.");
    }

    public async Task<ApiResponse<PagedResult<QueueSessionDto>>> GetSessionsAsync(Guid tenantId, int pageNumber = 1, int pageSize = 10)
    {
        var query = _context.QueueSessions
            .Include(s => s.Doctor)
            .Include(s => s.Tickets.Where(t => !t.IsDeleted))
            .Where(s => s.TenantId == tenantId)
            .OrderByDescending(s => s.StartedAt);

        var totalCount = await query.CountAsync();
        var sessions = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var result = new PagedResult<QueueSessionDto>
        {
            Items = sessions.Select(MapSessionToDto).ToList(),
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };

        return ApiResponse<PagedResult<QueueSessionDto>>.Ok(result, $"Retrieved {result.Items.Count} session(s)");
    }

    public async Task<ApiResponse<QueueSessionDto>> GetSessionByIdAsync(Guid tenantId, Guid sessionId, Guid callerUserId)
    {
        var session = await GetSessionWithIncludes(tenantId, sessionId);
        if (session == null)
            return ApiResponse<QueueSessionDto>.Error("Session not found");

        var callerDoctor = await ResolveCallerDoctorAsync(tenantId, callerUserId);
        if (callerDoctor != null && session.DoctorId != callerDoctor.Id)
            return ApiResponse<QueueSessionDto>.Error("Doctors can only access their own sessions");

        return ApiResponse<QueueSessionDto>.Ok(MapSessionToDto(session), "Session retrieved successfully");
    }

    // ── Tickets ────────────────────────────────────────────────────

    public async Task<ApiResponse<QueueTicketDto>> IssueTicketAsync(Guid tenantId, CreateQueueTicketRequest request)
    {
        var session = await _context.QueueSessions
            .FirstOrDefaultAsync(s => s.Id == request.SessionId && s.TenantId == tenantId && !s.IsDeleted);

        if (session == null)
            return ApiResponse<QueueTicketDto>.Error("Session not found");

        if (!session.IsActive)
            return ApiResponse<QueueTicketDto>.Error("Session is closed");

        if (session.DoctorId.HasValue && session.DoctorId.Value != request.DoctorId)
            return ApiResponse<QueueTicketDto>.Error("Selected doctor does not match this active shift session");

        var doctorShiftOpen = await _context.QueueSessions
            .AnyAsync(s => s.TenantId == tenantId && !s.IsDeleted && s.IsActive && s.DoctorId == request.DoctorId);
        if (!doctorShiftOpen)
            return ApiResponse<QueueTicketDto>.Error("Doctor shift is not open. Only doctors with an open shift can receive queue tickets.");

        var patient = await _context.Patients
            .FirstOrDefaultAsync(p => p.Id == request.PatientId && p.TenantId == tenantId && !p.IsDeleted);
        if (patient == null)
            return ApiResponse<QueueTicketDto>.Error("Patient not found");

        var doctor = await _context.Doctors
            .FirstOrDefaultAsync(d => d.Id == request.DoctorId && d.TenantId == tenantId && !d.IsDeleted);
        if (doctor == null)
            return ApiResponse<QueueTicketDto>.Error("Doctor not found");

        if (request.IsUrgent && !IsUrgentEnabledForDoctor(doctor))
            return ApiResponse<QueueTicketDto>.Error("Urgent tickets are disabled for this doctor");

        // Check patient doesn't already have an active ticket
        var activeTicket = await _context.QueueTickets
            .FirstOrDefaultAsync(t => t.PatientId == request.PatientId && t.TenantId == tenantId && !t.IsDeleted
                && (t.Status == TicketStatus.Waiting || t.Status == TicketStatus.Called || t.Status == TicketStatus.InVisit));
        if (activeTicket != null)
            return ApiResponse<QueueTicketDto>.Error("Patient already has an active ticket");

        // Next ticket number for this session
        var maxTicketNum = await _context.QueueTickets
            .Where(t => t.SessionId == request.SessionId && !t.IsDeleted)
            .MaxAsync(t => (int?)t.TicketNumber) ?? 0;

        var ticket = new QueueTicket
        {
            TenantId = tenantId,
            SessionId = request.SessionId,
            PatientId = request.PatientId,
            DoctorId = request.DoctorId,
            DoctorServiceId = request.DoctorServiceId,
            TicketNumber = maxTicketNum + 1,
            Status = TicketStatus.Waiting,
            IsUrgent = request.IsUrgent && IsUrgentEnabledForDoctor(doctor),
            IssuedAt = DateTime.UtcNow,
            Notes = request.Notes
        };

        _context.QueueTickets.Add(ticket);
        await _context.SaveChangesAsync();

        await _messageService.LogWorkflowEventAsync(
            tenantId,
            nameof(MessageScenario.QueueTicketIssued),
            recipientUserId: patient.UserId,
            recipientPhone: patient.Phone,
            variables: new Dictionary<string, string>
            {
                ["ticketNumber"] = ticket.TicketNumber.ToString(),
                ["doctorName"] = doctor.Name,
                ["patientName"] = patient.Name
            });

        var saved = await GetTicketWithIncludes(tenantId, ticket.Id);
        return ApiResponse<QueueTicketDto>.Created(MapTicketToDto(saved!), "Ticket issued successfully");
    }

    public async Task<ApiResponse<QueueTicketDto>> IssueTicketWithPaymentAsync(Guid tenantId, CreateQueueTicketWithPaymentRequest request)
    {
        // Validate session
        var session = await _context.QueueSessions
            .FirstOrDefaultAsync(s => s.Id == request.SessionId && s.TenantId == tenantId && !s.IsDeleted);
        if (session == null)
            return ApiResponse<QueueTicketDto>.Error("Session not found");
        if (!session.IsActive)
            return ApiResponse<QueueTicketDto>.Error("Session is closed");

        if (session.DoctorId.HasValue && session.DoctorId.Value != request.DoctorId)
            return ApiResponse<QueueTicketDto>.Error("Selected doctor does not match this active shift session");

        var doctorShiftOpen = await _context.QueueSessions
            .AnyAsync(s => s.TenantId == tenantId && !s.IsDeleted && s.IsActive && s.DoctorId == request.DoctorId);
        if (!doctorShiftOpen)
            return ApiResponse<QueueTicketDto>.Error("Doctor shift is not open. Only doctors with an open shift can receive queue tickets.");

        var patient = await _context.Patients
            .FirstOrDefaultAsync(p => p.Id == request.PatientId && p.TenantId == tenantId && !p.IsDeleted);
        if (patient == null)
            return ApiResponse<QueueTicketDto>.Error("Patient not found");

        var doctor = await _context.Doctors
            .FirstOrDefaultAsync(d => d.Id == request.DoctorId && d.TenantId == tenantId && !d.IsDeleted);
        if (doctor == null)
            return ApiResponse<QueueTicketDto>.Error("Doctor not found");

        if (request.IsUrgent && !IsUrgentEnabledForDoctor(doctor))
            return ApiResponse<QueueTicketDto>.Error("Urgent tickets are disabled for this doctor");

        var effectivePaidAmount = request.PaidAmount ?? request.PaymentAmount ?? 0m;
        if (effectivePaidAmount < 0)
            return ApiResponse<QueueTicketDto>.Error("Paid amount cannot be negative");

        Guid? resolvedDoctorServiceId = null;
        Guid? resolvedClinicServiceId = null;
        decimal? resolvedServicePrice = null;
        string? resolvedServiceName = null;
        decimal? responseInvoiceAmount = null;
        decimal? responsePaidAmount = null;
        decimal? responseRemainingAmount = null;
        InvoiceStatus? responseInvoiceStatus = null;

        if (request.DoctorServiceId.HasValue)
        {
            var legacyService = await _context.DoctorServices
                .FirstOrDefaultAsync(ds => ds.Id == request.DoctorServiceId.Value
                    && ds.TenantId == tenantId
                    && ds.DoctorId == request.DoctorId
                    && !ds.IsDeleted
                    && ds.IsActive);

            if (legacyService != null)
            {
                resolvedDoctorServiceId = legacyService.Id;
                resolvedServicePrice = legacyService.Price;
                resolvedServiceName = legacyService.ServiceName;
            }
            else
            {
                var clinicLink = await _context.DoctorServiceLinks
                    .Include(l => l.ClinicService)
                    .FirstOrDefaultAsync(l => l.TenantId == tenantId
                        && l.DoctorId == request.DoctorId
                        && (l.ClinicServiceId == request.DoctorServiceId.Value || l.Id == request.DoctorServiceId.Value)
                        && !l.IsDeleted
                        && l.IsActive
                        && !l.ClinicService.IsDeleted
                        && l.ClinicService.IsActive);

                if (clinicLink == null)
                    return ApiResponse<QueueTicketDto>.Error("Invalid doctorServiceId. It must be a legacy doctor service or a clinic service linked to this doctor.");

                resolvedClinicServiceId = clinicLink.ClinicServiceId;
                resolvedServicePrice = clinicLink.OverridePrice ?? clinicLink.ClinicService.DefaultPrice;
                resolvedServiceName = clinicLink.ClinicService.Name;
            }
        }

        var activeTicket = await _context.QueueTickets
            .FirstOrDefaultAsync(t => t.PatientId == request.PatientId && t.TenantId == tenantId && !t.IsDeleted
                && (t.Status == TicketStatus.Waiting || t.Status == TicketStatus.Called || t.Status == TicketStatus.InVisit));
        if (activeTicket != null)
            return ApiResponse<QueueTicketDto>.Error("Patient already has an active ticket");

        var maxTicketNum = await _context.QueueTickets
            .Where(t => t.SessionId == request.SessionId && !t.IsDeleted)
            .MaxAsync(t => (int?)t.TicketNumber) ?? 0;

        var ticket = new QueueTicket
        {
            TenantId = tenantId,
            SessionId = request.SessionId,
            PatientId = request.PatientId,
            DoctorId = request.DoctorId,
            DoctorServiceId = resolvedDoctorServiceId,
            TicketNumber = maxTicketNum + 1,
            Status = TicketStatus.Waiting,
            IsUrgent = request.IsUrgent && IsUrgentEnabledForDoctor(doctor),
            IssuedAt = DateTime.UtcNow,
            Notes = request.Notes
        };
        _context.QueueTickets.Add(ticket);

        // Create upfront visit + invoice when this is a payment/intake flow.
        if (request.DoctorServiceId.HasValue || effectivePaidAmount > 0)
        {
            var invoiceAmount = resolvedServicePrice ?? Math.Max(effectivePaidAmount, 0m);
            var paidAmount = Math.Max(effectivePaidAmount, 0m);
            var remainingAmount = Math.Max(0m, invoiceAmount - paidAmount);
            var invoiceStatus = paidAmount <= 0m
                ? InvoiceStatus.Unpaid
                : (paidAmount >= invoiceAmount ? InvoiceStatus.Paid : InvoiceStatus.PartiallyPaid);

            var visit = new Visit
            {
                TenantId = tenantId,
                QueueTicketId = ticket.Id,
                DoctorId = request.DoctorId,
                PatientId = request.PatientId,
                VisitType = request.VisitType,
                Status = VisitStatus.Open,
                Complaint = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes,
                StartedAt = DateTime.UtcNow
            };
            _context.Visits.Add(visit);

            var invoice = new Invoice
            {
                TenantId = tenantId,
                InvoiceNumber = await _invoiceNumberService.GenerateNextAsync(tenantId),
                VisitId = visit.Id,
                PatientId = request.PatientId,
                PatientNameSnapshot = patient.Name,
                PatientPhoneSnapshot = patient.Phone,
                DoctorId = request.DoctorId,
                Amount = invoiceAmount,
                PaidAmount = paidAmount,
                RemainingAmount = remainingAmount,
                Status = invoiceStatus,
                Notes = request.PaymentNotes
            };
            _context.Invoices.Add(invoice);

            if (!string.IsNullOrWhiteSpace(resolvedServiceName))
            {
                _context.Set<InvoiceLineItem>().Add(new InvoiceLineItem
                {
                    TenantId = tenantId,
                    InvoiceId = invoice.Id,
                    ClinicServiceId = resolvedClinicServiceId,
                    ItemName = resolvedServiceName,
                    UnitPrice = invoiceAmount,
                    Quantity = 1,
                    TotalPrice = invoiceAmount
                });
            }

            responseInvoiceAmount = invoiceAmount;
            responsePaidAmount = paidAmount;
            responseRemainingAmount = remainingAmount;
            responseInvoiceStatus = invoiceStatus;

            if (paidAmount > 0)
            {
                var payment = new Payment
                {
                    TenantId = tenantId,
                    InvoiceId = invoice.Id,
                    Amount = paidAmount,
                    PaymentMethod = request.PaymentMethod,
                    ReferenceNumber = request.PaymentReference,
                    Notes = request.PaymentNotes,
                    PaidAt = DateTime.UtcNow
                };
                _context.Payments.Add(payment);
            }
        }

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return ApiResponse<QueueTicketDto>.Error("Unable to issue ticket due to invalid service linkage. Verify doctorServiceId for this doctor.");
        }

        await _messageService.LogWorkflowEventAsync(
            tenantId,
            nameof(MessageScenario.QueueTicketIssued),
            recipientUserId: patient.UserId,
            recipientPhone: patient.Phone,
            variables: new Dictionary<string, string>
            {
                ["ticketNumber"] = ticket.TicketNumber.ToString(),
                ["doctorName"] = doctor.Name,
                ["patientName"] = patient.Name
            });

        var saved = await GetTicketWithIncludes(tenantId, ticket.Id);
        var responseDto = MapTicketToDto(saved!);
        if (!responseDto.DoctorServiceId.HasValue && request.DoctorServiceId.HasValue)
            responseDto.DoctorServiceId = request.DoctorServiceId;
        if (string.IsNullOrWhiteSpace(responseDto.ServiceName) && !string.IsNullOrWhiteSpace(resolvedServiceName))
            responseDto.ServiceName = resolvedServiceName;
        responseDto.InvoiceAmount = responseInvoiceAmount;
        responseDto.PaidAmount = responsePaidAmount;
        responseDto.RemainingAmount = responseRemainingAmount;
        responseDto.InvoiceStatus = responseInvoiceStatus;

        var message = responseRemainingAmount.HasValue && responseRemainingAmount.Value > 0m
            ? $"Ticket issued with payment recorded successfully. Remaining amount: {responseRemainingAmount.Value:0.##}"
            : "Ticket issued with payment recorded successfully";

        return ApiResponse<QueueTicketDto>.Created(responseDto, message);
    }

    public async Task<ApiResponse<QueueTicketDto>> CallTicketAsync(Guid tenantId, Guid ticketId, Guid callerUserId)
    {
        var ticket = await GetTicketWithIncludes(tenantId, ticketId);
        if (ticket == null)
            return ApiResponse<QueueTicketDto>.Error("Ticket not found");

        var callerDoctor = await ResolveCallerDoctorAsync(tenantId, callerUserId);
        if (callerDoctor != null && ticket.DoctorId != callerDoctor.Id)
            return ApiResponse<QueueTicketDto>.Error("Doctors can only manage their own queue tickets");

        if (ticket.Status != TicketStatus.Waiting && ticket.Status != TicketStatus.Skipped)
            return ApiResponse<QueueTicketDto>.Error($"Cannot call ticket in {ticket.Status} status. Must be Waiting or Skipped.");

        ticket.Status = TicketStatus.Called;
        ticket.CalledAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        await _messageService.LogWorkflowEventAsync(
            tenantId,
            nameof(MessageScenario.QueueTurnReady),
            recipientUserId: ticket.Patient?.UserId,
            recipientPhone: ticket.Patient?.Phone,
            variables: new Dictionary<string, string>
            {
                ["ticketNumber"] = ticket.TicketNumber.ToString(),
                ["doctorName"] = ticket.Doctor?.Name ?? string.Empty,
                ["patientName"] = ticket.Patient?.Name ?? string.Empty
            });

        return ApiResponse<QueueTicketDto>.Ok(MapTicketToDto(ticket), "Patient called successfully");
    }

    public async Task<ApiResponse<StartVisitResultDto>> StartVisitFromTicketAsync(Guid tenantId, Guid ticketId, Guid callerUserId)
    {
        var ticket = await GetTicketWithIncludes(tenantId, ticketId);
        if (ticket == null)
            return ApiResponse<StartVisitResultDto>.Error("Ticket not found");

        var callerDoctor = await ResolveCallerDoctorAsync(tenantId, callerUserId);
        if (callerDoctor != null && ticket.DoctorId != callerDoctor.Id)
            return ApiResponse<StartVisitResultDto>.Error("Doctors can only start visits from their own queue tickets");

        // Idempotency: if already InVisit, return existing visit
        if (ticket.Status == TicketStatus.InVisit)
        {
            var existingVisit = await _context.Visits
                .FirstOrDefaultAsync(v => v.QueueTicketId == ticketId && v.TenantId == tenantId && !v.IsDeleted);
            if (existingVisit != null)
            {
                return ApiResponse<StartVisitResultDto>.Ok(new StartVisitResultDto
                {
                    Ticket = MapTicketToDto(ticket),
                    VisitId = existingVisit.Id
                }, "Visit already started (idempotent)");
            }
        }

        if (ticket.Status != TicketStatus.Called)
            return ApiResponse<StartVisitResultDto>.Error($"Cannot start visit from {ticket.Status} status. Must be Called.");

        ticket.Status = TicketStatus.InVisit;
        ticket.VisitStartedAt = DateTime.UtcNow;

        // Check if a visit already exists for this ticket (created via payment flow)
        var visit = await _context.Visits
            .FirstOrDefaultAsync(v => v.QueueTicketId == ticketId && v.TenantId == tenantId && !v.IsDeleted);

        if (visit == null)
        {
            visit = new Visit
            {
                TenantId = tenantId,
                QueueTicketId = ticket.Id,
                DoctorId = ticket.DoctorId,
                PatientId = ticket.PatientId,
                Status = VisitStatus.Open,
                Complaint = string.IsNullOrWhiteSpace(ticket.Notes) ? null : ticket.Notes,
                StartedAt = DateTime.UtcNow
            };
            _context.Visits.Add(visit);
        }
        else if (string.IsNullOrWhiteSpace(visit.Complaint) && !string.IsNullOrWhiteSpace(ticket.Notes))
        {
            visit.Complaint = ticket.Notes;
        }

        await _context.SaveChangesAsync();

        return ApiResponse<StartVisitResultDto>.Ok(new StartVisitResultDto
        {
            Ticket = MapTicketToDto(ticket),
            VisitId = visit.Id
        }, "Visit started successfully");
    }

    public async Task<ApiResponse<QueueTicketDto>> FinishTicketAsync(Guid tenantId, Guid ticketId, Guid callerUserId)
    {
        var ticket = await GetTicketWithIncludes(tenantId, ticketId);
        if (ticket == null)
            return ApiResponse<QueueTicketDto>.Error("Ticket not found");

        var callerDoctor = await ResolveCallerDoctorAsync(tenantId, callerUserId);
        if (callerDoctor != null && ticket.DoctorId != callerDoctor.Id)
            return ApiResponse<QueueTicketDto>.Error("Doctors can only finish their own queue tickets");

        if (ticket.Status != TicketStatus.InVisit)
            return ApiResponse<QueueTicketDto>.Error($"Cannot finish ticket in {ticket.Status} status. Must be InVisit.");

        ticket.Status = TicketStatus.Completed;
        ticket.CompletedAt = DateTime.UtcNow;

        // Also complete the linked visit if it exists and is still Open
        var visit = await _context.Visits
            .FirstOrDefaultAsync(v => v.QueueTicketId == ticketId && v.TenantId == tenantId && !v.IsDeleted);
        if (visit != null && visit.Status == VisitStatus.Open)
        {
            visit.Status = VisitStatus.Completed;
            visit.CompletedAt = DateTime.UtcNow;

            var invoice = await _context.Invoices
                .FirstOrDefaultAsync(i => i.VisitId == visit.Id && i.TenantId == tenantId && !i.IsDeleted);
            if (invoice != null)
            {
                invoice.IsServiceRendered = true;
                invoice.CreditAmount = 0;
                invoice.CreditIssuedAt = null;
            }
        }

        // Also mark linked booking as Completed
        var booking = await _context.Bookings
            .FirstOrDefaultAsync(b => b.QueueTicketId == ticketId && b.TenantId == tenantId && !b.IsDeleted);
        if (booking != null && booking.Status == BookingStatus.Confirmed)
        {
            booking.Status = BookingStatus.Completed;
        }

        await _context.SaveChangesAsync();

        return ApiResponse<QueueTicketDto>.Ok(MapTicketToDto(ticket), "Ticket completed successfully");
    }

    public async Task<ApiResponse<QueueTicketDto>> SkipTicketAsync(Guid tenantId, Guid ticketId, Guid callerUserId)
    {
        var ticket = await GetTicketWithIncludes(tenantId, ticketId);
        if (ticket == null)
            return ApiResponse<QueueTicketDto>.Error("Ticket not found");

        var callerDoctor = await ResolveCallerDoctorAsync(tenantId, callerUserId);
        if (callerDoctor != null && ticket.DoctorId != callerDoctor.Id)
            return ApiResponse<QueueTicketDto>.Error("Doctors can only manage their own queue tickets");

        if (ticket.Status != TicketStatus.Waiting && ticket.Status != TicketStatus.Called)
            return ApiResponse<QueueTicketDto>.Error($"Cannot skip ticket in {ticket.Status} status");

        // Business policy: skip moves patient to queue tail, not terminal skipped state.
        var maxTicketNum = await _context.QueueTickets
            .Where(t => t.SessionId == ticket.SessionId && !t.IsDeleted)
            .MaxAsync(t => (int?)t.TicketNumber) ?? ticket.TicketNumber;

        ticket.Status = TicketStatus.Waiting;
        ticket.TicketNumber = maxTicketNum + 1;
        ticket.CalledAt = null;
        ticket.SkippedAt = DateTime.UtcNow;
        ticket.Notes = string.IsNullOrWhiteSpace(ticket.Notes)
            ? "Skipped and moved to end of queue"
            : $"{ticket.Notes} | Skipped and moved to end of queue";
        await _context.SaveChangesAsync();

        return ApiResponse<QueueTicketDto>.Ok(MapTicketToDto(ticket), "Ticket skipped and moved to end of queue");
    }

    public async Task<ApiResponse<QueueTicketDto>> CancelTicketAsync(Guid tenantId, Guid ticketId, Guid callerUserId)
    {
        var ticket = await GetTicketWithIncludes(tenantId, ticketId);
        if (ticket == null)
            return ApiResponse<QueueTicketDto>.Error("Ticket not found");

        var callerDoctor = await ResolveCallerDoctorAsync(tenantId, callerUserId);
        if (callerDoctor != null && ticket.DoctorId != callerDoctor.Id)
            return ApiResponse<QueueTicketDto>.Error("Doctors can only manage their own queue tickets");

        if (ticket.Status == TicketStatus.InVisit || ticket.Status == TicketStatus.Completed)
            return ApiResponse<QueueTicketDto>.Error($"Cannot cancel ticket in {ticket.Status} status");

        ticket.Status = TicketStatus.Cancelled;
        ticket.CancelledAt = DateTime.UtcNow;

        // Cancellation before service should void any linked invoice values.
        var visit = await _context.Visits
            .FirstOrDefaultAsync(v => v.QueueTicketId == ticketId && v.TenantId == tenantId && !v.IsDeleted);
        if (visit != null)
        {
            var invoice = await _context.Invoices
                .FirstOrDefaultAsync(i => i.VisitId == visit.Id && i.TenantId == tenantId && !i.IsDeleted);
            if (invoice != null)
            {
                var refundedAmount = invoice.PaidAmount;
                if (refundedAmount > 0m)
                {
                    var refundPayment = new Payment
                    {
                        TenantId = tenantId,
                        InvoiceId = invoice.Id,
                        Amount = -refundedAmount,
                        PaymentMethod = "Refund",
                        Notes = "Ticket cancelled before service. Refund recorded.",
                        PaidAt = DateTime.UtcNow
                    };
                    _context.Payments.Add(refundPayment);
                }

                invoice.Amount = 0;
                invoice.PaidAmount = 0;
                invoice.RemainingAmount = 0;
                invoice.CreditAmount = 0;
                invoice.CreditIssuedAt = null;
                invoice.HasPendingSettlement = false;
                invoice.PendingSettlementAmount = 0;
                invoice.Status = InvoiceStatus.Refunded;
                invoice.Notes = string.IsNullOrWhiteSpace(invoice.Notes)
                    ? "Invoice zeroed due to ticket cancellation before service"
                    : $"{invoice.Notes} | Invoice zeroed due to ticket cancellation before service";
            }
        }

        await _context.SaveChangesAsync();

        return ApiResponse<QueueTicketDto>.Ok(MapTicketToDto(ticket), "Ticket cancelled");
    }

    public async Task<ApiResponse<QueueTicketDto>> MarkUrgentAsync(Guid tenantId, Guid ticketId, Guid callerUserId)
    {
        var ticket = await GetTicketWithIncludes(tenantId, ticketId);
        if (ticket == null)
            return ApiResponse<QueueTicketDto>.Error("Ticket not found");

        var callerDoctor = await ResolveCallerDoctorAsync(tenantId, callerUserId);
        if (callerDoctor != null && ticket.DoctorId != callerDoctor.Id)
            return ApiResponse<QueueTicketDto>.Error("Doctors can only manage their own queue tickets");

        if (ticket.Status != TicketStatus.Waiting)
            return ApiResponse<QueueTicketDto>.Error("Can only mark waiting tickets as urgent");

        var doctor = await _context.Doctors
            .FirstOrDefaultAsync(d => d.Id == ticket.DoctorId && d.TenantId == tenantId && !d.IsDeleted);
        if (doctor == null)
            return ApiResponse<QueueTicketDto>.Error("Doctor not found");

        if (!IsUrgentEnabledForDoctor(doctor))
            return ApiResponse<QueueTicketDto>.Error("Urgent tickets are disabled for this doctor");

        ticket.IsUrgent = true;
        await _context.SaveChangesAsync();

        return ApiResponse<QueueTicketDto>.Ok(MapTicketToDto(ticket), "Ticket marked as urgent");
    }

    public async Task<ApiResponse<List<QueueTicketDto>>> GetTicketsBySessionAsync(Guid tenantId, Guid sessionId, Guid callerUserId)
    {
        var session = await _context.QueueSessions
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.TenantId == tenantId && !s.IsDeleted);
        if (session == null)
            return ApiResponse<List<QueueTicketDto>>.Error("Session not found");

        var callerDoctor = await ResolveCallerDoctorAsync(tenantId, callerUserId);
        if (callerDoctor != null && session.DoctorId != callerDoctor.Id)
            return ApiResponse<List<QueueTicketDto>>.Error("Doctors can only access their own sessions");

        var tickets = await _context.QueueTickets
            .Include(t => t.Patient)
            .Include(t => t.Doctor)
            .Include(t => t.DoctorService)
            .Where(t => t.SessionId == sessionId && t.TenantId == tenantId && !t.IsDeleted)
            .ToListAsync();

        var ordered = OrderTicketsByUrgentMode(tickets);

        var ticketDtos = ordered.Select(MapTicketToDto).ToList();
        await EnrichTicketFinancialAndServiceMetadataAsync(tenantId, ticketDtos);

        return ApiResponse<List<QueueTicketDto>>.Ok(
            ticketDtos,
            $"Retrieved {ordered.Count} ticket(s)");
    }

    // ── Views ──────────────────────────────────────────────────────

    public async Task<ApiResponse<QueueBoardDto>> GetBoardAsync(Guid tenantId)
    {
        var today = DateTime.UtcNow.Date;
        var sessions = await _context.QueueSessions
            .Include(s => s.Doctor)
            .Include(s => s.Tickets.Where(t => !t.IsDeleted))
                .ThenInclude(t => t.Patient)
            .Include(s => s.Tickets.Where(t => !t.IsDeleted))
                .ThenInclude(t => t.Doctor)
            .Include(s => s.Tickets.Where(t => !t.IsDeleted))
                .ThenInclude(t => t.DoctorService)
            .Where(s => s.TenantId == tenantId && !s.IsDeleted && s.StartedAt.Date == today)
            .OrderByDescending(s => s.IsActive)
            .ThenByDescending(s => s.StartedAt)
            .ToListAsync();

        var board = new QueueBoardDto
        {
            Sessions = sessions.Select(s =>
            {
                var tickets = s.Tickets.OrderBy(t => t.IsUrgent ? 0 : 1).ThenBy(t => t.IssuedAt).ToList();
                tickets = OrderTicketsByUrgentMode(tickets);
                var current = tickets.FirstOrDefault(t => t.Status == TicketStatus.InVisit || t.Status == TicketStatus.Called);

                return new QueueBoardSessionDto
                {
                    SessionId = s.Id,
                    DoctorId = s.DoctorId,
                    DoctorName = s.Doctor?.Name,
                    IsActive = s.IsActive,
                    WaitingCount = tickets.Count(t => t.Status == TicketStatus.Waiting),
                    CalledCount = tickets.Count(t => t.Status == TicketStatus.Called),
                    InVisitCount = tickets.Count(t => t.Status == TicketStatus.InVisit),
                    CompletedCount = tickets.Count(t => t.Status == TicketStatus.Completed),
                    CurrentTicket = current != null ? MapTicketToDto(current) : null,
                    WaitingTickets = tickets.Where(t => t.Status == TicketStatus.Waiting).Select(MapTicketToDto).ToList()
                };
            }).ToList()
        };

        var boardTicketDtos = board.Sessions
            .SelectMany(s => s.WaitingTickets.Concat(s.CurrentTicket != null ? new[] { s.CurrentTicket } : Array.Empty<QueueTicketDto>()))
            .ToList();
        await EnrichTicketFinancialAndServiceMetadataAsync(tenantId, boardTicketDtos);

        return ApiResponse<QueueBoardDto>.Ok(board, "Board retrieved successfully");
    }

    public async Task<ApiResponse<QueueBoardSessionDto>> GetMyQueueAsync(Guid tenantId, Guid doctorUserId)
    {
        // Find doctor by UserId
        var doctor = await _context.Doctors
            .FirstOrDefaultAsync(d => d.UserId == doctorUserId && d.TenantId == tenantId && !d.IsDeleted);
        if (doctor == null)
            return ApiResponse<QueueBoardSessionDto>.Error("Doctor not found");

        var today = DateTime.UtcNow.Date;
        var session = await _context.QueueSessions
            .Include(s => s.Doctor)
            .Include(s => s.Tickets.Where(t => !t.IsDeleted))
                .ThenInclude(t => t.Patient)
            .Include(s => s.Tickets.Where(t => !t.IsDeleted))
                .ThenInclude(t => t.Doctor)
            .Include(s => s.Tickets.Where(t => !t.IsDeleted))
                .ThenInclude(t => t.DoctorService)
            .Where(s => s.TenantId == tenantId && !s.IsDeleted && s.IsActive && s.StartedAt.Date == today)
            .FirstOrDefaultAsync(s => s.DoctorId == doctor.Id || s.DoctorId == null);

        if (session == null)
            return ApiResponse<QueueBoardSessionDto>.Error("No active session found for today");

        // Filter to only this doctor's tickets if session is tenant-wide
        var tickets = session.Tickets
            .Where(t => t.DoctorId == doctor.Id)
            .ToList();

        tickets = OrderTicketsByUrgentMode(tickets);

        var current = tickets.FirstOrDefault(t => t.Status == TicketStatus.InVisit || t.Status == TicketStatus.Called);

        var dto = new QueueBoardSessionDto
        {
            SessionId = session.Id,
            DoctorId = doctor.Id,
            DoctorName = doctor.Name,
            IsActive = session.IsActive,
            WaitingCount = tickets.Count(t => t.Status == TicketStatus.Waiting),
            CalledCount = tickets.Count(t => t.Status == TicketStatus.Called),
            InVisitCount = tickets.Count(t => t.Status == TicketStatus.InVisit),
            CompletedCount = tickets.Count(t => t.Status == TicketStatus.Completed),
            CurrentTicket = current != null ? MapTicketToDto(current) : null,
            WaitingTickets = tickets.Where(t => t.Status == TicketStatus.Waiting).Select(MapTicketToDto).ToList()
        };

        var myQueueTickets = dto.WaitingTickets
            .Concat(dto.CurrentTicket != null ? new[] { dto.CurrentTicket } : Array.Empty<QueueTicketDto>())
            .ToList();
        await EnrichTicketFinancialAndServiceMetadataAsync(tenantId, myQueueTickets);

        return ApiResponse<QueueBoardSessionDto>.Ok(dto, "Doctor queue retrieved successfully");
    }

    public async Task<ApiResponse<QueueTicketDto>> GetMyTicketAsync(Guid tenantId, Guid patientUserId)
    {
        // Find patient by UserId
        var patient = await _context.Patients
            .FirstOrDefaultAsync(p => p.UserId == patientUserId && p.TenantId == tenantId && !p.IsDeleted && p.IsDefault);
        if (patient == null)
            return ApiResponse<QueueTicketDto>.Error("Patient not found");

        return await GetTicketForOwnedProfileAsync(tenantId, patientUserId, patient.Id);
    }

    public async Task<ApiResponse<QueueTicketDto>> GetTicketForOwnedProfileAsync(Guid tenantId, Guid patientUserId, Guid patientId)
    {
        var ownedProfile = await _context.Patients
            .FirstOrDefaultAsync(p => p.Id == patientId && p.TenantId == tenantId && !p.IsDeleted);
        if (ownedProfile == null)
            return ApiResponse<QueueTicketDto>.Error("Patient profile not found");

        if (ownedProfile.UserId != patientUserId)
            return ApiResponse<QueueTicketDto>.Error("Access denied to requested patient profile");

        var ticket = await _context.QueueTickets
            .Include(t => t.Patient)
            .Include(t => t.Doctor)
            .Include(t => t.DoctorService)
            .Where(t => t.PatientId == patientId && t.TenantId == tenantId && !t.IsDeleted
                && (t.Status == TicketStatus.Waiting || t.Status == TicketStatus.Called || t.Status == TicketStatus.InVisit))
            .OrderByDescending(t => t.IssuedAt)
            .FirstOrDefaultAsync();

        if (ticket == null)
            return ApiResponse<QueueTicketDto>.Error("No active ticket found");

        var dto = MapTicketToDto(ticket);
        await PopulatePatientQueueStatusFieldsAsync(tenantId, ticket, dto);
        await EnrichTicketFinancialAndServiceMetadataAsync(tenantId, new List<QueueTicketDto> { dto });

        return ApiResponse<QueueTicketDto>.Ok(dto, "Ticket retrieved successfully");
    }

    // ── Helpers ────────────────────────────────────────────────────

    private async Task<QueueSession?> GetSessionWithIncludes(Guid tenantId, Guid id)
    {
        return await _context.QueueSessions
            .Include(s => s.Doctor)
            .Include(s => s.Tickets.Where(t => !t.IsDeleted))
            .FirstOrDefaultAsync(s => s.Id == id && s.TenantId == tenantId && !s.IsDeleted);
    }

    private async Task<QueueTicket?> GetTicketWithIncludes(Guid tenantId, Guid id)
    {
        return await _context.QueueTickets
            .Include(t => t.Patient)
            .Include(t => t.Doctor)
            .Include(t => t.DoctorService)
            .FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId && !t.IsDeleted);
    }

    private static QueueSessionDto MapSessionToDto(QueueSession s)
    {
        return new QueueSessionDto
        {
            Id = s.Id,
            DoctorId = s.DoctorId,
            DoctorName = s.Doctor?.Name,
            StartedAt = s.StartedAt,
            ClosedAt = s.ClosedAt,
            IsActive = s.IsActive,
            Notes = s.Notes,
            TotalTickets = s.Tickets?.Count(t => !t.IsDeleted) ?? 0,
            WaitingCount = s.Tickets?.Count(t => !t.IsDeleted && t.Status == TicketStatus.Waiting) ?? 0,
            CompletedCount = s.Tickets?.Count(t => !t.IsDeleted && t.Status == TicketStatus.Completed) ?? 0,
            CreatedAt = s.CreatedAt
        };
    }

    private static QueueTicketDto MapTicketToDto(QueueTicket t)
    {
        return new QueueTicketDto
        {
            Id = t.Id,
            SessionId = t.SessionId,
            PatientId = t.PatientId,
            PatientName = t.Patient?.Name ?? string.Empty,
            DoctorId = t.DoctorId,
            DoctorName = t.Doctor?.Name ?? string.Empty,
            DoctorServiceId = t.DoctorServiceId,
            ServiceName = t.DoctorService?.ServiceName,
            TicketNumber = t.TicketNumber,
            Status = t.Status,
            IsUrgent = t.IsUrgent,
            UrgentAccepted = t.IsUrgent,
            IssuedAt = t.IssuedAt,
            CalledAt = t.CalledAt,
            VisitStartedAt = t.VisitStartedAt,
            CompletedAt = t.CompletedAt,
            Notes = t.Notes
        };
    }

    private async Task PopulatePatientQueueStatusFieldsAsync(Guid tenantId, QueueTicket ticket, QueueTicketDto dto)
    {
        dto.MyQueueNumber = ticket.TicketNumber;

        var doctor = await _context.Doctors
            .FirstOrDefaultAsync(d => d.Id == ticket.DoctorId && d.TenantId == tenantId && !d.IsDeleted);

        var sessionId = ticket.SessionId;
        var activeTickets = await _context.QueueTickets
            .Where(t => t.TenantId == tenantId
                && !t.IsDeleted
                && t.SessionId == sessionId
                && t.DoctorId == ticket.DoctorId
                && (t.Status == TicketStatus.Waiting || t.Status == TicketStatus.Called || t.Status == TicketStatus.InVisit))
            .ToListAsync();

        var ordered = OrderTicketsByUrgentMode(activeTickets);
        var current = ordered.FirstOrDefault(t => t.Status == TicketStatus.InVisit || t.Status == TicketStatus.Called);

        dto.CurrentServingNumber = current?.TicketNumber;

        var myIndex = ordered.FindIndex(t => t.Id == ticket.Id);
        if (myIndex < 0)
        {
            dto.PatientsAheadCount = 0;
            dto.EstimatedWaitMinutes = 0;
            dto.EstimatedWaitText = "Now";
            return;
        }

        var aheadCount = ordered.Take(myIndex).Count(t => t.Status == TicketStatus.Waiting || t.Status == TicketStatus.Called || t.Status == TicketStatus.InVisit);
        dto.PatientsAheadCount = aheadCount;

        var avgMinutes = Math.Max(doctor?.AvgVisitDurationMinutes ?? 15, 1);
        var estimated = aheadCount * avgMinutes;
        dto.EstimatedWaitMinutes = estimated;
        dto.EstimatedWaitText = estimated <= 0 ? "Now" : $"~{estimated} min";
    }

    private async Task EnrichTicketFinancialAndServiceMetadataAsync(Guid tenantId, List<QueueTicketDto> tickets)
    {
        if (!tickets.Any())
            return;

        var ticketIds = tickets.Select(t => t.Id).Distinct().ToList();

        var visits = await _context.Visits
            .Where(v => v.TenantId == tenantId && !v.IsDeleted && v.QueueTicketId.HasValue && ticketIds.Contains(v.QueueTicketId.Value))
            .Select(v => new { v.Id, v.QueueTicketId })
            .ToListAsync();

        var visitByTicketId = visits
            .Where(v => v.QueueTicketId.HasValue)
            .GroupBy(v => v.QueueTicketId!.Value)
            .ToDictionary(g => g.Key, g => g.First().Id);

        if (!visitByTicketId.Any())
            return;

        var visitIds = visitByTicketId.Values.ToList();
        var invoices = await _context.Invoices
            .Include(i => i.LineItems.Where(li => !li.IsDeleted))
            .Include(i => i.Payments.Where(p => !p.IsDeleted))
            .Where(i => i.TenantId == tenantId && !i.IsDeleted && visitIds.Contains(i.VisitId))
            .ToListAsync();

        var invoiceByVisitId = invoices
            .GroupBy(i => i.VisitId)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(x => x.CreatedAt).First());

        foreach (var ticket in tickets)
        {
            if (!visitByTicketId.TryGetValue(ticket.Id, out var visitId))
                continue;
            ticket.VisitId = visitId;
            if (!invoiceByVisitId.TryGetValue(visitId, out var invoice))
                continue;
            ticket.InvoiceId = invoice.Id;

            var activePayments = invoice.Payments?.Where(p => !p.IsDeleted).ToList() ?? new List<Payment>();
            var hasPaymentRows = activePayments.Count > 0;
            var paidAmount = hasPaymentRows
                ? Math.Max(activePayments.Sum(p => p.Amount), 0m)
                : invoice.PaidAmount;
            var totalRefunded = activePayments.Where(p => p.Amount < 0).Sum(p => Math.Abs(p.Amount));
            var isFullyRefunded = totalRefunded >= invoice.Amount && paidAmount <= 0m;
            var remainingAmount = isFullyRefunded ? 0m : Math.Max(invoice.Amount - paidAmount, 0m);
            var status = isFullyRefunded
                ? InvoiceStatus.Refunded
                : remainingAmount <= 0 ? InvoiceStatus.Paid
                : paidAmount > 0 ? InvoiceStatus.PartiallyPaid : InvoiceStatus.Unpaid;

            ticket.InvoiceAmount = invoice.Amount;
            ticket.PaidAmount = paidAmount;
            ticket.RemainingAmount = remainingAmount;
            ticket.InvoiceStatus = status;

            if (!ticket.DoctorServiceId.HasValue)
            {
                ticket.DoctorServiceId = invoice.LineItems?
                    .Where(li => !li.IsDeleted && li.ClinicServiceId.HasValue)
                    .OrderBy(li => li.CreatedAt)
                    .Select(li => li.ClinicServiceId)
                    .FirstOrDefault();
            }

            if (string.IsNullOrWhiteSpace(ticket.ServiceName))
            {
                ticket.ServiceName = invoice.LineItems?
                    .Where(li => !li.IsDeleted && !string.IsNullOrWhiteSpace(li.ItemName))
                    .OrderBy(li => li.CreatedAt)
                    .Select(li => li.ItemName)
                    .FirstOrDefault();
            }
        }
    }

    private static List<QueueTicket> OrderTicketsByUrgentMode(List<QueueTicket> tickets)
    {
        if (!tickets.Any())
            return tickets;

        var doctor = tickets.First().Doctor;
        var urgentEnabled = IsUrgentEnabledForDoctor(doctor);
        var urgentInsertAfterCount = ResolveUrgentInsertAfterCount(doctor);

        var active = tickets
            .Where(t => t.Status == TicketStatus.InVisit || t.Status == TicketStatus.Called || t.Status == TicketStatus.Waiting)
            .OrderBy(t => t.IssuedAt)
            .ToList();
        var inactive = tickets
            .Where(t => t.Status != TicketStatus.InVisit && t.Status != TicketStatus.Called && t.Status != TicketStatus.Waiting)
            .OrderByDescending(t => t.UpdatedAt)
            .ToList();

        var current = active.Where(t => t.Status == TicketStatus.InVisit || t.Status == TicketStatus.Called).OrderBy(t => t.CalledAt ?? t.VisitStartedAt ?? t.IssuedAt).ToList();
        var waiting = active.Where(t => t.Status == TicketStatus.Waiting).OrderBy(t => t.IssuedAt).ToList();

        if (!urgentEnabled)
        {
            waiting = waiting.OrderBy(t => t.IssuedAt).ToList();
        }
        else if (urgentInsertAfterCount <= 0)
        {
            waiting = waiting.OrderBy(t => t.IsUrgent ? 0 : 1).ThenBy(t => t.IssuedAt).ToList();
        }
        else
        {
            waiting = BuildUrgentAfterCount(waiting, urgentInsertAfterCount);
        }

        return current.Concat(waiting).Concat(inactive).ToList();
    }

    private static bool IsUrgentEnabledForDoctor(Doctor? doctor)
    {
        if (doctor == null)
            return true;

        return doctor.UrgentEnabled && doctor.UrgentCaseMode != UrgentCaseMode.Disabled;
    }

    private static int ResolveUrgentInsertAfterCount(Doctor? doctor)
    {
        if (doctor == null)
            return 0;

        var normalized = doctor.UrgentInsertAfterCount;
        if (normalized >= 0 && normalized <= 3)
        {
            if (normalized == 0 && doctor.UrgentCaseMode == UrgentCaseMode.UrgentBucket)
                return 2;

            return normalized;
        }

        return doctor.UrgentCaseMode switch
        {
            UrgentCaseMode.UrgentBucket => 2,
            UrgentCaseMode.UrgentFront => 0,
            UrgentCaseMode.UrgentNext => 0,
            _ => 0
        };
    }

    private static List<QueueTicket> BuildUrgentNext(List<QueueTicket> waiting)
    {
        var urgent = waiting.Where(t => t.IsUrgent).OrderBy(t => t.IssuedAt).FirstOrDefault();
        if (urgent == null)
            return waiting;

        var rest = waiting.Where(t => t.Id != urgent.Id).OrderBy(t => t.IssuedAt).ToList();
        var result = new List<QueueTicket> { urgent };
        result.AddRange(rest);
        return result;
    }

    private static List<QueueTicket> BuildUrgentBucket(List<QueueTicket> waiting)
    {
        var urgent = new Queue<QueueTicket>(waiting.Where(t => t.IsUrgent).OrderBy(t => t.IssuedAt));
        var regular = new Queue<QueueTicket>(waiting.Where(t => !t.IsUrgent).OrderBy(t => t.IssuedAt));
        var result = new List<QueueTicket>();

        while (urgent.Count > 0 || regular.Count > 0)
        {
            if (regular.Count > 0)
                result.Add(regular.Dequeue());
            if (regular.Count > 0)
                result.Add(regular.Dequeue());
            if (urgent.Count > 0)
                result.Add(urgent.Dequeue());
        }

        return result;
    }

    private static List<QueueTicket> BuildUrgentAfterCount(List<QueueTicket> waiting, int afterCount)
    {
        var urgent = new Queue<QueueTicket>(waiting.Where(t => t.IsUrgent).OrderBy(t => t.IssuedAt));
        var regular = new Queue<QueueTicket>(waiting.Where(t => !t.IsUrgent).OrderBy(t => t.IssuedAt));
        var result = new List<QueueTicket>();

        var safeAfterCount = Math.Max(afterCount, 1);

        while (urgent.Count > 0 || regular.Count > 0)
        {
            for (var i = 0; i < safeAfterCount && regular.Count > 0; i++)
            {
                result.Add(regular.Dequeue());
            }

            if (urgent.Count > 0)
                result.Add(urgent.Dequeue());

            if (regular.Count == 0 && urgent.Count > 0)
                result.Add(urgent.Dequeue());
        }

        return result;
    }

    private async Task PreserveCreditForUnservedTicketAsync(Guid tenantId, Guid ticketId, CreditReason reason, Guid? sessionId = null)
    {
        var visit = await _context.Visits
            .FirstOrDefaultAsync(v => v.TenantId == tenantId && !v.IsDeleted && v.QueueTicketId == ticketId);
        if (visit == null)
            return;

        if (reason == CreditReason.NoShowRetainedByPolicy)
        {
            var settings = await _context.ClinicSettings.FirstOrDefaultAsync(s => s.TenantId == tenantId && !s.IsDeleted);
            if (settings == null || !settings.RetainCreditOnNoShow)
                return;
        }

        var invoice = await _context.Invoices
            .FirstOrDefaultAsync(i => i.TenantId == tenantId && !i.IsDeleted && i.VisitId == visit.Id);
        if (invoice == null || invoice.PaidAmount <= 0 || invoice.IsServiceRendered)
            return;

        invoice.CreditAmount = invoice.PaidAmount;
        invoice.CreditIssuedAt = DateTime.UtcNow;
        invoice.Notes = string.IsNullOrWhiteSpace(invoice.Notes)
            ? "Credit entitlement preserved due to unserved session closure"
            : $"{invoice.Notes} | Credit entitlement preserved due to unserved session closure";

        await _patientCreditService.IssueCreditAsync(tenantId, new IssuePatientCreditRequest
        {
            PatientId = visit.PatientId,
            Amount = invoice.PaidAmount,
            Reason = reason,
            InvoiceId = invoice.Id,
            QueueTicketId = ticketId,
            QueueSessionId = sessionId,
            Notes = invoice.Notes
        });

    }

    private async Task<Doctor?> ResolveCallerDoctorAsync(Guid tenantId, Guid callerUserId)
    {
        var isDoctorRole = await IsUserInRoleAsync(callerUserId, "Doctor");
        if (!isDoctorRole)
            return null;

        return await _context.Doctors
            .FirstOrDefaultAsync(d => d.UserId == callerUserId && d.TenantId == tenantId && !d.IsDeleted);
    }

    private async Task<bool> IsUserInRoleAsync(Guid userId, string roleName)
    {
        var normalizedRole = roleName.ToUpperInvariant();
        return await (from ur in _context.UserRoles
                      join r in _context.Roles on ur.RoleId equals r.Id
                      where ur.UserId == userId && r.NormalizedName == normalizedRole
                      select ur.UserId)
            .AnyAsync();
    }
}
