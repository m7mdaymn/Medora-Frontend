using EliteClinic.Domain.Enums;

namespace EliteClinic.Domain.Entities;

public class FinanceEvent : TenantBaseEntity
{
    public FinanceActionType ActionType { get; set; }
    public Guid? InvoiceId { get; set; }
    public Guid? PaymentId { get; set; }
    public Guid? VisitId { get; set; }
    public Guid? QueueTicketId { get; set; }
    public Guid? PatientId { get; set; }
    public Guid PerformedByUserId { get; set; }
    public decimal SignedAmount { get; set; }
    public string Reason { get; set; } = string.Empty;
    public DateTime ActionAt { get; set; } = DateTime.UtcNow;
}
