using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;
using EliteClinic.Domain.Entities;
using EliteClinic.Domain.Enums;
using EliteClinic.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EliteClinic.Application.Features.Clinic.Services;

public class VisitService : IVisitService
{
    private readonly EliteClinicDbContext _context;

    public VisitService(EliteClinicDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<VisitDto>> CreateVisitAsync(Guid tenantId, CreateVisitRequest request, Guid callerUserId)
    {
        var callerDoctor = await ResolveCallerDoctorAsync(tenantId, callerUserId);
        QueueTicket? linkedTicket = null;

        // Validate doctor
        var doctor = await _context.Doctors.FirstOrDefaultAsync(d => d.Id == request.DoctorId && d.TenantId == tenantId && !d.IsDeleted);
        if (doctor == null)
            return ApiResponse<VisitDto>.Error("Doctor not found");

        if (callerDoctor != null && doctor.Id != callerDoctor.Id)
            return ApiResponse<VisitDto>.Error("Doctors can only create visits for themselves");

        // Validate patient
        var patient = await _context.Patients.FirstOrDefaultAsync(p => p.Id == request.PatientId && p.TenantId == tenantId && !p.IsDeleted);
        if (patient == null)
            return ApiResponse<VisitDto>.Error("Patient not found");

        // If from ticket, validate and link
        if (request.QueueTicketId.HasValue)
        {
            linkedTicket = await _context.QueueTickets
                .FirstOrDefaultAsync(t => t.Id == request.QueueTicketId.Value && t.TenantId == tenantId && !t.IsDeleted);
            if (linkedTicket == null)
                return ApiResponse<VisitDto>.Error("Queue ticket not found");

            // Check no visit already linked
            var existingVisit = await _context.Visits
                .FirstOrDefaultAsync(v => v.QueueTicketId == request.QueueTicketId.Value && !v.IsDeleted);
            if (existingVisit != null)
                return ApiResponse<VisitDto>.Error("A visit already exists for this ticket");

            // Update ticket status
            if (linkedTicket.Status == TicketStatus.Called || linkedTicket.Status == TicketStatus.Waiting)
            {
                linkedTicket.Status = TicketStatus.InVisit;
                linkedTicket.VisitStartedAt = DateTime.UtcNow;
            }

            if (string.IsNullOrWhiteSpace(request.Complaint) && !string.IsNullOrWhiteSpace(linkedTicket.Notes))
                request.Complaint = linkedTicket.Notes;
        }

        var visit = new Visit
        {
            TenantId = tenantId,
            VisitType = request.VisitType,
            Source = linkedTicket?.Source ?? request.Source,
            BranchId = linkedTicket?.BranchId ?? request.BranchId,
            QueueTicketId = request.QueueTicketId,
            DoctorId = request.DoctorId,
            PatientId = request.PatientId,
            Status = VisitStatus.Open,
            Complaint = request.Complaint,
            Notes = request.Notes,
            StartedAt = DateTime.UtcNow
        };

        _context.Visits.Add(visit);
        await _context.SaveChangesAsync();

        var saved = await GetVisitWithIncludes(tenantId, visit.Id);
        return ApiResponse<VisitDto>.Created(MapVisitToDto(saved!), "Visit created successfully");
    }

    public async Task<ApiResponse<VisitDto>> UpdateVisitAsync(Guid tenantId, Guid visitId, UpdateVisitRequest request, Guid callerUserId)
    {
        var visit = await GetVisitWithIncludes(tenantId, visitId);
        if (visit == null)
            return ApiResponse<VisitDto>.Error("Visit not found");

        if (visit.Status != VisitStatus.Open)
            return ApiResponse<VisitDto>.Error("Cannot update a completed visit");

        // Same-day edit check for doctors
        var doctor = await _context.Doctors.FirstOrDefaultAsync(d => d.UserId == callerUserId && d.TenantId == tenantId && !d.IsDeleted);
        if (doctor != null && visit.DoctorId != doctor.Id)
            return ApiResponse<VisitDto>.Error("You can only edit your own visits");
        if (doctor != null && visit.StartedAt.Date != DateTime.UtcNow.Date)
            return ApiResponse<VisitDto>.Error("You can only edit visits from today");

        visit.Complaint = request.Complaint;
        visit.Diagnosis = request.Diagnosis;
        visit.Notes = request.Notes;
        visit.BloodPressureSystolic = request.BloodPressureSystolic;
        visit.BloodPressureDiastolic = request.BloodPressureDiastolic;
        visit.HeartRate = request.HeartRate;
        visit.Temperature = request.Temperature;
        visit.Weight = request.Weight;
        visit.Height = request.Height;
        visit.BMI = request.BMI;
        visit.BloodSugar = request.BloodSugar;
        visit.OxygenSaturation = request.OxygenSaturation;
        visit.RespiratoryRate = request.RespiratoryRate;
        visit.FollowUpDate = request.FollowUpDate;

        await _context.SaveChangesAsync();

        var updated = await GetVisitWithIncludes(tenantId, visitId);
        return ApiResponse<VisitDto>.Ok(MapVisitToDto(updated!), "Visit updated successfully");
    }

    public async Task<ApiResponse<VisitDto>> CompleteVisitAsync(Guid tenantId, Guid visitId, CompleteVisitRequest request, Guid callerUserId)
    {
        var visit = await GetVisitWithIncludes(tenantId, visitId);
        if (visit == null)
            return ApiResponse<VisitDto>.Error("Visit not found");

        var callerDoctor = await ResolveCallerDoctorAsync(tenantId, callerUserId);
        if (callerDoctor != null && visit.DoctorId != callerDoctor.Id)
            return ApiResponse<VisitDto>.Error("You can only complete your own visits");

        if (visit.Status != VisitStatus.Open)
            return ApiResponse<VisitDto>.Error("Visit is already completed");

        visit.Status = VisitStatus.Completed;
        visit.CompletedAt = DateTime.UtcNow;
        visit.LifecycleState = EncounterLifecycleState.MedicallyCompleted;
        visit.MedicallyCompletedAt = DateTime.UtcNow;
        if (!string.IsNullOrEmpty(request.Diagnosis))
            visit.Diagnosis = request.Diagnosis;
        if (!string.IsNullOrEmpty(request.Notes))
            visit.Notes = request.Notes;

        // Also complete the linked ticket if it exists
        if (visit.QueueTicketId.HasValue)
        {
            var ticket = await _context.QueueTickets
                .FirstOrDefaultAsync(t => t.Id == visit.QueueTicketId.Value && !t.IsDeleted);
            if (ticket != null && ticket.Status == TicketStatus.InVisit)
            {
                ticket.Status = TicketStatus.Completed;
                ticket.CompletedAt = DateTime.UtcNow;
            }
        }

        var invoice = await _context.Invoices
            .FirstOrDefaultAsync(i => i.TenantId == tenantId && !i.IsDeleted && i.VisitId == visit.Id);
        if (invoice != null)
        {
            var pendingSettlementEnabled = await _context.TenantFeatureFlags
                .Where(f => f.TenantId == tenantId && !f.IsDeleted)
                .Select(f => f.EncounterPendingSettlementEnabled)
                .FirstOrDefaultAsync();

            invoice.IsServiceRendered = true;

            if (invoice.RemainingAmount <= 0)
            {
                invoice.HasPendingSettlement = false;
                invoice.PendingSettlementAmount = 0;
                visit.FinancialState = EncounterFinancialState.FinanciallySettled;
                visit.FinanciallySettledAt = DateTime.UtcNow;
                visit.LifecycleState = EncounterLifecycleState.FullyClosed;
                visit.FullyClosedAt = DateTime.UtcNow;
            }
            else if (pendingSettlementEnabled)
            {
                invoice.HasPendingSettlement = true;
                invoice.PendingSettlementAmount = invoice.RemainingAmount;
                visit.FinancialState = EncounterFinancialState.PendingSettlement;
            }
            else
            {
                invoice.HasPendingSettlement = false;
                invoice.PendingSettlementAmount = 0;
                visit.FinancialState = EncounterFinancialState.NotStarted;
            }
        }

        await _context.SaveChangesAsync();

        var updated = await GetVisitWithIncludes(tenantId, visitId);
        return ApiResponse<VisitDto>.Ok(MapVisitToDto(updated!), "Visit completed successfully");
    }

    public async Task<ApiResponse<VisitDto>> GetVisitByIdAsync(Guid tenantId, Guid visitId, Guid callerUserId)
    {
        var visit = await GetVisitWithIncludes(tenantId, visitId);
        if (visit == null)
            return ApiResponse<VisitDto>.Error("Visit not found");

        var callerDoctor = await ResolveCallerDoctorAsync(tenantId, callerUserId);
        if (callerDoctor != null && visit.DoctorId != callerDoctor.Id)
            return ApiResponse<VisitDto>.Error("Doctors can only access their own visits");

        var dto = MapVisitToDto(visit);
        dto.ChronicProfile = MapChronicProfile(await GetChronicProfileAsync(tenantId, visit.PatientId));
        return ApiResponse<VisitDto>.Ok(dto, "Visit retrieved successfully");
    }

    public async Task<ApiResponse<PagedResult<VisitDto>>> GetPatientVisitsAsync(Guid tenantId, Guid patientId, Guid callerUserId, int pageNumber = 1, int pageSize = 10)
    {
        var callerDoctor = await ResolveCallerDoctorAsync(tenantId, callerUserId);

        var query = _context.Visits
            .Include(v => v.Doctor)
            .Include(v => v.Patient)
            .Include(v => v.Prescriptions.Where(p => !p.IsDeleted))
            .Include(v => v.LabRequests.Where(l => !l.IsDeleted))
            .Include(v => v.Invoice)
            .Where(v => v.PatientId == patientId && v.TenantId == tenantId);

        if (callerDoctor != null)
            query = query.Where(v => v.DoctorId == callerDoctor.Id);

        var totalCount = await query.CountAsync();
        var visits = await query
            .OrderByDescending(v => v.StartedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var patientIds = visits.Select(v => v.PatientId).Distinct().ToList();
        var chronicByPatientId = await _context.PatientChronicProfiles
            .Where(c => c.TenantId == tenantId && !c.IsDeleted && patientIds.Contains(c.PatientId))
            .ToDictionaryAsync(c => c.PatientId, c => c);

        var mappedItems = visits.Select(v =>
        {
            var dto = MapVisitToDto(v);
            dto.ChronicProfile = chronicByPatientId.TryGetValue(v.PatientId, out var cp) ? MapChronicProfile(cp) : null;
            return dto;
        }).ToList();

        var result = new PagedResult<VisitDto>
        {
            Items = mappedItems,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };

        return ApiResponse<PagedResult<VisitDto>>.Ok(result, $"Retrieved {result.Items.Count} visit(s)");
    }

    public async Task<ApiResponse<PatientSummaryDto>> GetPatientSummaryAsync(Guid tenantId, Guid patientId, Guid callerUserId)
    {
        var callerDoctor = await ResolveCallerDoctorAsync(tenantId, callerUserId);

        var patient = await _context.Patients
            .FirstOrDefaultAsync(p => p.Id == patientId && p.TenantId == tenantId && !p.IsDeleted);
        if (patient == null)
            return ApiResponse<PatientSummaryDto>.Error("Patient not found");

        if (callerDoctor != null)
        {
            var hasVisitWithDoctor = await _context.Visits
                .AnyAsync(v => v.TenantId == tenantId && !v.IsDeleted && v.PatientId == patientId && v.DoctorId == callerDoctor.Id);
            if (!hasVisitWithDoctor)
                return ApiResponse<PatientSummaryDto>.Error("Doctors can only access summaries for their own patients");
        }

        var visitsCountQuery = _context.Visits
            .Where(v => v.PatientId == patientId && v.TenantId == tenantId && !v.IsDeleted);

        if (callerDoctor != null)
            visitsCountQuery = visitsCountQuery.Where(v => v.DoctorId == callerDoctor.Id);

        var totalVisits = await visitsCountQuery.CountAsync();

        var recentVisitsQuery = _context.Visits
            .Include(v => v.Doctor)
            .Where(v => v.PatientId == patientId && v.TenantId == tenantId && !v.IsDeleted);

        if (callerDoctor != null)
            recentVisitsQuery = recentVisitsQuery.Where(v => v.DoctorId == callerDoctor.Id);

        var recentVisits = await recentVisitsQuery
            .OrderByDescending(v => v.StartedAt)
            .Take(5)
            .ToListAsync();

        var summary = new PatientSummaryDto
        {
            PatientId = patient.Id,
            Name = patient.Name,
            Phone = patient.Phone,
            DateOfBirth = patient.DateOfBirth,
            Gender = patient.Gender.ToString(),
            TotalVisits = totalVisits,
            RecentVisits = recentVisits.Select(v => new VisitSummaryDto
            {
                Id = v.Id,
                DoctorName = v.Doctor?.Name ?? string.Empty,
                Complaint = v.Complaint,
                Diagnosis = v.Diagnosis,
                StartedAt = v.StartedAt,
                CompletedAt = v.CompletedAt
            }).ToList()
        };

        return ApiResponse<PatientSummaryDto>.Ok(summary, "Patient summary retrieved successfully");
    }

    public async Task<ApiResponse<PagedResult<VisitDto>>> GetMyVisitsAsync(Guid tenantId, Guid doctorUserId, MyVisitsFilterRequest request)
    {
        var doctor = await ResolveCallerDoctorAsync(tenantId, doctorUserId);
        if (doctor == null)
            return ApiResponse<PagedResult<VisitDto>>.Error("Doctor profile not found");

        var pageNumber = request.PageNumber <= 0 ? 1 : request.PageNumber;
        var pageSize = request.PageSize <= 0 ? 20 : Math.Min(request.PageSize, 200);

        var query = _context.Visits
            .Include(v => v.Doctor)
            .Include(v => v.Patient)
            .Include(v => v.Prescriptions.Where(p => !p.IsDeleted))
            .Include(v => v.LabRequests.Where(l => !l.IsDeleted))
            .Include(v => v.Invoice)
                .ThenInclude(i => i!.Payments.Where(p => !p.IsDeleted))
            .Where(v => v.TenantId == tenantId && !v.IsDeleted && v.DoctorId == doctor.Id);

        if (request.FromDate.HasValue)
        {
            var from = request.FromDate.Value.Date;
            query = query.Where(v => v.StartedAt >= from);
        }

        if (request.ToDate.HasValue)
        {
            var toExclusive = request.ToDate.Value.Date.AddDays(1);
            query = query.Where(v => v.StartedAt < toExclusive);
        }

        if (request.Source.HasValue)
            query = query.Where(v => v.Source == request.Source.Value);

        if (request.VisitType.HasValue)
            query = query.Where(v => v.VisitType == request.VisitType.Value);

        if (request.Status.HasValue)
            query = query.Where(v => v.Status == request.Status.Value);

        if (request.IsBooking.HasValue)
        {
            query = request.IsBooking.Value
                ? query.Where(v => v.Source == VisitSource.Booking
                    || v.Source == VisitSource.ConsultationBooking
                    || v.Source == VisitSource.PatientSelfServiceBooking)
                : query.Where(v => v.Source != VisitSource.Booking
                    && v.Source != VisitSource.ConsultationBooking
                    && v.Source != VisitSource.PatientSelfServiceBooking);
        }

        if (request.IsExam.HasValue)
        {
            query = request.IsExam.Value
                ? query.Where(v => v.VisitType == VisitType.Exam)
                : query.Where(v => v.VisitType != VisitType.Exam);
        }

        if (request.IsConsultation.HasValue)
        {
            query = request.IsConsultation.Value
                ? query.Where(v => v.VisitType == VisitType.Consultation)
                : query.Where(v => v.VisitType != VisitType.Consultation);
        }

        var totalCount = await query.CountAsync();
        var visits = await query
            .OrderByDescending(v => v.StartedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var patientIds = visits.Select(v => v.PatientId).Distinct().ToList();
        var chronicByPatientId = await _context.PatientChronicProfiles
            .Where(c => c.TenantId == tenantId && !c.IsDeleted && patientIds.Contains(c.PatientId))
            .ToDictionaryAsync(c => c.PatientId, c => c);

        var items = visits.Select(v =>
        {
            var dto = MapVisitToDto(v);
            dto.ChronicProfile = chronicByPatientId.TryGetValue(v.PatientId, out var cp) ? MapChronicProfile(cp) : null;
            return dto;
        }).ToList();

        var result = new PagedResult<VisitDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };

        return ApiResponse<PagedResult<VisitDto>>.Ok(result, $"Retrieved {items.Count} visit(s)");
    }

    public async Task<ApiResponse<PagedResult<PatientDto>>> GetMyPatientsAsync(Guid tenantId, Guid doctorUserId, int pageNumber = 1, int pageSize = 10, string? search = null)
    {
        var doctor = await ResolveCallerDoctorAsync(tenantId, doctorUserId);
        if (doctor == null)
            return ApiResponse<PagedResult<PatientDto>>.Error("Doctor profile not found");

        var basePatientQuery = _context.Visits
            .Where(v => v.TenantId == tenantId && !v.IsDeleted && v.DoctorId == doctor.Id)
            .Select(v => v.PatientId)
            .Distinct();

        var query = _context.Patients
            .Include(p => p.User)
            .Include(p => p.SubProfiles.Where(sp => !sp.IsDeleted))
            .Where(p => p.TenantId == tenantId && !p.IsDeleted && basePatientQuery.Contains(p.Id));

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(s) || p.Phone.Contains(s));
        }

        var totalCount = await query.CountAsync();
        var patients = await query
            .OrderByDescending(p => p.UpdatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var items = patients.Select(p => new PatientDto
        {
            Id = p.Id,
            UserId = p.UserId,
            Name = p.Name,
            Phone = p.Phone,
            DateOfBirth = p.DateOfBirth,
            Gender = p.Gender,
            Address = p.Address,
            Notes = p.Notes,
            IsDefault = p.IsDefault,
            ParentPatientId = p.ParentPatientId,
            Username = p.User.UserName ?? string.Empty,
            SubProfiles = p.SubProfiles.Select(sp => new PatientSubProfileDto
            {
                Id = sp.Id,
                Name = sp.Name,
                Phone = sp.Phone,
                DateOfBirth = sp.DateOfBirth,
                Gender = sp.Gender,
                IsDefault = sp.IsDefault
            }).ToList(),
            CreatedAt = p.CreatedAt
        }).ToList();

        return ApiResponse<PagedResult<PatientDto>>.Ok(new PagedResult<PatientDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        }, $"Retrieved {items.Count} patient(s)");
    }

