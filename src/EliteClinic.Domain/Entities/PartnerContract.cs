namespace EliteClinic.Domain.Entities;

public class PartnerContract : TenantBaseEntity
{
    public Guid PartnerId { get; set; }
    public Guid? BranchId { get; set; }
    public string? ServiceScope { get; set; }
    public decimal? CommissionPercentage { get; set; }
    public decimal? FlatFee { get; set; }
    public DateTime EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
    public bool IsActive { get; set; } = true;
    public string? Notes { get; set; }

    public Partner Partner { get; set; } = null!;
    public Branch? Branch { get; set; }
    public ICollection<PartnerOrder> Orders { get; set; } = new List<PartnerOrder>();

    public PartnerContract()
    {
        EffectiveFrom = DateTime.UtcNow;
    }
}
