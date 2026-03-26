using EliteClinic.Domain.Enums;

namespace EliteClinic.Domain.Entities;

public class PatientCreditTransaction : TenantBaseEntity
{
    public Guid PatientId { get; set; }
    public Guid CreditBalanceId { get; set; }
    public CreditTransactionType Type { get; set; }
    public CreditReason Reason { get; set; }
    public decimal Amount { get; set; }
    public decimal BalanceAfter { get; set; }
    public Guid? InvoiceId { get; set; }
    public Guid? PaymentId { get; set; }
    public Guid? QueueTicketId { get; set; }
    public Guid? QueueSessionId { get; set; }
    public string? Notes { get; set; }

    public Patient Patient { get; set; } = null!;
    public PatientCreditBalance CreditBalance { get; set; } = null!;
    public Invoice? Invoice { get; set; }
    public Payment? Payment { get; set; }
    public QueueTicket? QueueTicket { get; set; }
    public QueueSession? QueueSession { get; set; }
}