    public async Task<ApiResponse<PagedResult<VisitDto>>> GetPatientVisitsForOwnedProfileAsync(Guid tenantId, Guid patientUserId, Guid patientId, int pageNumber = 1, int pageSize = 10)
    {
        var profile = await _context.Patients
            .FirstOrDefaultAsync(p => p.Id == patientId && p.TenantId == tenantId && !p.IsDeleted);
        if (profile == null)
            return ApiResponse<PagedResult<VisitDto>>.Error("Patient profile not found");

        if (profile.UserId != patientUserId)
            return ApiResponse<PagedResult<VisitDto>>.Error("Access denied to requested patient profile");

        return await GetPatientVisitsAsync(tenantId, patientId, callerUserId: Guid.Empty, pageNumber, pageSize);
    }

    public async Task<ApiResponse<PatientSummaryDto>> GetPatientSummaryForOwnedProfileAsync(Guid tenantId, Guid patientUserId, Guid patientId)
    {
        var profile = await _context.Patients
            .FirstOrDefaultAsync(p => p.Id == patientId && p.TenantId == tenantId && !p.IsDeleted);
        if (profile == null)
            return ApiResponse<PatientSummaryDto>.Error("Patient profile not found");

        if (profile.UserId != patientUserId)
            return ApiResponse<PatientSummaryDto>.Error("Access denied to requested patient profile");

        var visits = await _context.Visits
            .Include(v => v.Doctor)
            .Where(v => v.PatientId == patientId && v.TenantId == tenantId && !v.IsDeleted)
            .OrderByDescending(v => v.StartedAt)
            .ToListAsync();

        var summary = new PatientSummaryDto
        {
            PatientId = profile.Id,
            Name = profile.Name,
            Phone = profile.Phone,
            DateOfBirth = profile.DateOfBirth,
            Gender = profile.Gender.ToString(),
            TotalVisits = visits.Count,
            RecentVisits = visits.Take(5).Select(v => new VisitSummaryDto
            {
                Id = v.Id,
                DoctorName = v.Doctor?.Name ?? string.Empty,
                Complaint = v.Complaint,
                Diagnosis = v.Diagnosis,
                StartedAt = v.StartedAt,
                CompletedAt = v.CompletedAt
            }).ToList()
        };

        return ApiResponse<PatientSummaryDto>.Ok(summary, "Patient summary retrieved successfully");
    }

