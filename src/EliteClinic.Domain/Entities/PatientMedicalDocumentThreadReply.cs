namespace EliteClinic.Domain.Entities;

public class PatientMedicalDocumentThreadReply : TenantBaseEntity
{
    public Guid ThreadId { get; set; }
    public Guid AuthorUserId { get; set; }
    public string Message { get; set; } = string.Empty;
    public bool IsInternalNote { get; set; }

    public PatientMedicalDocumentThread Thread { get; set; } = null!;
}
