using EliteClinic.Domain.Enums;

namespace EliteClinic.Domain.Entities;

/// <summary>
/// ONE invoice per visit. Tracks total amount, paid amount, and remaining.
/// Editable only while the parent Visit status is Open.
/// </summary>
public class Invoice : TenantBaseEntity
{
    public string InvoiceNumber { get; set; } = string.Empty;
    public Guid VisitId { get; set; }
    public Guid PatientId { get; set; }
    public string PatientNameSnapshot { get; set; } = string.Empty;
    public string? PatientPhoneSnapshot { get; set; }
    public Guid DoctorId { get; set; }
    public decimal Amount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal RemainingAmount { get; set; }
    public InvoiceStatus Status { get; set; }
    public bool IsServiceRendered { get; set; }
    public decimal CreditAmount { get; set; }
    public DateTime? CreditIssuedAt { get; set; }
    public bool HasPendingSettlement { get; set; }
    public decimal PendingSettlementAmount { get; set; }
    public string? Notes { get; set; }

    public Visit Visit { get; set; } = null!;
    public Patient Patient { get; set; } = null!;
    public Doctor Doctor { get; set; } = null!;
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    public ICollection<InvoiceLineItem> LineItems { get; set; } = new List<InvoiceLineItem>();

    public Invoice()
    {
        Status = InvoiceStatus.Unpaid;
        PaidAmount = 0;
        IsServiceRendered = false;
        CreditAmount = 0;
        HasPendingSettlement = false;
        PendingSettlementAmount = 0;
    }
}