    public async Task<ApiResponse<List<StaleOpenVisitDto>>> GetStaleOpenVisitsAsync(Guid tenantId, int olderThanHours = 12)
    {
        var safeHours = Math.Max(olderThanHours, 1);
        var threshold = DateTime.UtcNow.AddHours(-safeHours);

        var staleVisits = await _context.Visits
            .Include(v => v.Patient)
            .Include(v => v.Doctor)
            .Include(v => v.QueueTicket)
            .Where(v => v.TenantId == tenantId && !v.IsDeleted && v.Status == VisitStatus.Open && v.StartedAt <= threshold)
            .OrderBy(v => v.StartedAt)
            .ToListAsync();

        var dtos = staleVisits.Select(v => new StaleOpenVisitDto
        {
            VisitId = v.Id,
            PatientId = v.PatientId,
            PatientName = v.Patient?.Name ?? string.Empty,
            DoctorId = v.DoctorId,
            DoctorName = v.Doctor?.Name ?? string.Empty,
            QueueTicketId = v.QueueTicketId,
            Complaint = v.Complaint,
            StartedAt = v.StartedAt,
            AgeHours = (DateTime.UtcNow - v.StartedAt).TotalHours,
            HasActiveQueueTicket = v.QueueTicket != null &&
                (v.QueueTicket.Status == TicketStatus.Waiting || v.QueueTicket.Status == TicketStatus.Called || v.QueueTicket.Status == TicketStatus.InVisit)
        }).ToList();

        return ApiResponse<List<StaleOpenVisitDto>>.Ok(dtos, $"Retrieved {dtos.Count} stale open visit(s)");
    }

