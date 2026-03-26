namespace EliteClinic.Domain.Entities;

public class PatientChronicProfile : TenantBaseEntity
{
    public Guid PatientId { get; set; }
    public bool Diabetes { get; set; }
    public bool Hypertension { get; set; }
    public bool CardiacDisease { get; set; }
    public bool Asthma { get; set; }
    public bool Other { get; set; }
    public string? OtherNotes { get; set; }
    public Guid? RecordedByUserId { get; set; }

    public Patient Patient { get; set; } = null!;
}
