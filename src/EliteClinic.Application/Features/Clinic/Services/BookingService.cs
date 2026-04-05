using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;
using EliteClinic.Domain.Entities;
using EliteClinic.Domain.Enums;
using EliteClinic.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EliteClinic.Application.Features.Clinic.Services;

public class BookingService : IBookingService
{
    private readonly EliteClinicDbContext _context;
    private readonly IMessageService _messageService;

    public BookingService(EliteClinicDbContext context, IMessageService messageService)
    {
        _context = context;
        _messageService = messageService;
    }

    public async Task<ApiResponse<BookingDto>> CreateAsync(Guid tenantId, Guid patientUserId, CreateBookingRequest request)
    {
        // Check feature flag
        var featureFlags = await _context.TenantFeatureFlags
            .FirstOrDefaultAsync(f => f.TenantId == tenantId && !f.IsDeleted);
        if (featureFlags == null || !featureFlags.OnlineBooking)
            return ApiResponse<BookingDto>.Error("Online booking is not enabled for this clinic");

        // Check clinic settings
        var settings = await _context.ClinicSettings
            .FirstOrDefaultAsync(cs => cs.TenantId == tenantId && !cs.IsDeleted);
        if (settings == null || !settings.BookingEnabled)
            return ApiResponse<BookingDto>.Error("Booking is not enabled in clinic settings");

        // Find patient - either by PatientId (staff workflow) or by patientUserId (patient self-booking)
        var callerIsPatient = await IsUserInRoleAsync(patientUserId, "Patient");

        Domain.Entities.Patient? patient;
        if (request.PatientId.HasValue)
        {
            patient = await _context.Patients
                .FirstOrDefaultAsync(p => p.Id == request.PatientId.Value && p.TenantId == tenantId && !p.IsDeleted);

            if (callerIsPatient && patient != null && patient.UserId != patientUserId)
                return ApiResponse<BookingDto>.Error("Access denied to requested patient profile");
        }
        else
        {
            patient = await _context.Patients
                .FirstOrDefaultAsync(p => p.UserId == patientUserId && p.TenantId == tenantId && !p.IsDeleted && p.IsDefault);
        }
        if (patient == null)
            return ApiResponse<BookingDto>.Error("Patient profile not found. Only existing patients can book.");

        // Validate doctor
        var doctor = await _context.Doctors
            .FirstOrDefaultAsync(d => d.Id == request.DoctorId && d.TenantId == tenantId && !d.IsDeleted && d.IsEnabled);
        if (doctor == null)
            return ApiResponse<BookingDto>.Error("Doctor not found or not enabled");

        // Validate service if provided (supports both legacy DoctorService and new DoctorServiceLink)
        DoctorService? service = null;
        DoctorServiceLink? linkedService = null;
        if (request.DoctorServiceId.HasValue)
        {
            service = await _context.DoctorServices
                .FirstOrDefaultAsync(ds => ds.Id == request.DoctorServiceId.Value && ds.DoctorId == request.DoctorId && !ds.IsDeleted && ds.IsActive);

            if (service == null)
            {
                linkedService = await _context.DoctorServiceLinks
                    .Include(l => l.ClinicService)
                    .FirstOrDefaultAsync(l => l.Id == request.DoctorServiceId.Value && l.DoctorId == request.DoctorId
                        && !l.IsDeleted && l.IsActive && !l.ClinicService.IsDeleted && l.ClinicService.IsActive);
            }

            if (service == null && linkedService == null)
                return ApiResponse<BookingDto>.Error("Doctor service not found or not active");
        }

        // Parse booking time
        if (!TimeSpan.TryParse(request.BookingTime, out var bookingTime))
            return ApiResponse<BookingDto>.Error("Invalid booking time format. Use HH:mm");

        // Validate booking date is in the future
        var bookingDateTime = request.BookingDate.Date + bookingTime;
        if (bookingDateTime <= DateTime.UtcNow)
            return ApiResponse<BookingDto>.Error("Booking must be in the future");

        // Check for duplicate booking (same patient, same doctor, same date/time)
        var existingBooking = await _context.Bookings
            .AnyAsync(b => b.TenantId == tenantId && b.PatientId == patient.Id && b.DoctorId == request.DoctorId
                && b.BookingDate.Date == request.BookingDate.Date && b.BookingTime == bookingTime
                && b.Status == BookingStatus.Confirmed && !b.IsDeleted);
        if (existingBooking)
            return ApiResponse<BookingDto>.Error("A booking already exists for this date and time");

        var booking = new Booking
        {
            TenantId = tenantId,
            PatientId = patient.Id,
            DoctorId = request.DoctorId,
            BranchId = request.BranchId,
            // Keep FK compatibility: only assign legacy DoctorServiceId when legacy service exists.
            DoctorServiceId = service?.Id,
            VisitType = request.VisitType,
            Source = request.Source,
            BookingDate = request.BookingDate.Date,
            BookingTime = bookingTime,
            Status = BookingStatus.Confirmed,
            Notes = linkedService != null
                ? $"{request.Notes} | ClinicServiceLink:{linkedService.Id}".Trim(' ', '|')
                : request.Notes
        };

        _context.Bookings.Add(booking);
        await _context.SaveChangesAsync();

        await TryAttachToActiveSessionAsync(tenantId, booking, patient.Id, request.DoctorId);

        await _messageService.LogWorkflowEventAsync(
            tenantId,
            nameof(MessageScenario.BookingConfirmed),
            recipientUserId: patient.UserId,
            recipientPhone: patient.Phone,
            variables: new Dictionary<string, string>
            {
                ["patientName"] = patient.Name,
                ["doctorName"] = doctor.Name,
                ["bookingDate"] = booking.BookingDate.ToString("yyyy-MM-dd"),
                ["bookingTime"] = booking.BookingTime.ToString(@"hh\:mm")
            });

        var saved = await GetBookingWithIncludes(tenantId, booking.Id);
        return ApiResponse<BookingDto>.Created(MapToDto(saved!), "Booking created successfully");
    }

