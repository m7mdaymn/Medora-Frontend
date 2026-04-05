namespace EliteClinic.Domain.Entities;

public class MarketplaceOrderItem : TenantBaseEntity
{
    public Guid MarketplaceOrderId { get; set; }
    public Guid InventoryItemId { get; set; }
    public string ItemNameSnapshot { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public decimal Quantity { get; set; }
    public decimal LineTotal { get; set; }

    public MarketplaceOrder MarketplaceOrder { get; set; } = null!;
    public InventoryItem InventoryItem { get; set; } = null!;
}