    public async Task<ApiResponse<VisitDto>> CloseStaleVisitAsync(Guid tenantId, Guid visitId, CloseStaleVisitRequest request)
    {
        var visit = await _context.Visits
            .Include(v => v.QueueTicket)
            .FirstOrDefaultAsync(v => v.Id == visitId && v.TenantId == tenantId && !v.IsDeleted);
        if (visit == null)
            return ApiResponse<VisitDto>.Error("Visit not found");

        if (visit.Status != VisitStatus.Open)
            return ApiResponse<VisitDto>.Error("Visit is already closed");

        visit.Status = VisitStatus.Completed;
        visit.CompletedAt = DateTime.UtcNow;
        visit.LifecycleState = EncounterLifecycleState.MedicallyCompleted;
        visit.MedicallyCompletedAt = DateTime.UtcNow;
        visit.Notes = string.IsNullOrWhiteSpace(visit.Notes)
            ? $"Stale open visit closed by maintenance. {request.ResolutionNote}".Trim()
            : $"{visit.Notes} | Stale open visit closed by maintenance. {request.ResolutionNote}".Trim();

        if (visit.QueueTicket != null && request.MarkQueueTicketNoShow)
        {
            if (visit.QueueTicket.Status == TicketStatus.Waiting || visit.QueueTicket.Status == TicketStatus.Called || visit.QueueTicket.Status == TicketStatus.InVisit)
            {
                visit.QueueTicket.Status = TicketStatus.NoShow;
                visit.QueueTicket.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync();

        var saved = await GetVisitWithIncludes(tenantId, visitId);
        return ApiResponse<VisitDto>.Ok(MapVisitToDto(saved!), "Stale visit closed successfully");
    }

    // ── Helpers ────────────────────────────────────────────────────

    private async Task<Visit?> GetVisitWithIncludes(Guid tenantId, Guid id)
    {
        return await _context.Visits
            .Include(v => v.Doctor)
            .Include(v => v.Patient)
            .Include(v => v.QueueTicket)
                .ThenInclude(t => t!.DoctorService)
            .Include(v => v.Prescriptions.Where(p => !p.IsDeleted))
            .Include(v => v.LabRequests.Where(l => !l.IsDeleted))
            .Include(v => v.Invoice)
                .ThenInclude(i => i!.LineItems.Where(li => !li.IsDeleted))
            .Include(v => v.Invoice)
                .ThenInclude(i => i!.Payments.Where(p => !p.IsDeleted))
            .FirstOrDefaultAsync(v => v.Id == id && v.TenantId == tenantId && !v.IsDeleted);
    }

    private async Task<PatientChronicProfile?> GetChronicProfileAsync(Guid tenantId, Guid patientId)
    {
        return await _context.PatientChronicProfiles
            .FirstOrDefaultAsync(c => c.TenantId == tenantId && !c.IsDeleted && c.PatientId == patientId);
    }

    private static PatientChronicProfileDto? MapChronicProfile(PatientChronicProfile? profile)
    {
        if (profile == null)
            return null;

        return new PatientChronicProfileDto
        {
            Id = profile.Id,
            PatientId = profile.PatientId,
            Diabetes = profile.Diabetes,
            Hypertension = profile.Hypertension,
            CardiacDisease = profile.CardiacDisease,
            Asthma = profile.Asthma,
            Other = profile.Other,
            OtherNotes = profile.OtherNotes,
            RecordedByUserId = profile.RecordedByUserId,
            UpdatedAt = profile.UpdatedAt
        };
    }

    internal static VisitDto MapVisitToDto(Visit v)
    {
        var serviceName = v.QueueTicket?.DoctorService?.ServiceName;
        var servicePrice = v.QueueTicket?.DoctorService?.Price;
        if (string.IsNullOrWhiteSpace(serviceName))
        {
            serviceName = v.Invoice?.LineItems?
                .Where(li => !li.IsDeleted && !string.IsNullOrWhiteSpace(li.ItemName))
                .OrderBy(li => li.CreatedAt)
                .Select(li => li.ItemName)
                .FirstOrDefault();
        }

        if (!servicePrice.HasValue)
        {
            servicePrice = v.Invoice?.LineItems?
                .Where(li => !li.IsDeleted)
                .OrderBy(li => li.CreatedAt)
                .Select(li => (decimal?)li.UnitPrice)
                .FirstOrDefault();
        }

        var activePayments = v.Invoice?.Payments?.Where(p => !p.IsDeleted).ToList() ?? new List<Payment>();
        var paidAmount = activePayments.Count > 0
            ? Math.Max(activePayments.Sum(p => p.Amount), 0m)
            : (v.Invoice?.PaidAmount ?? 0m);

        var compensationMode = (DoctorCompensationMode?)v.Doctor?.CompensationMode;
        var compensationValue = v.Doctor?.CompensationValue;
        decimal? estimatedDoctorCompensationAmount = null;
        if (compensationMode.HasValue && compensationValue.HasValue)
        {
            estimatedDoctorCompensationAmount = compensationMode.Value switch
            {
                DoctorCompensationMode.Percentage => paidAmount * compensationValue.Value / 100m,
                DoctorCompensationMode.FixedPerVisit => compensationValue.Value,
                DoctorCompensationMode.Salary => compensationValue.Value,
                _ => 0m
            };
        }

        var ticketStatus = v.QueueTicket?.Status;
        var isCancelled = ticketStatus == Domain.Enums.TicketStatus.Cancelled;

        return new VisitDto
        {
            Id = v.Id,
            BranchId = v.BranchId,
            VisitType = v.VisitType,
            Source = v.Source,
            IsBookingSource = v.Source == VisitSource.Booking
                || v.Source == VisitSource.ConsultationBooking
                || v.Source == VisitSource.PatientSelfServiceBooking,
            QueueTicketId = v.QueueTicketId,
            DoctorId = v.DoctorId,
            DoctorName = v.Doctor?.Name ?? string.Empty,
            PatientId = v.PatientId,
            PatientName = v.Patient?.Name ?? string.Empty,
            PatientPhone = v.Patient?.Phone ?? string.Empty,
            PatientDateOfBirth = v.Patient?.DateOfBirth,
            PatientGender = v.Patient?.Gender.ToString() ?? string.Empty,
            ServiceName = serviceName,
            ServicePrice = servicePrice,
            DoctorCompensationMode = compensationMode,
            DoctorCompensationValue = compensationValue,
            EstimatedDoctorCompensationAmount = estimatedDoctorCompensationAmount,
            TicketStatus = ticketStatus,
            TicketCancelledAt = v.QueueTicket?.CancelledAt,
            IsCancelled = isCancelled,
            EffectiveStatus = isCancelled ? "Cancelled" : v.Status.ToString(),
            Phone = v.Patient?.Phone ?? string.Empty,
            DateOfBirth = v.Patient?.DateOfBirth,
            Gender = v.Patient?.Gender.ToString() ?? string.Empty,
            Status = v.Status,
            LifecycleState = v.LifecycleState,
            FinancialState = v.FinancialState,
            Complaint = v.Complaint,
            Diagnosis = v.Diagnosis,
            Notes = v.Notes,
            BloodPressureSystolic = v.BloodPressureSystolic,
            BloodPressureDiastolic = v.BloodPressureDiastolic,
            HeartRate = v.HeartRate,
            Temperature = v.Temperature,
            Weight = v.Weight,
            Height = v.Height,
            BMI = v.BMI,
            BloodSugar = v.BloodSugar,
            OxygenSaturation = v.OxygenSaturation,
            RespiratoryRate = v.RespiratoryRate,
            FollowUpDate = v.FollowUpDate,
            StartedAt = v.StartedAt,
            CompletedAt = v.CompletedAt,
            MedicallyCompletedAt = v.MedicallyCompletedAt,
            FinanciallySettledAt = v.FinanciallySettledAt,
            FullyClosedAt = v.FullyClosedAt,
            Prescriptions = v.Prescriptions?.Where(p => !p.IsDeleted).Select(p => new PrescriptionDto
            {
                Id = p.Id,
                VisitId = p.VisitId,
                MedicationName = p.MedicationName,
                Dosage = p.Dosage,
                Frequency = p.Frequency,
                Duration = p.Duration,
                Instructions = p.Instructions,
                CreatedAt = p.CreatedAt
            }).ToList() ?? new(),
            LabRequests = v.LabRequests?.Where(l => !l.IsDeleted).Select(l => new LabRequestDto
            {
                Id = l.Id,
                VisitId = l.VisitId,
                TestName = l.TestName,
                Type = l.Type,
                Notes = l.Notes,
                IsUrgent = l.IsUrgent,
                ResultText = l.ResultText,
                ResultReceivedAt = l.ResultReceivedAt,
                CreatedAt = l.CreatedAt
            }).ToList() ?? new(),
            Invoice = v.Invoice != null && !v.Invoice.IsDeleted ? new InvoiceDto
            {
                Id = v.Invoice.Id,
                InvoiceNumber = v.Invoice.InvoiceNumber,
                VisitId = v.Invoice.VisitId,
                PatientId = v.Invoice.PatientId,
                PatientName = v.Patient?.Name ?? v.Invoice.PatientNameSnapshot,
                PatientPhone = v.Patient?.Phone ?? v.Invoice.PatientPhoneSnapshot,
                DoctorId = v.Invoice.DoctorId,
                DoctorName = v.Doctor?.Name ?? string.Empty,
                Amount = v.Invoice.Amount,
                PaidAmount = v.Invoice.PaidAmount,
                RemainingAmount = v.Invoice.RemainingAmount,
                Status = v.Invoice.Status,
                IsServiceRendered = v.Invoice.IsServiceRendered,
                HasPendingSettlement = v.Invoice.HasPendingSettlement,
                PendingSettlementAmount = v.Invoice.PendingSettlementAmount,
                Notes = v.Invoice.Notes,
                Payments = v.Invoice.Payments?.Where(p => !p.IsDeleted).Select(p => new PaymentDto
                {
                    Id = p.Id,
                    InvoiceId = p.InvoiceId,
                    Amount = p.Amount,
                    PaymentMethod = p.PaymentMethod,
                    ReferenceNumber = p.ReferenceNumber,
                    PaidAt = p.PaidAt,
                    Notes = p.Notes,
                    CreatedAt = p.CreatedAt
                }).ToList() ?? new(),
                CreatedAt = v.Invoice.CreatedAt
            } : null,
            CreatedAt = v.CreatedAt
        };
    }

    private async Task<Doctor?> ResolveCallerDoctorAsync(Guid tenantId, Guid callerUserId)
    {
        var isDoctorRole = await (from ur in _context.UserRoles
                                  join r in _context.Roles on ur.RoleId equals r.Id
                                  where ur.UserId == callerUserId && r.NormalizedName == "DOCTOR"
                                  select ur.UserId)
            .AnyAsync();

        if (!isDoctorRole)
            return null;

        return await _context.Doctors
            .FirstOrDefaultAsync(d => d.UserId == callerUserId && d.TenantId == tenantId && !d.IsDeleted);
    }
}
