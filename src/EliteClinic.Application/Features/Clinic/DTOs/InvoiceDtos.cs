using EliteClinic.Domain.Enums;

namespace EliteClinic.Application.Features.Clinic.DTOs;

// ─── Invoice DTOs ──────────────────────────────────────────────────

public class InvoiceDto
{
    public Guid Id { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public Guid VisitId { get; set; }
    public Guid PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string? PatientPhone { get; set; }
    public Guid DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal RemainingAmount { get; set; }
    public InvoiceStatus Status { get; set; }
    public bool IsServiceRendered { get; set; }
    public decimal CreditAmount { get; set; }
    public bool HasPendingSettlement { get; set; }
    public decimal PendingSettlementAmount { get; set; }
    public decimal TotalRefunded { get; set; }
    public DateTime? CreditIssuedAt { get; set; }
    public string? Notes { get; set; }
    public List<InvoiceLineItemDto> LineItems { get; set; } = new();
    public List<PaymentDto> Payments { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

public class CreateInvoiceRequest
{
    public Guid VisitId { get; set; }
    public decimal Amount { get; set; }
    public string? Notes { get; set; }
}

public class UpdateInvoiceRequest
{
    public decimal Amount { get; set; }
    public string? Notes { get; set; }
}

public class PatchInvoiceRequest
{
    public decimal? Amount { get; set; }
    public string? Notes { get; set; }
}

// ─── Payment DTOs ──────────────────────────────────────────────────

public class PaymentDto
{
    public Guid Id { get; set; }
    public Guid InvoiceId { get; set; }
    public decimal Amount { get; set; }
    public string? PaymentMethod { get; set; }
    public string? ReferenceNumber { get; set; }
    public DateTime PaidAt { get; set; }
    public string? Notes { get; set; }
    public bool IsRefund { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreatePaymentRequest
{
    public Guid InvoiceId { get; set; }
    public decimal Amount { get; set; }
    public string? PaymentMethod { get; set; }
    public string? ReferenceNumber { get; set; }
    public string? Notes { get; set; }
}

public class AddInvoiceAdjustmentRequest
{
    public decimal ExtraAmount { get; set; }
    public string Reason { get; set; } = string.Empty;
}

public class RefundInvoiceRequest
{
    public decimal Amount { get; set; }
    public string? Reason { get; set; }
    public string? ReferenceNumber { get; set; }
}

public class InvoiceLineItemDto
{
    public Guid Id { get; set; }
    public Guid InvoiceId { get; set; }
    public Guid? ClinicServiceId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
    public decimal TotalPrice { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AddInvoiceLineItemRequest
{
    public Guid? ClinicServiceId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; } = 1;
    public string? Notes { get; set; }
}
