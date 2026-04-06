using EliteClinic.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace EliteClinic.Application.Features.Clinic.DTOs;

public class PatientMedicalDocumentDto
{
    public Guid Id { get; set; }
    public Guid PatientId { get; set; }
    public DocumentCategory Category { get; set; }
    public string OriginalFileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class PatientMedicalDocumentAccessDto
{
    public Guid Id { get; set; }
    public Guid PatientId { get; set; }
    public string OriginalFileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public string RelativePath { get; set; } = string.Empty;
}

public class UploadPatientMedicalDocumentRequest
{
    [Required]
    public DocumentCategory Category { get; set; }

    public Guid? VisitId { get; set; }

    public Guid? PartnerOrderId { get; set; }

    [StringLength(500)]
    public string? Notes { get; set; }
}

public class PatientChronicProfileDto
{
    public Guid Id { get; set; }
    public Guid PatientId { get; set; }
    public bool Diabetes { get; set; }
    public bool Hypertension { get; set; }
    public bool CardiacDisease { get; set; }
    public bool Asthma { get; set; }
    public bool Other { get; set; }
    public string? OtherNotes { get; set; }
    public Guid? RecordedByUserId { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class UpsertPatientChronicProfileRequest
{
    public bool Diabetes { get; set; }
    public bool Hypertension { get; set; }
    public bool CardiacDisease { get; set; }
    public bool Asthma { get; set; }
    public bool Other { get; set; }

    [StringLength(1000)]
    public string? OtherNotes { get; set; }
}

public class PatientMedicalDocumentThreadDto
{
    public Guid Id { get; set; }
    public Guid PatientId { get; set; }
    public Guid DocumentId { get; set; }
    public Guid CreatedByUserId { get; set; }
    public string Subject { get; set; } = string.Empty;
    public MedicalDocumentThreadStatus Status { get; set; }
    public DateTime? ClosedAt { get; set; }
    public Guid? ClosedByUserId { get; set; }
    public string? Notes { get; set; }
    public List<PatientMedicalDocumentThreadReplyDto> Replies { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

public class PatientMedicalDocumentThreadReplyDto
{
    public Guid Id { get; set; }
    public Guid ThreadId { get; set; }
    public Guid AuthorUserId { get; set; }
    public string Message { get; set; } = string.Empty;
    public bool IsInternalNote { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreatePatientMedicalDocumentThreadRequest
{
    [Required]
    [StringLength(300)]
    public string Subject { get; set; } = string.Empty;

    [StringLength(1000)]
    public string? Notes { get; set; }

    [StringLength(4000)]
    public string? InitialMessage { get; set; }
}

public class AddPatientMedicalDocumentThreadReplyRequest
{
    [Required]
    [StringLength(4000)]
    public string Message { get; set; } = string.Empty;

    public bool IsInternalNote { get; set; }
}

public class ClosePatientMedicalDocumentThreadRequest
{
    [StringLength(1000)]
    public string? Notes { get; set; }
}
