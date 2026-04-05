using EliteClinic.Domain.Enums;

namespace EliteClinic.Domain.Entities;

public class DoctorCompensationHistory : TenantBaseEntity
{
    public Guid DoctorId { get; set; }
    public DoctorCompensationMode Mode { get; set; }
    public decimal Value { get; set; }
    public DateTime EffectiveFrom { get; set; }
    public Guid ChangedByUserId { get; set; }
    public string? Notes { get; set; }

    public Doctor Doctor { get; set; } = null!;
}
