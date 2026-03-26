namespace EliteClinic.Domain.Entities;

public class InvoiceLineItem : TenantBaseEntity
{
    public Guid InvoiceId { get; set; }
    public Guid? ClinicServiceId { get; set; }
    public Guid? AddedByUserId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
    public decimal TotalPrice { get; set; }
    public string? Notes { get; set; }

    public Invoice Invoice { get; set; } = null!;
}