    public async Task<ApiResponse<BookingDto>> CancelAsync(Guid tenantId, Guid bookingId, Guid callerUserId, CancelBookingRequest request, bool isAdministrativeAction = false)
    {
        var booking = await GetBookingWithIncludes(tenantId, bookingId);
        if (booking == null)
            return ApiResponse<BookingDto>.Error("Booking not found");

        if (booking.Status != BookingStatus.Confirmed)
            return ApiResponse<BookingDto>.Error("Only confirmed bookings can be cancelled");

        if (!isAdministrativeAction)
        {
            // Patient-facing cancellation window policy.
            var settings = await _context.ClinicSettings
                .FirstOrDefaultAsync(cs => cs.TenantId == tenantId && !cs.IsDeleted);
            var cancellationHours = settings?.CancellationWindowHours ?? 2;
            var bookingDateTime = booking.BookingDate.Date + booking.BookingTime;
            var hoursUntilBooking = (bookingDateTime - DateTime.UtcNow).TotalHours;

            if (hoursUntilBooking < cancellationHours)
                return ApiResponse<BookingDto>.Error($"Cancellation must be at least {cancellationHours} hour(s) before the appointment");
        }

        booking.Status = BookingStatus.Cancelled;
        booking.CancelledAt = DateTime.UtcNow;
        booking.CancellationReason = request.CancellationReason;
        await _context.SaveChangesAsync();

        await _messageService.LogWorkflowEventAsync(
            tenantId,
            nameof(MessageScenario.BookingCancelled),
            recipientUserId: booking.Patient?.UserId,
            recipientPhone: booking.Patient?.Phone,
            variables: new Dictionary<string, string>
            {
                ["patientName"] = booking.Patient?.Name ?? string.Empty,
                ["doctorName"] = booking.Doctor?.Name ?? string.Empty,
                ["bookingDate"] = booking.BookingDate.ToString("yyyy-MM-dd"),
                ["bookingTime"] = booking.BookingTime.ToString(@"hh\:mm"),
                ["cancelReason"] = request.CancellationReason ?? string.Empty
            });

        var updated = await GetBookingWithIncludes(tenantId, bookingId);
        return ApiResponse<BookingDto>.Ok(MapToDto(updated!), "Booking cancelled successfully");
    }

