using EliteClinic.Domain.Enums;

namespace EliteClinic.Domain.Entities;

public class InventoryItem : TenantBaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string SkuCode { get; set; } = string.Empty;
    public InventoryItemType ItemType { get; set; }
    public string Unit { get; set; } = string.Empty;
    public decimal SalePrice { get; set; }
    public decimal CostPrice { get; set; }
    public decimal QuantityOnHand { get; set; }
    public decimal LowStockThreshold { get; set; }
    public bool UsableInVisit { get; set; }
    public bool SellablePublicly { get; set; }
    public bool InternalOnly { get; set; }
    public bool BillableInVisit { get; set; }
    public bool Active { get; set; }
    public Guid BranchId { get; set; }
    public bool ShowInLanding { get; set; }

    public Branch Branch { get; set; } = null!;
    public ICollection<InventoryItemImage> Images { get; set; } = new List<InventoryItemImage>();
    public ICollection<VisitInventoryUsage> VisitUsages { get; set; } = new List<VisitInventoryUsage>();

    public InventoryItem()
    {
        ItemType = InventoryItemType.Consumable;
        Unit = "unit";
        Active = true;
    }
}
