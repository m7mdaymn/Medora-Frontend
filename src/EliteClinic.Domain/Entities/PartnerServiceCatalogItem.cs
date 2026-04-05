using EliteClinic.Domain.Enums;

namespace EliteClinic.Domain.Entities;

public class PartnerServiceCatalogItem : TenantBaseEntity
{
    public Guid PartnerId { get; set; }
    public Guid? BranchId { get; set; }
    public string ServiceName { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public PartnerSettlementTarget SettlementTarget { get; set; }
    public decimal SettlementPercentage { get; set; }
    public decimal? ClinicDoctorSharePercentage { get; set; }
    public bool IsActive { get; set; } = true;
    public string? Notes { get; set; }

    public Partner Partner { get; set; } = null!;
    public Branch? Branch { get; set; }

    public PartnerServiceCatalogItem()
    {
        SettlementTarget = PartnerSettlementTarget.Clinic;
    }
}