    public async Task<ApiResponse<BookingDto>> RescheduleAsync(Guid tenantId, Guid bookingId, Guid callerUserId, RescheduleBookingRequest request, bool isAdministrativeAction = false)
    {
        var booking = await GetBookingWithIncludes(tenantId, bookingId);
        if (booking == null)
            return ApiResponse<BookingDto>.Error("Booking not found");

        if (booking.Status != BookingStatus.Confirmed)
            return ApiResponse<BookingDto>.Error("Only confirmed bookings can be rescheduled");

        if (!TimeSpan.TryParse(request.BookingTime, out var bookingTime))
            return ApiResponse<BookingDto>.Error("Invalid booking time format. Use HH:mm");

        var newDateTime = request.BookingDate.Date + bookingTime;
        if (newDateTime <= DateTime.UtcNow)
            return ApiResponse<BookingDto>.Error("New booking time must be in the future");

        if (!isAdministrativeAction)
        {
            // Patient-facing cancellation window policy for self-reschedule.
            var settings = await _context.ClinicSettings
                .FirstOrDefaultAsync(cs => cs.TenantId == tenantId && !cs.IsDeleted);
            var cancellationHours = settings?.CancellationWindowHours ?? 2;
            var currentDateTime = booking.BookingDate.Date + booking.BookingTime;
            var hoursUntilBooking = (currentDateTime - DateTime.UtcNow).TotalHours;

            if (hoursUntilBooking < cancellationHours)
                return ApiResponse<BookingDto>.Error($"Rescheduling must be at least {cancellationHours} hour(s) before the appointment");
        }

        booking.BookingDate = request.BookingDate.Date;
        booking.BookingTime = bookingTime;
        booking.Status = BookingStatus.Rescheduled;
        await _context.SaveChangesAsync();

        // Re-confirm after reschedule
        booking.Status = BookingStatus.Confirmed;
        await _context.SaveChangesAsync();

        await TryAttachToActiveSessionAsync(tenantId, booking, booking.PatientId, booking.DoctorId);

        var updated = await GetBookingWithIncludes(tenantId, bookingId);
        return ApiResponse<BookingDto>.Ok(MapToDto(updated!), "Booking rescheduled successfully");
    }

    public async Task<ApiResponse<BookingDto>> GetByIdAsync(Guid tenantId, Guid bookingId)
    {
        var booking = await GetBookingWithIncludes(tenantId, bookingId);
        if (booking == null)
            return ApiResponse<BookingDto>.Error("Booking not found");

        return ApiResponse<BookingDto>.Ok(MapToDto(booking));
    }

    public async Task<ApiResponse<PagedResult<BookingDto>>> GetAllAsync(Guid tenantId, Guid? patientId, Guid? doctorId,
        string? status, int pageNumber = 1, int pageSize = 10)
    {
        var query = _context.Bookings
            .Include(b => b.Patient)
            .Include(b => b.Doctor)
            .Include(b => b.DoctorService)
            .Where(b => b.TenantId == tenantId && !b.IsDeleted);

        if (patientId.HasValue)
            query = query.Where(b => b.PatientId == patientId.Value);
        if (doctorId.HasValue)
            query = query.Where(b => b.DoctorId == doctorId.Value);
        if (!string.IsNullOrEmpty(status) && Enum.TryParse<BookingStatus>(status, true, out var statusEnum))
            query = query.Where(b => b.Status == statusEnum);

        var totalCount = await query.CountAsync();
        var bookings = await query
            .OrderByDescending(b => b.BookingDate)
            .ThenByDescending(b => b.BookingTime)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var result = new PagedResult<BookingDto>
        {
            Items = bookings.Select(MapToDto).ToList(),
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };

        return ApiResponse<PagedResult<BookingDto>>.Ok(result, $"Retrieved {result.Items.Count} booking(s)");
    }

    public async Task<ApiResponse<List<BookingDto>>> GetMyBookingsAsync(Guid tenantId, Guid patientUserId)
    {
        var patient = await _context.Patients
            .FirstOrDefaultAsync(p => p.UserId == patientUserId && p.TenantId == tenantId && !p.IsDeleted && p.IsDefault);
        if (patient == null)
            return ApiResponse<List<BookingDto>>.Error("Patient profile not found");

        return await GetBookingsForOwnedProfileAsync(tenantId, patientUserId, patient.Id);
    }

    public async Task<ApiResponse<List<BookingDto>>> GetBookingsForOwnedProfileAsync(Guid tenantId, Guid patientUserId, Guid patientId)
    {
        var patient = await _context.Patients
            .FirstOrDefaultAsync(p => p.Id == patientId && p.TenantId == tenantId && !p.IsDeleted);
        if (patient == null)
            return ApiResponse<List<BookingDto>>.Error("Patient profile not found");

        if (patient.UserId != patientUserId)
            return ApiResponse<List<BookingDto>>.Error("Access denied to requested patient profile");

        var bookings = await _context.Bookings
            .Include(b => b.Patient)
            .Include(b => b.Doctor)
            .Include(b => b.DoctorService)
            .Where(b => b.TenantId == tenantId && b.PatientId == patientId && !b.IsDeleted)
            .OrderByDescending(b => b.BookingDate)
            .ThenByDescending(b => b.BookingTime)
            .ToListAsync();

        return ApiResponse<List<BookingDto>>.Ok(bookings.Select(MapToDto).ToList(), $"Retrieved {bookings.Count} booking(s)");
    }

