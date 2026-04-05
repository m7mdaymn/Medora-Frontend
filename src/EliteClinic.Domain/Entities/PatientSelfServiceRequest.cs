using EliteClinic.Domain.Enums;

namespace EliteClinic.Domain.Entities;

public class PatientSelfServiceRequest : TenantBaseEntity
{
    public Guid PatientId { get; set; }
    public Guid DoctorId { get; set; }
    public Guid BranchId { get; set; }
    public Guid DoctorServiceId { get; set; }

    public PatientSelfServiceRequestType RequestType { get; set; }
    public PatientSelfServiceRequestStatus Status { get; set; }
    public VisitType VisitType { get; set; }
    public VisitSource Source { get; set; }

    public DateTime RequestedDate { get; set; }
    public TimeSpan? RequestedTime { get; set; }

    public string ServiceNameSnapshot { get; set; } = string.Empty;
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

    public string PaymentProofOriginalFileName { get; set; } = string.Empty;
    public string PaymentProofStoredFileName { get; set; } = string.Empty;
    public string PaymentProofRelativePath { get; set; } = string.Empty;
    public string PaymentProofPublicUrl { get; set; } = string.Empty;
    public string PaymentProofContentType { get; set; } = string.Empty;
    public long PaymentProofFileSizeBytes { get; set; }

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

    public Patient Patient { get; set; } = null!;
    public Doctor Doctor { get; set; } = null!;
    public Branch Branch { get; set; } = null!;
    public ICollection<PatientSelfServiceRequestDocument> Documents { get; set; } = new List<PatientSelfServiceRequestDocument>();
}

public class PatientSelfServiceRequestDocument : TenantBaseEntity
{
    public Guid RequestId { get; set; }
    public Guid UploadedByUserId { get; set; }
    public string OriginalFileName { get; set; } = string.Empty;
    public string StoredFileName { get; set; } = string.Empty;
    public string RelativePath { get; set; } = string.Empty;
    public string PublicUrl { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public string? Notes { get; set; }

    public PatientSelfServiceRequest Request { get; set; } = null!;
}
