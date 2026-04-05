using EliteClinic.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace EliteClinic.Application.Features.Clinic.DTOs;

public class PatientSelfServiceRequestListItemDto
{
    public Guid Id { get; set; }
    public Guid PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public Guid DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public Guid BranchId { get; set; }
    public string BranchName { get; set; } = string.Empty;
    public Guid DoctorServiceId { get; set; }
    public string ServiceName { get; set; } = string.Empty;
    public PatientSelfServiceRequestType RequestType { get; set; }
    public PatientSelfServiceRequestStatus Status { get; set; }
    public DateTime RequestedDate { get; set; }
    public string? RequestedTime { get; set; }
    public decimal? DeclaredPaidAmount { get; set; }
    public decimal? AdjustedPaidAmount { get; set; }
    public DateTime ExpiresAt { get; set; }
    public Guid? ConvertedQueueTicketId { get; set; }
    public Guid? ConvertedBookingId { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class PatientSelfServiceRequestDocumentDto
{
    public Guid Id { get; set; }
    public string OriginalFileName { get; set; } = string.Empty;
    public string PublicUrl { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class PatientSelfServicePaymentProofDto
{
    public string OriginalFileName { get; set; } = string.Empty;
    public string PublicUrl { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
}

public class PatientSelfServiceRequestDto
{
    public Guid Id { get; set; }
    public Guid PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public Guid DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public Guid BranchId { get; set; }
    public string BranchName { get; set; } = string.Empty;
    public Guid DoctorServiceId { get; set; }
    public string ServiceName { get; set; } = string.Empty;

    public PatientSelfServiceRequestType RequestType { get; set; }
    public PatientSelfServiceRequestStatus Status { get; set; }
    public VisitType VisitType { get; set; }
    public VisitSource Source { get; set; }

    public DateTime RequestedDate { get; set; }
    public string? RequestedTime { get; set; }

    public decimal? ServicePriceSnapshot { get; set; }
    public int? ServiceDurationMinutesSnapshot { get; set; }

    public string? Complaint { get; set; }
    public string? Symptoms { get; set; }
    public string? DurationNotes { get; set; }
    public bool HasChronicConditions { get; set; }
    public string? ChronicConditionsDetails { get; set; }
    public string? CurrentMedications { get; set; }
    public string? KnownAllergies { get; set; }
    public bool? IsPregnant { get; set; }
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactPhone { get; set; }
    public string? Notes { get; set; }

    public decimal? DeclaredPaidAmount { get; set; }
    public decimal? AdjustedPaidAmount { get; set; }
    public string? PaymentMethod { get; set; }
    public string? TransferReference { get; set; }
    public string? TransferSenderName { get; set; }
    public DateTime? TransferDate { get; set; }
    public PatientSelfServicePaymentProofDto PaymentProof { get; set; } = new();

    public bool? IsWithinClinicWorkingHours { get; set; }
    public bool? IsWithinDoctorSchedule { get; set; }
    public bool? DoctorShiftOpenAtSubmission { get; set; }
    public DateTime? AvailabilityCheckedAt { get; set; }
    public string? AvailabilityCheckNotes { get; set; }

    public DateTime ExpiresAt { get; set; }
    public int ReuploadCount { get; set; }
    public string? ReuploadReason { get; set; }
    public DateTime? ReuploadRequestedAt { get; set; }
    public Guid? ReuploadRequestedByUserId { get; set; }

    public string? RejectionReason { get; set; }
    public DateTime? RejectedAt { get; set; }
    public Guid? RejectedByUserId { get; set; }

    public string? ApprovalNotes { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public Guid? ApprovedByUserId { get; set; }

    public Guid? ConvertedQueueTicketId { get; set; }
    public Guid? ConvertedBookingId { get; set; }
    public DateTime? ConvertedAt { get; set; }

    public List<PatientSelfServiceRequestDocumentDto> Documents { get; set; } = new();

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreatePatientSelfServiceRequest
{
    [Required]
    public Guid PatientId { get; set; }

    [Required]
    public Guid DoctorId { get; set; }

    [Required]
    public Guid BranchId { get; set; }

    [Required]
    public Guid DoctorServiceId { get; set; }

    public PatientSelfServiceRequestType RequestType { get; set; } = PatientSelfServiceRequestType.SameDayTicket;
    public VisitType VisitType { get; set; } = VisitType.Exam;

    [Required]
    public DateTime RequestedDate { get; set; }

    public string? RequestedTime { get; set; }

    [StringLength(2000)]
    public string? Complaint { get; set; }

    [StringLength(2000)]
    public string? Symptoms { get; set; }

    [StringLength(1000)]
    public string? DurationNotes { get; set; }

    public bool HasChronicConditions { get; set; }

    [StringLength(2000)]
    public string? ChronicConditionsDetails { get; set; }

    [StringLength(2000)]
    public string? CurrentMedications { get; set; }

    [StringLength(2000)]
    public string? KnownAllergies { get; set; }

    public bool? IsPregnant { get; set; }

    [StringLength(200)]
    public string? EmergencyContactName { get; set; }

    [StringLength(50)]
    public string? EmergencyContactPhone { get; set; }

    [Range(0, 999999999)]
    public decimal? PaidAmount { get; set; }

    [StringLength(100)]
    public string? PaymentMethod { get; set; }

    [StringLength(120)]
    public string? TransferReference { get; set; }

    [StringLength(200)]
    public string? TransferSenderName { get; set; }

    public DateTime? TransferDate { get; set; }

    [StringLength(2000)]
    public string? Notes { get; set; }
}

public class SelfServiceRequestsQuery
{
    public Guid? PatientId { get; set; }
    public Guid? DoctorId { get; set; }
    public Guid? BranchId { get; set; }
    public PatientSelfServiceRequestType? RequestType { get; set; }
    public PatientSelfServiceRequestStatus? Status { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class ApprovePatientSelfServiceRequest
{
    [Range(0, 999999999)]
    public decimal? AdjustedPaidAmount { get; set; }

    [StringLength(1000)]
    public string? Notes { get; set; }
}

public class RejectPatientSelfServiceRequest
{
    [Required]
    [StringLength(1000)]
    public string Reason { get; set; } = string.Empty;
}

public class RequestSelfServicePaymentReupload
{
    [Required]
    [StringLength(1000)]
    public string Reason { get; set; } = string.Empty;
}

public class AdjustSelfServicePaidAmountRequest
{
    [Range(0, 999999999)]
    public decimal AdjustedPaidAmount { get; set; }

    [StringLength(1000)]
    public string? Notes { get; set; }
}
