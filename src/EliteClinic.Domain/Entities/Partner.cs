using EliteClinic.Domain.Enums;

namespace EliteClinic.Domain.Entities;

public class Partner : TenantBaseEntity
{
    public string Name { get; set; } = string.Empty;
    public PartnerType Type { get; set; }
    public string? ContactName { get; set; }
    public string? ContactPhone { get; set; }
    public string? ContactEmail { get; set; }
    public string? Address { get; set; }
    public string? Notes { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<PartnerContract> Contracts { get; set; } = new List<PartnerContract>();
    public ICollection<PartnerOrder> Orders { get; set; } = new List<PartnerOrder>();
    public ICollection<PartnerServiceCatalogItem> ServiceCatalogItems { get; set; } = new List<PartnerServiceCatalogItem>();
    public ICollection<PartnerUser> PartnerUsers { get; set; } = new List<PartnerUser>();
}
