using EliteClinic.Domain.Enums;

namespace EliteClinic.Domain.Entities;

public class PatientMedicalDocumentThread : TenantBaseEntity
{
    public Guid PatientId { get; set; }
    public Guid DocumentId { get; set; }
    public Guid CreatedByUserId { get; set; }
    public string Subject { get; set; } = string.Empty;
    public MedicalDocumentThreadStatus Status { get; set; }
    public DateTime? ClosedAt { get; set; }
    public Guid? ClosedByUserId { get; set; }
    public string? Notes { get; set; }

    public Patient Patient { get; set; } = null!;
    public PatientMedicalDocument Document { get; set; } = null!;
    public ICollection<PatientMedicalDocumentThreadReply> Replies { get; set; } = new List<PatientMedicalDocumentThreadReply>();

    public PatientMedicalDocumentThread()
    {
        Status = MedicalDocumentThreadStatus.Open;
    }
}
