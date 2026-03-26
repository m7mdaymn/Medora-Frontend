using EliteClinic.Domain.Enums;

namespace EliteClinic.Application.Features.Clinic.DTOs;

public class PatientCreditBalanceDto
{
    public Guid PatientId { get; set; }
    public decimal Balance { get; set; }
}

public class PatientCreditTransactionDto
{
    public Guid Id { get; set; }
    public Guid PatientId { get; set; }
    public CreditTransactionType Type { get; set; }
    public CreditReason Reason { get; set; }
    public decimal Amount { get; set; }
    public decimal BalanceAfter { get; set; }
    public Guid? InvoiceId { get; set; }
    public Guid? PaymentId { get; set; }
    public Guid? QueueTicketId { get; set; }
    public Guid? QueueSessionId { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class IssuePatientCreditRequest
{
    public Guid PatientId { get; set; }
    public decimal Amount { get; set; }
    public CreditReason Reason { get; set; }
    public Guid? InvoiceId { get; set; }
    public Guid? PaymentId { get; set; }
    public Guid? QueueTicketId { get; set; }
    public Guid? QueueSessionId { get; set; }
    public string? Notes { get; set; }
}

public class ConsumePatientCreditRequest
{
    public Guid PatientId { get; set; }
    public decimal Amount { get; set; }
    public Guid? InvoiceId { get; set; }
    public Guid? PaymentId { get; set; }
    public string? Notes { get; set; }
}
