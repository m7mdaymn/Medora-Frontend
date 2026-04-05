namespace EliteClinic.Domain.Entities;

public class PrescriptionRevision : TenantBaseEntity
{
    public Guid PrescriptionId { get; set; }
    public Guid VisitId { get; set; }
    public int RevisionNumber { get; set; }
    public string Action { get; set; } = string.Empty;
    public string MedicationName { get; set; } = string.Empty;
    public string? Dosage { get; set; }
    public string? Frequency { get; set; }
    public string? Duration { get; set; }
    public string? Instructions { get; set; }
    public string? Reason { get; set; }
    public Guid ChangedByUserId { get; set; }
    public DateTime ChangedAt { get; set; }

    public Visit Visit { get; set; } = null!;

    public PrescriptionRevision()
    {
        ChangedAt = DateTime.UtcNow;
    }
}
