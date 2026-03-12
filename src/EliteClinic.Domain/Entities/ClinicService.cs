namespace EliteClinic.Domain.Entities;

/// <summary>
/// A clinic-level service (e.g. "General Consultation", "Dental Cleaning").
/// Global to tenant. Doctors link to clinic services via DoctorServiceLink.
/// </summary>
public class ClinicService : TenantBaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal DefaultPrice { get; set; }
    public int? DefaultDurationMinutes { get; set; }
    public bool IsActive { get; set; }

    // Navigation
    public ICollection<DoctorServiceLink> DoctorLinks { get; set; } = new List<DoctorServiceLink>();

    public ClinicService()
    {
        IsActive = true;
    }
}

/// <summary>
/// Links a ClinicService to a specific Doctor with optional price/duration override.
/// </summary>
public class DoctorServiceLink : TenantBaseEntity
{
    public Guid ClinicServiceId { get; set; }
    public Guid DoctorId { get; set; }
    public decimal? OverridePrice { get; set; }
    public int? OverrideDurationMinutes { get; set; }
    public bool IsActive { get; set; }

    // Navigation
    public ClinicService ClinicService { get; set; } = null!;
    public Doctor Doctor { get; set; } = null!;

    public DoctorServiceLink()
    {
        IsActive = true;
    }
}
