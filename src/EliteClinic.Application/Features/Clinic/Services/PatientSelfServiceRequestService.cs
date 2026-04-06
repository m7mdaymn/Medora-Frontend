using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;
using EliteClinic.Domain.Entities;
using EliteClinic.Domain.Enums;
using EliteClinic.Infrastructure.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace EliteClinic.Application.Features.Clinic.Services;

public class PatientSelfServiceRequestService : IPatientSelfServiceRequestService
{
    private const long MaxSupportingDocumentSizeBytes = 10 * 1024 * 1024;

    private static readonly HashSet<string> AllowedSupportingContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp"
    };

    private static readonly HashSet<string> AllowedSupportingExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".pdf",
        ".jpg",
        ".jpeg",
        ".png",
        ".webp"
    };

    private readonly EliteClinicDbContext _context;
    private readonly IFileStorageService _fileStorageService;
    private readonly IQueueService _queueService;
    private readonly IBookingService _bookingService;

    public PatientSelfServiceRequestService(
        EliteClinicDbContext context,
        IFileStorageService fileStorageService,
        IQueueService queueService,
        IBookingService bookingService)
    {
        _context = context;
        _fileStorageService = fileStorageService;
        _queueService = queueService;
        _bookingService = bookingService;
    }

    public async Task<ApiResponse<PatientSelfServiceRequestDto>> CreateAsync(
        Guid tenantId,
        Guid callerUserId,
        CreatePatientSelfServiceRequest request,
        IFormFile paymentProof,
        List<IFormFile>? supportingDocuments,
        CancellationToken cancellationToken = default)
    {
        await ExpirePendingRequestsAsync(tenantId, cancellationToken);

        if (paymentProof == null || paymentProof.Length <= 0)
            return ApiResponse<PatientSelfServiceRequestDto>.Error("Payment proof screenshot is required");

        if (!_fileStorageService.IsSupportedImage(paymentProof))
            return ApiResponse<PatientSelfServiceRequestDto>.Error("Payment proof must be an image (PNG, JPG/JPEG, WEBP)");

        if (!_fileStorageService.IsAllowedSize(paymentProof.Length))
            return ApiResponse<PatientSelfServiceRequestDto>.Error("Payment proof exceeds maximum allowed size");

        var settings = await _context.ClinicSettings.FirstOrDefaultAsync(cancellationToken);
        if (settings == null)
            return ApiResponse<PatientSelfServiceRequestDto>.Error("Clinic settings not found");

        var ownedProfileIds = await GetOwnedProfileIdsAsync(tenantId, callerUserId, cancellationToken);
        if (!ownedProfileIds.Contains(request.PatientId))
            return ApiResponse<PatientSelfServiceRequestDto>.Error("Access denied to requested patient profile");

        var patient = await _context.Patients
            .FirstOrDefaultAsync(p => p.Id == request.PatientId && p.TenantId == tenantId && !p.IsDeleted, cancellationToken);
        if (patient == null)
            return ApiResponse<PatientSelfServiceRequestDto>.Error("Patient profile not found");

        var doctor = await _context.Doctors
            .FirstOrDefaultAsync(d => d.Id == request.DoctorId && d.TenantId == tenantId && !d.IsDeleted && d.IsEnabled, cancellationToken);
        if (doctor == null)
            return ApiResponse<PatientSelfServiceRequestDto>.Error("Doctor not found or not enabled");

        var branch = await _context.Branches
            .FirstOrDefaultAsync(b => b.Id == request.BranchId && b.TenantId == tenantId && !b.IsDeleted && b.IsActive, cancellationToken);
        if (branch == null)
            return ApiResponse<PatientSelfServiceRequestDto>.Error("Branch not found or inactive");

        var serviceSnapshot = await ResolveServiceSnapshotAsync(tenantId, request.DoctorId, request.DoctorServiceId, cancellationToken);
        if (serviceSnapshot == null)
            return ApiResponse<PatientSelfServiceRequestDto>.Error("Doctor service not found or not linked to selected doctor");

        if (request.PaidAmount.HasValue && request.PaidAmount.Value < 0)
            return ApiResponse<PatientSelfServiceRequestDto>.Error("Paid amount cannot be negative");

        if (settings.SelfServicePaymentPolicy == PatientSelfServicePaymentPolicy.FullOnly)
        {
            if (!request.PaidAmount.HasValue)
                return ApiResponse<PatientSelfServiceRequestDto>.Error("Paid amount is required under full payment policy");

            if (serviceSnapshot.ServicePrice.HasValue && request.PaidAmount.Value < serviceSnapshot.ServicePrice.Value)
            {
                return ApiResponse<PatientSelfServiceRequestDto>.Error("Full service amount is required under clinic payment policy");
            }
        }

        var requestedDate = request.RequestedDate.Date;
        var nowUtc = DateTime.UtcNow;
        var requestedTime = ParseTimeOrNull(request.RequestedTime);
        if (request.RequestedTime != null && requestedTime == null)
            return ApiResponse<PatientSelfServiceRequestDto>.Error("Invalid RequestedTime format. Use HH:mm");

        var source = request.RequestType == PatientSelfServiceRequestType.SameDayTicket
            ? VisitSource.PatientSelfServiceTicket
            : VisitSource.PatientSelfServiceBooking;

        if (request.RequestType == PatientSelfServiceRequestType.SameDayTicket)
        {
            if (requestedDate != nowUtc.Date)
                return ApiResponse<PatientSelfServiceRequestDto>.Error("Same-day request date must be today");

            var hasActiveShift = await _context.QueueSessions
                .AnyAsync(s => s.TenantId == tenantId && !s.IsDeleted && s.IsActive && s.DoctorId == request.DoctorId, cancellationToken);
            if (!hasActiveShift)
                return ApiResponse<PatientSelfServiceRequestDto>.Error("Doctor is not currently available for same-day self-service");
        }
        else
        {
            if (requestedDate <= nowUtc.Date)
                return ApiResponse<PatientSelfServiceRequestDto>.Error("Future booking requests must be for a future date");

            if (!requestedTime.HasValue)
                return ApiResponse<PatientSelfServiceRequestDto>.Error("RequestedTime is required for future booking requests");

            if (!settings.BookingEnabled)
                return ApiResponse<PatientSelfServiceRequestDto>.Error("Booking is not enabled in clinic settings");
        }

        var availability = await EvaluateAvailabilityAsync(
            tenantId,
            request.DoctorId,
            request.BranchId,
            requestedDate,
            requestedTime,
            serviceSnapshot.ServiceDurationMinutes,
            cancellationToken);

        if (supportingDocuments != null)
        {
            foreach (var doc in supportingDocuments)
            {
                var validation = ValidateSupportingDocument(doc);
                if (!validation.Valid)
                    return ApiResponse<PatientSelfServiceRequestDto>.Error(validation.ErrorMessage!);
            }
        }

        var savedProof = await _fileStorageService.SaveImageAsync(
            tenantId,
            "patient-self-service-payment-proofs",
            paymentProof,
            cancellationToken);

        var entity = new PatientSelfServiceRequest
        {
            TenantId = tenantId,
            PatientId = request.PatientId,
            DoctorId = request.DoctorId,
            BranchId = request.BranchId,
            DoctorServiceId = request.DoctorServiceId,
            RequestType = request.RequestType,
            Status = PatientSelfServiceRequestStatus.PendingPaymentReview,
            VisitType = request.VisitType,
            Source = source,
            RequestedDate = requestedDate,
            RequestedTime = requestedTime,
            ServiceNameSnapshot = serviceSnapshot.ServiceName,
            ServicePriceSnapshot = serviceSnapshot.ServicePrice,
            ServiceDurationMinutesSnapshot = serviceSnapshot.ServiceDurationMinutes,
            Complaint = request.Complaint,
            Symptoms = request.Symptoms,
            DurationNotes = request.DurationNotes,
            HasChronicConditions = request.HasChronicConditions,
            ChronicConditionsDetails = request.ChronicConditionsDetails,
            CurrentMedications = request.CurrentMedications,
            KnownAllergies = request.KnownAllergies,
            IsPregnant = request.IsPregnant,
            EmergencyContactName = request.EmergencyContactName,
            EmergencyContactPhone = request.EmergencyContactPhone,
            Notes = request.Notes,
            DeclaredPaidAmount = request.PaidAmount,
            PaymentMethod = request.PaymentMethod,
            TransferReference = request.TransferReference,
            TransferSenderName = request.TransferSenderName,
            TransferDate = request.TransferDate,
            PaymentProofOriginalFileName = Path.GetFileName(paymentProof.FileName),
            PaymentProofStoredFileName = savedProof.StoredFileName,
            PaymentProofRelativePath = savedProof.RelativePath,
            PaymentProofPublicUrl = savedProof.PublicUrl,
            PaymentProofContentType = paymentProof.ContentType,
            PaymentProofFileSizeBytes = paymentProof.Length,
            IsWithinClinicWorkingHours = availability.IsWithinClinicWorkingHours,
            IsWithinDoctorSchedule = availability.IsWithinDoctorSchedule,
            DoctorShiftOpenAtSubmission = availability.DoctorShiftOpen,
            AvailabilityCheckedAt = DateTime.UtcNow,
            AvailabilityCheckNotes = availability.Notes,
            ExpiresAt = nowUtc.AddHours(Math.Max(1, settings.SelfServiceRequestExpiryHours))
        };

        _context.PatientSelfServiceRequests.Add(entity);

        if (supportingDocuments != null)
        {
            foreach (var doc in supportingDocuments)
            {
                var saved = await _fileStorageService.SaveFileAsync(
                    tenantId,
                    "patient-self-service-documents",
                    doc,
                    cancellationToken);

                _context.PatientSelfServiceRequestDocuments.Add(new PatientSelfServiceRequestDocument
                {
                    TenantId = tenantId,
                    RequestId = entity.Id,
                    UploadedByUserId = callerUserId,
                    OriginalFileName = Path.GetFileName(doc.FileName),
                    StoredFileName = saved.StoredFileName,
                    RelativePath = saved.RelativePath,
                    PublicUrl = saved.PublicUrl,
                    ContentType = doc.ContentType,
                    FileSizeBytes = doc.Length
                });
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        var savedEntity = await GetRequestWithIncludes(tenantId, entity.Id, cancellationToken);
        return ApiResponse<PatientSelfServiceRequestDto>.Created(MapToDto(savedEntity!), "Self-service request created and queued for payment review");
    }

    public async Task<ApiResponse<List<PatientSelfServiceRequestListItemDto>>> ListOwnedAsync(
        Guid tenantId,
        Guid callerUserId,
        Guid? patientId,
        CancellationToken cancellationToken = default)
    {
        await ExpirePendingRequestsAsync(tenantId, cancellationToken);

        var ownedProfileIds = await GetOwnedProfileIdsAsync(tenantId, callerUserId, cancellationToken);
        if (!ownedProfileIds.Any())
            return ApiResponse<List<PatientSelfServiceRequestListItemDto>>.Error("No patient profiles linked to current user");

        if (patientId.HasValue && !ownedProfileIds.Contains(patientId.Value))
            return ApiResponse<List<PatientSelfServiceRequestListItemDto>>.Error("Access denied to requested patient profile");

        var query = _context.PatientSelfServiceRequests
            .Include(r => r.Patient)
            .Include(r => r.Doctor)
            .Include(r => r.Branch)
            .Where(r => r.TenantId == tenantId && !r.IsDeleted && ownedProfileIds.Contains(r.PatientId));

        if (patientId.HasValue)
            query = query.Where(r => r.PatientId == patientId.Value);

        var list = await query
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);

        return ApiResponse<List<PatientSelfServiceRequestListItemDto>>.Ok(
            list.Select(MapToListItem).ToList(),
            $"Retrieved {list.Count} request(s)");
    }

    public async Task<ApiResponse<PatientSelfServiceRequestDto>> GetOwnedByIdAsync(
        Guid tenantId,
        Guid callerUserId,
        Guid requestId,
        CancellationToken cancellationToken = default)
    {
        await ExpirePendingRequestsAsync(tenantId, cancellationToken);

        var entity = await GetRequestWithIncludes(tenantId, requestId, cancellationToken);
        if (entity == null)
            return ApiResponse<PatientSelfServiceRequestDto>.Error("Self-service request not found");

        var ownedProfileIds = await GetOwnedProfileIdsAsync(tenantId, callerUserId, cancellationToken);
        if (!ownedProfileIds.Contains(entity.PatientId))
            return ApiResponse<PatientSelfServiceRequestDto>.Error("Access denied to requested self-service request");

        return ApiResponse<PatientSelfServiceRequestDto>.Ok(MapToDto(entity), "Request retrieved successfully");
    }

    public async Task<ApiResponse<PatientSelfServiceRequestDto>> ReuploadPaymentProofAsync(
        Guid tenantId,
        Guid callerUserId,
        Guid requestId,
        IFormFile paymentProof,
        CancellationToken cancellationToken = default)
    {
        await ExpirePendingRequestsAsync(tenantId, cancellationToken);

        if (paymentProof == null || paymentProof.Length <= 0)
            return ApiResponse<PatientSelfServiceRequestDto>.Error("Payment proof screenshot is required");

        if (!_fileStorageService.IsSupportedImage(paymentProof))
            return ApiResponse<PatientSelfServiceRequestDto>.Error("Payment proof must be an image (PNG, JPG/JPEG, WEBP)");

        if (!_fileStorageService.IsAllowedSize(paymentProof.Length))
            return ApiResponse<PatientSelfServiceRequestDto>.Error("Payment proof exceeds maximum allowed size");

        var entity = await GetRequestWithIncludes(tenantId, requestId, cancellationToken);
        if (entity == null)
            return ApiResponse<PatientSelfServiceRequestDto>.Error("Self-service request not found");

        var ownedProfileIds = await GetOwnedProfileIdsAsync(tenantId, callerUserId, cancellationToken);
        if (!ownedProfileIds.Contains(entity.PatientId))
            return ApiResponse<PatientSelfServiceRequestDto>.Error("Access denied to requested self-service request");

        if (entity.Status != PatientSelfServiceRequestStatus.ReuploadRequested)
            return ApiResponse<PatientSelfServiceRequestDto>.Error("Payment proof reupload is only allowed when clinic requests reupload");

        var settings = await _context.ClinicSettings.FirstOrDefaultAsync(cancellationToken);
        if (settings == null)
            return ApiResponse<PatientSelfServiceRequestDto>.Error("Clinic settings not found");

        var saved = await _fileStorageService.SaveImageAsync(
            tenantId,
            "patient-self-service-payment-proofs",
            paymentProof,
            cancellationToken);

        if (!string.IsNullOrWhiteSpace(entity.PaymentProofRelativePath))
            await _fileStorageService.DeleteAsync(entity.PaymentProofRelativePath, cancellationToken);

        entity.PaymentProofOriginalFileName = Path.GetFileName(paymentProof.FileName);
        entity.PaymentProofStoredFileName = saved.StoredFileName;
        entity.PaymentProofRelativePath = saved.RelativePath;
        entity.PaymentProofPublicUrl = saved.PublicUrl;
        entity.PaymentProofContentType = paymentProof.ContentType;
        entity.PaymentProofFileSizeBytes = paymentProof.Length;
        entity.ReuploadCount += 1;
        entity.Status = PatientSelfServiceRequestStatus.PendingPaymentReview;
        entity.ReuploadReason = null;
        entity.ReuploadRequestedAt = null;
        entity.ReuploadRequestedByUserId = null;
        entity.ExpiresAt = DateTime.UtcNow.AddHours(Math.Max(1, settings.SelfServiceRequestExpiryHours));

        await _context.SaveChangesAsync(cancellationToken);
        return ApiResponse<PatientSelfServiceRequestDto>.Ok(MapToDto(entity), "Payment proof reuploaded successfully");
    }

    public async Task<ApiResponse<PagedResult<PatientSelfServiceRequestListItemDto>>> GetClinicRequestsAsync(
        Guid tenantId,
        SelfServiceRequestsQuery query,
        CancellationToken cancellationToken = default)
    {
        await ExpirePendingRequestsAsync(tenantId, cancellationToken);

        var q = _context.PatientSelfServiceRequests
            .Include(r => r.Patient)
            .Include(r => r.Doctor)
            .Include(r => r.Branch)
            .Where(r => r.TenantId == tenantId && !r.IsDeleted)
            .AsQueryable();

        if (query.PatientId.HasValue)
            q = q.Where(r => r.PatientId == query.PatientId.Value);
        if (query.DoctorId.HasValue)
            q = q.Where(r => r.DoctorId == query.DoctorId.Value);
        if (query.BranchId.HasValue)
            q = q.Where(r => r.BranchId == query.BranchId.Value);
        if (query.RequestType.HasValue)
            q = q.Where(r => r.RequestType == query.RequestType.Value);
        if (query.Status.HasValue)
            q = q.Where(r => r.Status == query.Status.Value);
        if (query.FromDate.HasValue)
            q = q.Where(r => r.CreatedAt >= query.FromDate.Value.Date);
        if (query.ToDate.HasValue)
            q = q.Where(r => r.CreatedAt < query.ToDate.Value.Date.AddDays(1));

        var safePageNumber = query.PageNumber <= 0 ? 1 : query.PageNumber;
        var safePageSize = query.PageSize <= 0 ? 20 : Math.Min(query.PageSize, 200);

        var total = await q.CountAsync(cancellationToken);
        var rows = await q
            .OrderByDescending(r => r.CreatedAt)
            .Skip((safePageNumber - 1) * safePageSize)
            .Take(safePageSize)
            .ToListAsync(cancellationToken);

        var paged = new PagedResult<PatientSelfServiceRequestListItemDto>
        {
            Items = rows.Select(MapToListItem).ToList(),
            TotalCount = total,
            PageNumber = safePageNumber,
            PageSize = safePageSize
        };

        return ApiResponse<PagedResult<PatientSelfServiceRequestListItemDto>>.Ok(paged, $"Retrieved {paged.Items.Count} request(s)");
    }

    public async Task<ApiResponse<PatientSelfServiceRequestDto>> GetClinicRequestByIdAsync(
        Guid tenantId,
        Guid requestId,
        CancellationToken cancellationToken = default)
    {
        await ExpirePendingRequestsAsync(tenantId, cancellationToken);

        var entity = await GetRequestWithIncludes(tenantId, requestId, cancellationToken);
        if (entity == null)
            return ApiResponse<PatientSelfServiceRequestDto>.Error("Self-service request not found");

        return ApiResponse<PatientSelfServiceRequestDto>.Ok(MapToDto(entity), "Request retrieved successfully");
    }

    public async Task<ApiResponse<PatientSelfServiceRequestDto>> ApproveAsync(
        Guid tenantId,
        Guid requestId,
        Guid approverUserId,
        ApprovePatientSelfServiceRequest request,
        CancellationToken cancellationToken = default)
    {
        await ExpirePendingRequestsAsync(tenantId, cancellationToken);

        var entity = await GetRequestWithIncludes(tenantId, requestId, cancellationToken);
        if (entity == null)
            return ApiResponse<PatientSelfServiceRequestDto>.Error("Self-service request not found");

        if (entity.Status == PatientSelfServiceRequestStatus.Rejected || entity.Status == PatientSelfServiceRequestStatus.Expired)
            return ApiResponse<PatientSelfServiceRequestDto>.Error("Request is already closed and cannot be approved");

        if (entity.Status == PatientSelfServiceRequestStatus.ConvertedToQueueTicket || entity.Status == PatientSelfServiceRequestStatus.ConvertedToBooking)
            return ApiResponse<PatientSelfServiceRequestDto>.Error("Request is already converted");

        if (request.AdjustedPaidAmount.HasValue && request.AdjustedPaidAmount.Value < 0)
            return ApiResponse<PatientSelfServiceRequestDto>.Error("Adjusted paid amount cannot be negative");

        var settings = await _context.ClinicSettings.FirstOrDefaultAsync(cancellationToken);
        if (settings == null)
            return ApiResponse<PatientSelfServiceRequestDto>.Error("Clinic settings not found");

        if (request.AdjustedPaidAmount.HasValue)
            entity.AdjustedPaidAmount = request.AdjustedPaidAmount.Value;

        var effectivePaid = entity.AdjustedPaidAmount ?? entity.DeclaredPaidAmount ?? 0m;
        if (settings.SelfServicePaymentPolicy == PatientSelfServicePaymentPolicy.FullOnly
            && entity.ServicePriceSnapshot.HasValue
            && effectivePaid < entity.ServicePriceSnapshot.Value)
        {
            return ApiResponse<PatientSelfServiceRequestDto>.Error("Full service amount is required under clinic payment policy");
        }

        entity.Status = PatientSelfServiceRequestStatus.PaymentApproved;
        entity.ApprovedByUserId = approverUserId;
        entity.ApprovedAt = DateTime.UtcNow;
        if (!string.IsNullOrWhiteSpace(request.Notes))
            entity.ApprovalNotes = request.Notes;

        await _context.SaveChangesAsync(cancellationToken);

        if (entity.RequestType == PatientSelfServiceRequestType.SameDayTicket)
        {
            var activeSession = await _context.QueueSessions
                .Where(s => s.TenantId == tenantId && !s.IsDeleted && s.IsActive && s.DoctorId == entity.DoctorId)
                .OrderByDescending(s => s.StartedAt)
                .FirstOrDefaultAsync(cancellationToken);

            if (activeSession == null)
            {
                return ApiResponse<PatientSelfServiceRequestDto>.Error("Request approved, but doctor shift is no longer active for queue conversion");
            }

            var queueResult = await _queueService.IssueTicketWithPaymentAsync(tenantId, new CreateQueueTicketWithPaymentRequest
            {
                SessionId = activeSession.Id,
                BranchId = entity.BranchId,
                PatientId = entity.PatientId,
                DoctorId = entity.DoctorId,
                DoctorServiceId = entity.DoctorServiceId,
                Source = VisitSource.PatientSelfServiceTicket,
                VisitType = entity.VisitType,
                Notes = entity.Notes,
                PaidAmount = effectivePaid,
                PaymentAmount = effectivePaid,
                PaymentMethod = string.IsNullOrWhiteSpace(entity.PaymentMethod) ? "SelfServiceProof" : entity.PaymentMethod,
                PaymentReference = entity.TransferReference,
                PaymentNotes = $"Converted from self-service request {entity.Id}"
            }, approverUserId);

            if (!queueResult.Success || queueResult.Data == null)
                return ApiResponse<PatientSelfServiceRequestDto>.Error(queueResult.Message);

            entity.Status = PatientSelfServiceRequestStatus.ConvertedToQueueTicket;
            entity.ConvertedQueueTicketId = queueResult.Data.Id;
            entity.ConvertedAt = DateTime.UtcNow;
        }
        else
        {
            var bookingTime = entity.RequestedTime?.ToString(@"hh\:mm") ?? "09:00";
            var bookingResult = await _bookingService.CreateAsync(tenantId, approverUserId, new CreateBookingRequest
            {
                PatientId = entity.PatientId,
                BranchId = entity.BranchId,
                DoctorId = entity.DoctorId,
                DoctorServiceId = entity.DoctorServiceId,
                VisitType = entity.VisitType,
                Source = VisitSource.PatientSelfServiceBooking,
                BookingDate = entity.RequestedDate,
                BookingTime = bookingTime,
                Notes = BuildBookingNotes(entity)
            });

            if (!bookingResult.Success || bookingResult.Data == null)
                return ApiResponse<PatientSelfServiceRequestDto>.Error(bookingResult.Message);

            entity.Status = PatientSelfServiceRequestStatus.ConvertedToBooking;
            entity.ConvertedBookingId = bookingResult.Data.Id;
            entity.ConvertedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);
        return ApiResponse<PatientSelfServiceRequestDto>.Ok(MapToDto(entity), "Self-service request approved and converted successfully");
    }

    public async Task<ApiResponse<PatientSelfServiceRequestDto>> RejectAsync(
        Guid tenantId,
        Guid requestId,
        Guid reviewerUserId,
        RejectPatientSelfServiceRequest request,
        CancellationToken cancellationToken = default)
    {
        await ExpirePendingRequestsAsync(tenantId, cancellationToken);

        var entity = await GetRequestWithIncludes(tenantId, requestId, cancellationToken);
        if (entity == null)
            return ApiResponse<PatientSelfServiceRequestDto>.Error("Self-service request not found");

        if (entity.Status == PatientSelfServiceRequestStatus.ConvertedToQueueTicket || entity.Status == PatientSelfServiceRequestStatus.ConvertedToBooking)
            return ApiResponse<PatientSelfServiceRequestDto>.Error("Converted requests cannot be rejected");

        if (entity.Status == PatientSelfServiceRequestStatus.Rejected || entity.Status == PatientSelfServiceRequestStatus.Expired)
            return ApiResponse<PatientSelfServiceRequestDto>.Error("Request is already closed");

        entity.Status = PatientSelfServiceRequestStatus.Rejected;
        entity.RejectionReason = request.Reason;
        entity.RejectedByUserId = reviewerUserId;
        entity.RejectedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return ApiResponse<PatientSelfServiceRequestDto>.Ok(MapToDto(entity), "Self-service request rejected");
    }

    public async Task<ApiResponse<PatientSelfServiceRequestDto>> RequestReuploadAsync(
        Guid tenantId,
        Guid requestId,
        Guid reviewerUserId,
        RequestSelfServicePaymentReupload request,
        CancellationToken cancellationToken = default)
    {
        await ExpirePendingRequestsAsync(tenantId, cancellationToken);

        var entity = await GetRequestWithIncludes(tenantId, requestId, cancellationToken);
        if (entity == null)
            return ApiResponse<PatientSelfServiceRequestDto>.Error("Self-service request not found");

        if (entity.Status == PatientSelfServiceRequestStatus.ConvertedToQueueTicket || entity.Status == PatientSelfServiceRequestStatus.ConvertedToBooking)
            return ApiResponse<PatientSelfServiceRequestDto>.Error("Converted requests cannot request reupload");

        if (entity.Status == PatientSelfServiceRequestStatus.Rejected || entity.Status == PatientSelfServiceRequestStatus.Expired)
            return ApiResponse<PatientSelfServiceRequestDto>.Error("Request is already closed");

        var settings = await _context.ClinicSettings.FirstOrDefaultAsync(cancellationToken);
        if (settings == null)
            return ApiResponse<PatientSelfServiceRequestDto>.Error("Clinic settings not found");

        entity.Status = PatientSelfServiceRequestStatus.ReuploadRequested;
        entity.ReuploadReason = request.Reason;
        entity.ReuploadRequestedAt = DateTime.UtcNow;
        entity.ReuploadRequestedByUserId = reviewerUserId;
        entity.ExpiresAt = DateTime.UtcNow.AddHours(Math.Max(1, settings.SelfServiceRequestExpiryHours));

        await _context.SaveChangesAsync(cancellationToken);
        return ApiResponse<PatientSelfServiceRequestDto>.Ok(MapToDto(entity), "Payment proof reupload requested");
    }

    public async Task<ApiResponse<PatientSelfServiceRequestDto>> AdjustPaidAmountAsync(
        Guid tenantId,
        Guid requestId,
        Guid reviewerUserId,
        AdjustSelfServicePaidAmountRequest request,
        CancellationToken cancellationToken = default)
    {
        _ = reviewerUserId;
        await ExpirePendingRequestsAsync(tenantId, cancellationToken);

        var entity = await GetRequestWithIncludes(tenantId, requestId, cancellationToken);
        if (entity == null)
            return ApiResponse<PatientSelfServiceRequestDto>.Error("Self-service request not found");

        if (entity.Status == PatientSelfServiceRequestStatus.ConvertedToQueueTicket || entity.Status == PatientSelfServiceRequestStatus.ConvertedToBooking)
            return ApiResponse<PatientSelfServiceRequestDto>.Error("Converted requests cannot be adjusted");

        if (entity.Status == PatientSelfServiceRequestStatus.Rejected || entity.Status == PatientSelfServiceRequestStatus.Expired)
            return ApiResponse<PatientSelfServiceRequestDto>.Error("Request is already closed");

        entity.AdjustedPaidAmount = request.AdjustedPaidAmount;
        if (!string.IsNullOrWhiteSpace(request.Notes))
        {
            entity.ApprovalNotes = string.IsNullOrWhiteSpace(entity.ApprovalNotes)
                ? request.Notes
                : $"{entity.ApprovalNotes} | {request.Notes}";
        }

        await _context.SaveChangesAsync(cancellationToken);
        return ApiResponse<PatientSelfServiceRequestDto>.Ok(MapToDto(entity), "Adjusted paid amount saved");
    }

    private async Task ExpirePendingRequestsAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var expirable = await _context.PatientSelfServiceRequests
            .Where(r => r.TenantId == tenantId
                && !r.IsDeleted
                && (r.Status == PatientSelfServiceRequestStatus.PendingPaymentReview || r.Status == PatientSelfServiceRequestStatus.ReuploadRequested)
                && r.ExpiresAt <= now)
            .ToListAsync(cancellationToken);

        if (!expirable.Any())
            return;

        foreach (var request in expirable)
        {
            request.Status = PatientSelfServiceRequestStatus.Expired;
        }

        await _context.SaveChangesAsync(cancellationToken);
    }

    private async Task<HashSet<Guid>> GetOwnedProfileIdsAsync(Guid tenantId, Guid callerUserId, CancellationToken cancellationToken)
    {
        var ownedProfiles = await _context.Patients
            .Where(p => p.TenantId == tenantId && !p.IsDeleted && p.UserId == callerUserId)
            .Select(p => new PatientHierarchyNode(p.Id, p.ParentPatientId))
            .ToListAsync(cancellationToken);

        if (!ownedProfiles.Any())
            return new HashSet<Guid>();

        var allProfiles = await _context.Patients
            .Where(p => p.TenantId == tenantId && !p.IsDeleted)
            .Select(p => new PatientHierarchyNode(p.Id, p.ParentPatientId))
            .ToListAsync(cancellationToken);

        return ExpandHierarchyIds(ownedProfiles.Select(p => p.Id).ToHashSet(), allProfiles);
    }

    private async Task<PatientSelfServiceRequest?> GetRequestWithIncludes(Guid tenantId, Guid id, CancellationToken cancellationToken)
    {
        return await _context.PatientSelfServiceRequests
            .Include(r => r.Patient)
            .Include(r => r.Doctor)
            .Include(r => r.Branch)
            .Include(r => r.Documents.Where(d => !d.IsDeleted))
            .FirstOrDefaultAsync(r => r.TenantId == tenantId && !r.IsDeleted && r.Id == id, cancellationToken);
    }

    private async Task<ServiceSnapshot?> ResolveServiceSnapshotAsync(Guid tenantId, Guid doctorId, Guid requestedServiceId, CancellationToken cancellationToken)
    {
        var legacy = await _context.DoctorServices
            .FirstOrDefaultAsync(ds => ds.TenantId == tenantId
                && !ds.IsDeleted
                && ds.IsActive
                && ds.DoctorId == doctorId
                && ds.Id == requestedServiceId, cancellationToken);

        if (legacy != null)
        {
            return new ServiceSnapshot(legacy.ServiceName, legacy.Price, legacy.DurationMinutes);
        }

        var linked = await _context.DoctorServiceLinks
            .Include(l => l.ClinicService)
            .FirstOrDefaultAsync(l => l.TenantId == tenantId
                && !l.IsDeleted
                && l.IsActive
                && l.DoctorId == doctorId
                && (l.Id == requestedServiceId || l.ClinicServiceId == requestedServiceId)
                && !l.ClinicService.IsDeleted
                && l.ClinicService.IsActive,
                cancellationToken);

        if (linked == null)
            return null;

        return new ServiceSnapshot(
            linked.ClinicService.Name,
            linked.OverridePrice ?? linked.ClinicService.DefaultPrice,
            linked.OverrideDurationMinutes ?? linked.ClinicService.DefaultDurationMinutes);
    }

    private async Task<AvailabilityCheckResult> EvaluateAvailabilityAsync(
        Guid tenantId,
        Guid doctorId,
        Guid branchId,
        DateTime requestedDate,
        TimeSpan? requestedTime,
        int? serviceDurationMinutes,
        CancellationToken cancellationToken)
    {
        var notes = new List<string>();
        bool? withinClinicHours = null;
        bool? withinDoctorSchedule = null;

        var doctorShiftOpen = await _context.QueueSessions
            .AnyAsync(s => s.TenantId == tenantId && !s.IsDeleted && s.IsActive && s.DoctorId == doctorId, cancellationToken);

        if (requestedTime.HasValue)
        {
            var workingHour = await _context.WorkingHours
                .Where(w => w.TenantId == tenantId && !w.IsDeleted && w.IsActive && w.DayOfWeek == requestedDate.DayOfWeek)
                .FirstOrDefaultAsync(cancellationToken);

            if (workingHour == null)
            {
                withinClinicHours = false;
                notes.Add("No active clinic working hours configured for requested day");
            }
            else
            {
                var reqStart = requestedTime.Value;
                var reqEnd = reqStart.Add(TimeSpan.FromMinutes(serviceDurationMinutes ?? 0));
                withinClinicHours = reqStart >= workingHour.StartTime && reqEnd <= workingHour.EndTime;
                if (withinClinicHours == false)
                    notes.Add("Requested slot is outside configured clinic working hours");
            }

            var schedules = await _context.DoctorBranchSchedules
                .Where(s => s.TenantId == tenantId
                    && !s.IsDeleted
                    && s.IsActive
                    && s.DoctorId == doctorId
                    && s.BranchId == branchId
                    && s.DayOfWeek == requestedDate.DayOfWeek)
                .ToListAsync(cancellationToken);

            if (!schedules.Any())
            {
                withinDoctorSchedule = null;
                notes.Add("Doctor branch schedule is not configured for requested day");
            }
            else
            {
                var reqStart = requestedTime.Value;
                var reqEnd = reqStart.Add(TimeSpan.FromMinutes(serviceDurationMinutes ?? 0));
                withinDoctorSchedule = schedules.Any(s => reqStart >= s.StartTime && reqEnd <= s.EndTime);
                if (withinDoctorSchedule == false)
                    notes.Add("Requested slot is outside doctor branch schedule");
            }
        }
        else
        {
            notes.Add("Requested time was not supplied; hour-based checks were stored as not evaluated");
        }

        return new AvailabilityCheckResult(
            IsWithinClinicWorkingHours: withinClinicHours,
            IsWithinDoctorSchedule: withinDoctorSchedule,
            DoctorShiftOpen: doctorShiftOpen,
            Notes: notes.Count == 0 ? "Availability checks passed" : string.Join(" | ", notes));
    }

    private static TimeSpan? ParseTimeOrNull(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        return TimeSpan.TryParse(value, out var parsed) ? parsed : null;
    }

    private static (bool Valid, string? ErrorMessage) ValidateSupportingDocument(IFormFile file)
    {
        if (file == null || file.Length <= 0)
            return (false, "Supporting document is empty");

        var extension = Path.GetExtension(file.FileName);
        if (!AllowedSupportingExtensions.Contains(extension) || !AllowedSupportingContentTypes.Contains(file.ContentType))
            return (false, "Unsupported supporting document type. Allowed: PDF, JPG/JPEG, PNG, WEBP");

        if (file.Length > MaxSupportingDocumentSizeBytes)
            return (false, "Supporting document exceeds 10 MB limit");

        return (true, null);
    }

    private static string BuildBookingNotes(PatientSelfServiceRequest request)
    {
        var parts = new List<string>
        {
            $"Converted from self-service request {request.Id}"
        };

        if (!string.IsNullOrWhiteSpace(request.Complaint))
            parts.Add($"Complaint: {request.Complaint}");

        if (!string.IsNullOrWhiteSpace(request.Notes))
            parts.Add($"Notes: {request.Notes}");

        return string.Join(" | ", parts);
    }

    private static HashSet<Guid> ExpandHierarchyIds(HashSet<Guid> seed, List<PatientHierarchyNode> allProfiles)
    {
        var allowed = new HashSet<Guid>(seed);
        var changed = true;

        while (changed)
        {
            changed = false;
            foreach (var profile in allProfiles)
            {
                if (allowed.Contains(profile.Id) && profile.ParentPatientId is Guid parentId && allowed.Add(parentId))
                    changed = true;

                if (profile.ParentPatientId is Guid pId && allowed.Contains(pId) && allowed.Add(profile.Id))
                    changed = true;
            }
        }

        return allowed;
    }

    private static PatientSelfServiceRequestListItemDto MapToListItem(PatientSelfServiceRequest request)
    {
        return new PatientSelfServiceRequestListItemDto
        {
            Id = request.Id,
            PatientId = request.PatientId,
            PatientName = request.Patient?.Name ?? string.Empty,
            DoctorId = request.DoctorId,
            DoctorName = request.Doctor?.Name ?? string.Empty,
            BranchId = request.BranchId,
            BranchName = request.Branch?.Name ?? string.Empty,
            DoctorServiceId = request.DoctorServiceId,
            ServiceName = request.ServiceNameSnapshot,
            RequestType = request.RequestType,
            Status = request.Status,
            RequestedDate = request.RequestedDate,
            RequestedTime = request.RequestedTime?.ToString(@"hh\:mm"),
            DeclaredPaidAmount = request.DeclaredPaidAmount,
            AdjustedPaidAmount = request.AdjustedPaidAmount,
            ExpiresAt = request.ExpiresAt,
            ConvertedQueueTicketId = request.ConvertedQueueTicketId,
            ConvertedBookingId = request.ConvertedBookingId,
            CreatedAt = request.CreatedAt
        };
    }

    private static PatientSelfServiceRequestDto MapToDto(PatientSelfServiceRequest request)
    {
        return new PatientSelfServiceRequestDto
        {
            Id = request.Id,
            PatientId = request.PatientId,
            PatientName = request.Patient?.Name ?? string.Empty,
            DoctorId = request.DoctorId,
            DoctorName = request.Doctor?.Name ?? string.Empty,
            BranchId = request.BranchId,
            BranchName = request.Branch?.Name ?? string.Empty,
            DoctorServiceId = request.DoctorServiceId,
            ServiceName = request.ServiceNameSnapshot,
            RequestType = request.RequestType,
            Status = request.Status,
            VisitType = request.VisitType,
            Source = request.Source,
            RequestedDate = request.RequestedDate,
            RequestedTime = request.RequestedTime?.ToString(@"hh\:mm"),
            ServicePriceSnapshot = request.ServicePriceSnapshot,
            ServiceDurationMinutesSnapshot = request.ServiceDurationMinutesSnapshot,
            Complaint = request.Complaint,
            Symptoms = request.Symptoms,
            DurationNotes = request.DurationNotes,
            HasChronicConditions = request.HasChronicConditions,
            ChronicConditionsDetails = request.ChronicConditionsDetails,
            CurrentMedications = request.CurrentMedications,
            KnownAllergies = request.KnownAllergies,
            IsPregnant = request.IsPregnant,
            EmergencyContactName = request.EmergencyContactName,
            EmergencyContactPhone = request.EmergencyContactPhone,
            Notes = request.Notes,
            DeclaredPaidAmount = request.DeclaredPaidAmount,
            AdjustedPaidAmount = request.AdjustedPaidAmount,
            PaymentMethod = request.PaymentMethod,
            TransferReference = request.TransferReference,
            TransferSenderName = request.TransferSenderName,
            TransferDate = request.TransferDate,
            PaymentProof = new PatientSelfServicePaymentProofDto
            {
                OriginalFileName = request.PaymentProofOriginalFileName,
                PublicUrl = request.PaymentProofPublicUrl,
                ContentType = request.PaymentProofContentType,
                FileSizeBytes = request.PaymentProofFileSizeBytes
            },
            IsWithinClinicWorkingHours = request.IsWithinClinicWorkingHours,
            IsWithinDoctorSchedule = request.IsWithinDoctorSchedule,
            DoctorShiftOpenAtSubmission = request.DoctorShiftOpenAtSubmission,
            AvailabilityCheckedAt = request.AvailabilityCheckedAt,
            AvailabilityCheckNotes = request.AvailabilityCheckNotes,
            ExpiresAt = request.ExpiresAt,
            ReuploadCount = request.ReuploadCount,
            ReuploadReason = request.ReuploadReason,
            ReuploadRequestedAt = request.ReuploadRequestedAt,
            ReuploadRequestedByUserId = request.ReuploadRequestedByUserId,
            RejectionReason = request.RejectionReason,
            RejectedAt = request.RejectedAt,
            RejectedByUserId = request.RejectedByUserId,
            ApprovalNotes = request.ApprovalNotes,
            ApprovedAt = request.ApprovedAt,
            ApprovedByUserId = request.ApprovedByUserId,
            ConvertedQueueTicketId = request.ConvertedQueueTicketId,
            ConvertedBookingId = request.ConvertedBookingId,
            ConvertedAt = request.ConvertedAt,
            Documents = request.Documents
                .Where(d => !d.IsDeleted)
                .OrderByDescending(d => d.CreatedAt)
                .Select(d => new PatientSelfServiceRequestDocumentDto
                {
                    Id = d.Id,
                    OriginalFileName = d.OriginalFileName,
                    PublicUrl = d.PublicUrl,
                    ContentType = d.ContentType,
                    FileSizeBytes = d.FileSizeBytes,
                    Notes = d.Notes,
                    CreatedAt = d.CreatedAt
                })
                .ToList(),
            CreatedAt = request.CreatedAt,
            UpdatedAt = request.UpdatedAt
        };
    }

    private readonly record struct PatientHierarchyNode(Guid Id, Guid? ParentPatientId);

    private sealed record ServiceSnapshot(string ServiceName, decimal? ServicePrice, int? ServiceDurationMinutes);

    private readonly record struct AvailabilityCheckResult(
        bool? IsWithinClinicWorkingHours,
        bool? IsWithinDoctorSchedule,
        bool DoctorShiftOpen,
        string Notes);
}
