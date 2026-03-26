using EliteClinic.Domain.Enums;

namespace EliteClinic.Domain.Entities;

public class DoctorCompensationRule : TenantBaseEntity
{
    public Guid DoctorId { get; set; }
    public DoctorCompensationMode Mode { get; set; }
    public decimal Value { get; set; }
    public DateTime EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
    public bool IsActive { get; set; } = true;

    public Doctor Doctor { get; set; } = null!;
}
