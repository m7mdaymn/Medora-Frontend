namespace EliteClinic.Domain.Entities;

public class VisitInventoryUsage : TenantBaseEntity
{
    public Guid InventoryItemId { get; set; }
    public Guid DoctorId { get; set; }
    public Guid PatientId { get; set; }
    public Guid VisitId { get; set; }
    public decimal Quantity { get; set; }
    public decimal BilledAmount { get; set; }
    public DateTime UsedAt { get; set; }
    public Guid BranchId { get; set; }
    public bool BilledToInvoice { get; set; }
    public Guid? InvoiceId { get; set; }
    public string? Notes { get; set; }

    public InventoryItem InventoryItem { get; set; } = null!;
    public Doctor Doctor { get; set; } = null!;
    public Patient Patient { get; set; } = null!;
    public Visit Visit { get; set; } = null!;
    public Branch Branch { get; set; } = null!;
    public Invoice? Invoice { get; set; }

    public VisitInventoryUsage()
    {
        UsedAt = DateTime.UtcNow;
    }
}
