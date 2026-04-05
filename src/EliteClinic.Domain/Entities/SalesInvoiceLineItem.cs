namespace EliteClinic.Domain.Entities;

public class SalesInvoiceLineItem : TenantBaseEntity
{
    public Guid SalesInvoiceId { get; set; }
    public Guid InventoryItemId { get; set; }
    public string ItemNameSnapshot { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public decimal Quantity { get; set; }
    public decimal LineTotal { get; set; }

    public SalesInvoice SalesInvoice { get; set; } = null!;
    public InventoryItem InventoryItem { get; set; } = null!;
}
