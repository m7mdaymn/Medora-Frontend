using EliteClinic.Domain.Enums;

namespace EliteClinic.Domain.Entities;

public class MarketplaceOrder : TenantBaseEntity
{
    public Guid BranchId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public MarketplaceOrderStatus Status { get; set; }
    public DateTime? WhatsAppRedirectedAt { get; set; }
    public Guid? SalesInvoiceId { get; set; }
    public decimal SubtotalAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public DateTime? ConfirmedAt { get; set; }
    public DateTime? CancelledAt { get; set; }

    public Branch Branch { get; set; } = null!;
    public SalesInvoice? SalesInvoice { get; set; }
    public ICollection<MarketplaceOrderItem> Items { get; set; } = new List<MarketplaceOrderItem>();

    public MarketplaceOrder()
    {
        Status = MarketplaceOrderStatus.Pending;
    }
}
