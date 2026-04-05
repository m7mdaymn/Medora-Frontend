using EliteClinic.Domain.Enums;

namespace EliteClinic.Domain.Entities;

public class SalesInvoice : TenantBaseEntity
{
    public string InvoiceNumber { get; set; } = string.Empty;
    public Guid BranchId { get; set; }
    public Guid MarketplaceOrderId { get; set; }
    public string CustomerNameSnapshot { get; set; } = string.Empty;
    public string PhoneSnapshot { get; set; } = string.Empty;
    public decimal SubtotalAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public SalesInvoiceStatus Status { get; set; }
    public DateTime IssuedAt { get; set; }
    public DateTime? CancelledAt { get; set; }

    public Branch Branch { get; set; } = null!;
    public ICollection<SalesInvoiceLineItem> LineItems { get; set; } = new List<SalesInvoiceLineItem>();

    public SalesInvoice()
    {
        Status = SalesInvoiceStatus.Issued;
        IssuedAt = DateTime.UtcNow;
    }
}