    // ── Helpers ────────────────────────────────────────────────────

    private async Task<Booking?> GetBookingWithIncludes(Guid tenantId, Guid id)
    {
        return await _context.Bookings
            .Include(b => b.Patient)
            .Include(b => b.Doctor)
            .Include(b => b.DoctorService)
            .FirstOrDefaultAsync(b => b.Id == id && b.TenantId == tenantId && !b.IsDeleted);
    }

    private static BookingDto MapToDto(Booking b) => new()
    {
        Id = b.Id,
        PatientId = b.PatientId,
        PatientName = b.Patient?.Name ?? string.Empty,
        PatientPhone = b.Patient?.Phone ?? string.Empty,
        DoctorId = b.DoctorId,
        DoctorName = b.Doctor?.Name ?? string.Empty,
        BranchId = b.BranchId,
        DoctorServiceId = b.DoctorServiceId,
        ServiceName = b.DoctorService?.ServiceName,
        VisitType = b.VisitType,
        Source = b.Source,
        BookingDate = b.BookingDate,
        BookingTime = b.BookingTime.ToString(@"hh\:mm"),
        Status = b.Status,
        Notes = b.Notes,
        QueueTicketId = b.QueueTicketId,
        CancelledAt = b.CancelledAt,
        CancellationReason = b.CancellationReason,
        IsOperationalNow = b.Status == BookingStatus.Confirmed
            && b.QueueTicketId == null
            && b.BookingDate.Date == DateTime.UtcNow.Date
            && (b.BookingDate.Date + b.BookingTime) <= DateTime.UtcNow.AddHours(2),
        OperationalPurpose = b.BookingDate.Date > DateTime.UtcNow.Date
            ? "FutureAppointment"
            : b.QueueTicketId.HasValue ? "QueueBridged" : "ReadyForQueueBridge",
        CreatedAt = b.CreatedAt
    };

    private async Task TryAttachToActiveSessionAsync(Guid tenantId, Booking booking, Guid patientId, Guid doctorId)
    {
        if (booking.QueueTicketId.HasValue)
            return;

        // Assumption for "current operational window": same day booking and booking time within 2 hours from now.
        var now = DateTime.UtcNow;
        var bookingDateTime = booking.BookingDate.Date + booking.BookingTime;
        var isCurrentWindow = booking.BookingDate.Date == now.Date && bookingDateTime >= now.AddMinutes(-30) && bookingDateTime <= now.AddHours(2);
        if (!isCurrentWindow)
            return;

        var activeSession = await _context.QueueSessions
            .FirstOrDefaultAsync(s => s.TenantId == tenantId && !s.IsDeleted && s.IsActive && s.DoctorId == doctorId);
        if (activeSession == null)
            return;

        var hasActiveTicket = await _context.QueueTickets
            .AnyAsync(t => t.TenantId == tenantId && !t.IsDeleted && t.PatientId == patientId
                && (t.Status == TicketStatus.Waiting || t.Status == TicketStatus.Called || t.Status == TicketStatus.InVisit));
        if (hasActiveTicket)
            return;

        var maxTicketNum = await _context.QueueTickets
            .Where(t => t.SessionId == activeSession.Id && !t.IsDeleted)
            .MaxAsync(t => (int?)t.TicketNumber) ?? 0;

        var ticket = new QueueTicket
        {
            TenantId = tenantId,
            SessionId = activeSession.Id,
            BranchId = booking.BranchId ?? activeSession.BranchId,
            PatientId = patientId,
            DoctorId = doctorId,
            DoctorServiceId = booking.DoctorServiceId,
            Source = booking.Source,
            TicketNumber = maxTicketNum + 1,
            Status = TicketStatus.Waiting,
            IssuedAt = DateTime.UtcNow,
            Notes = "Auto-created from live booking"
        };

        _context.QueueTickets.Add(ticket);
        booking.QueueTicketId = ticket.Id;
        await _context.SaveChangesAsync();
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
