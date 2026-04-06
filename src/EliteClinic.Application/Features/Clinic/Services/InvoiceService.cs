using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;
using EliteClinic.Domain.Entities;
using EliteClinic.Domain.Enums;
using EliteClinic.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace EliteClinic.Application.Features.Clinic.Services;

public class InvoiceService : IInvoiceService
{
    private readonly EliteClinicDbContext _context;
    private readonly IInvoiceNumberService _invoiceNumberService;

    public InvoiceService(EliteClinicDbContext context, IInvoiceNumberService invoiceNumberService)
    {
        _context = context;
        _invoiceNumberService = invoiceNumberService;
    }

    public async Task<ApiResponse<InvoiceDto>> EnsureInvoiceForVisitAsync(Guid tenantId, Guid visitId, Guid performedByUserId, string? initialNotes = null)
    {
        var visit = await _context.Visits
            .Include(v => v.Doctor)
            .Include(v => v.Patient)
            .FirstOrDefaultAsync(v => v.Id == visitId && v.TenantId == tenantId && !v.IsDeleted);

        if (visit == null)
            return ApiResponse<InvoiceDto>.Error("Visit not found");

        var existing = await _context.Invoices
            .Include(i => i.Patient)
            .Include(i => i.Doctor)
            .Include(i => i.LineItems.Where(li => !li.IsDeleted))
            .Include(i => i.Payments.Where(p => !p.IsDeleted))
            .FirstOrDefaultAsync(i => i.VisitId == visitId && i.TenantId == tenantId && !i.IsDeleted);

        if (existing != null)
            return ApiResponse<InvoiceDto>.Ok(MapToDto(existing), "Invoice already exists for visit");

        var invoice = new Invoice
        {
            TenantId = tenantId,
            InvoiceNumber = await _invoiceNumberService.GenerateNextAsync(tenantId),
            BranchId = visit.BranchId,
            VisitId = visit.Id,
            PatientId = visit.PatientId,
            PatientNameSnapshot = visit.Patient?.Name ?? string.Empty,
            PatientPhoneSnapshot = visit.Patient?.Phone,
            DoctorId = visit.DoctorId,
            Amount = 0m,
            PaidAmount = 0m,
            RemainingAmount = 0m,
            Status = InvoiceStatus.Unpaid,
            HasPendingSettlement = false,
            PendingSettlementAmount = 0m,
            Notes = initialNotes
        };

        _context.Invoices.Add(invoice);
        _context.AuditLogs.Add(new AuditLog(performedByUserId, tenantId, nameof(Invoice), invoice.Id.ToString(), "Create")
        {
            NewValues = JsonSerializer.Serialize(new
            {
                invoice.VisitId,
                invoice.BranchId,
                invoice.Amount,
                invoice.Status,
                InitialNotes = initialNotes
            })
        });

        await _context.SaveChangesAsync();

        var saved = await GetInvoiceWithIncludes(tenantId, invoice.Id);
        return ApiResponse<InvoiceDto>.Created(MapToDto(saved!), "Invoice ensured for visit");
    }

    public async Task<ApiResponse<InvoiceDto>> CreateInvoiceAsync(Guid tenantId, CreateInvoiceRequest request)
    {
        var visit = await _context.Visits
            .Include(v => v.Doctor)
            .Include(v => v.Patient)
            .FirstOrDefaultAsync(v => v.Id == request.VisitId && v.TenantId == tenantId && !v.IsDeleted);
        if (visit == null)
            return ApiResponse<InvoiceDto>.Error("Visit not found");

        // Check no invoice already exists for this visit
        var existing = await _context.Invoices
            .FirstOrDefaultAsync(i => i.VisitId == request.VisitId && !i.IsDeleted);
        if (existing != null)
            return ApiResponse<InvoiceDto>.Error("An invoice already exists for this visit");

        if (request.Amount <= 0)
            return ApiResponse<InvoiceDto>.Error("Amount must be greater than zero");

        var invoice = new Invoice
        {
            TenantId = tenantId,
            InvoiceNumber = await _invoiceNumberService.GenerateNextAsync(tenantId),
            VisitId = request.VisitId,
            PatientId = visit.PatientId,
            PatientNameSnapshot = visit.Patient?.Name ?? string.Empty,
            PatientPhoneSnapshot = visit.Patient?.Phone,
            DoctorId = visit.DoctorId,
            Amount = request.Amount,
            PaidAmount = 0,
            RemainingAmount = request.Amount,
            Status = InvoiceStatus.Unpaid,
            HasPendingSettlement = false,
            PendingSettlementAmount = 0,
            Notes = request.Notes
        };

        _context.Invoices.Add(invoice);
        await _context.SaveChangesAsync();

        var saved = await GetInvoiceWithIncludes(tenantId, invoice.Id);
        return ApiResponse<InvoiceDto>.Created(MapToDto(saved!), "Invoice created successfully");
    }

    public async Task<ApiResponse<InvoiceDto>> UpdateInvoiceAsync(Guid tenantId, Guid invoiceId, UpdateInvoiceRequest request)
    {
        var invoice = await GetInvoiceWithIncludes(tenantId, invoiceId);
        if (invoice == null)
            return ApiResponse<InvoiceDto>.Error("Invoice not found");

        // Check parent visit is still open
        var visit = await _context.Visits.FirstOrDefaultAsync(v => v.Id == invoice.VisitId && !v.IsDeleted);
        if (visit != null && visit.Status != VisitStatus.Open)
            return ApiResponse<InvoiceDto>.Error("Cannot update invoice — visit is already completed");

        if (request.Amount <= 0)
            return ApiResponse<InvoiceDto>.Error("Amount must be greater than zero");

        if (request.Amount < invoice.PaidAmount)
            return ApiResponse<InvoiceDto>.Error("New amount cannot be less than already paid amount");

        invoice.Amount = request.Amount;
        invoice.RemainingAmount = request.Amount - invoice.PaidAmount;
        invoice.Notes = request.Notes;

        // Recalculate status
        invoice.Status = invoice.RemainingAmount <= 0 ? InvoiceStatus.Paid
            : invoice.PaidAmount > 0 ? InvoiceStatus.PartiallyPaid
            : InvoiceStatus.Unpaid;

        await _context.SaveChangesAsync();

        var updated = await GetInvoiceWithIncludes(tenantId, invoiceId);
        return ApiResponse<InvoiceDto>.Ok(MapToDto(updated!), "Invoice updated successfully");
    }

    public async Task<ApiResponse<InvoiceDto>> PatchInvoiceAsync(Guid tenantId, Guid invoiceId, PatchInvoiceRequest request)
    {
        var invoice = await GetInvoiceWithIncludes(tenantId, invoiceId);
        if (invoice == null)
            return ApiResponse<InvoiceDto>.Error("Invoice not found");

        var visit = await _context.Visits.FirstOrDefaultAsync(v => v.Id == invoice.VisitId && !v.IsDeleted);
        if (visit != null && visit.Status != VisitStatus.Open)
            return ApiResponse<InvoiceDto>.Error("Cannot update invoice — visit is already completed");

        if (request.Amount.HasValue)
        {
            if (request.Amount.Value <= 0)
                return ApiResponse<InvoiceDto>.Error("Amount must be greater than zero");
            if (request.Amount.Value < invoice.PaidAmount)
                return ApiResponse<InvoiceDto>.Error("New amount cannot be less than already paid amount");

            invoice.Amount = request.Amount.Value;
            invoice.RemainingAmount = invoice.Amount - invoice.PaidAmount;

            invoice.Status = invoice.RemainingAmount <= 0 ? InvoiceStatus.Paid
                : invoice.PaidAmount > 0 ? InvoiceStatus.PartiallyPaid
                : InvoiceStatus.Unpaid;
        }

        if (request.Notes != null)
            invoice.Notes = request.Notes;

        await _context.SaveChangesAsync();

        var patched = await GetInvoiceWithIncludes(tenantId, invoiceId);
        return ApiResponse<InvoiceDto>.Ok(MapToDto(patched!), "Invoice patched successfully");
    }

    public async Task<ApiResponse<InvoiceDto>> GetInvoiceByIdAsync(Guid tenantId, Guid invoiceId)
    {
        var invoice = await GetInvoiceWithIncludes(tenantId, invoiceId);
        if (invoice == null)
            return ApiResponse<InvoiceDto>.Error("Invoice not found");

        return ApiResponse<InvoiceDto>.Ok(MapToDto(invoice), "Invoice retrieved successfully");
    }

    public async Task<ApiResponse<PagedResult<InvoiceDto>>> GetInvoicesAsync(Guid tenantId, DateTime? from, DateTime? to,
        Guid? doctorId, string? invoiceNumber = null, int pageNumber = 1, int pageSize = 10)
    {
        var query = _context.Invoices
            .Include(i => i.Patient)
            .Include(i => i.Doctor)
            .Include(i => i.Payments.Where(p => !p.IsDeleted))
            .Where(i => i.TenantId == tenantId && !i.IsDeleted);

        if (from.HasValue)
            query = query.Where(i => i.CreatedAt >= from.Value);
        if (to.HasValue)
            query = query.Where(i => i.CreatedAt <= to.Value.AddDays(1));
        if (doctorId.HasValue)
            query = query.Where(i => i.DoctorId == doctorId.Value);
        if (!string.IsNullOrWhiteSpace(invoiceNumber))
        {
            var normalized = invoiceNumber.Trim().ToUpperInvariant();
            query = query.Where(i => i.InvoiceNumber.Contains(normalized));
        }

        var totalCount = await query.CountAsync();
        var invoices = await query
            .OrderByDescending(i => i.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var result = new PagedResult<InvoiceDto>
        {
            Items = invoices.Select(MapToDto).ToList(),
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };

        return ApiResponse<PagedResult<InvoiceDto>>.Ok(result, $"Retrieved {result.Items.Count} invoice(s)");
    }

    public async Task<ApiResponse<PaymentDto>> RecordPaymentAsync(Guid tenantId, CreatePaymentRequest request)
    {
        var invoice = await GetInvoiceWithIncludes(tenantId, request.InvoiceId);
        if (invoice == null)
            return ApiResponse<PaymentDto>.Error("Invoice not found");

        if (request.Amount <= 0)
            return ApiResponse<PaymentDto>.Error("Payment amount must be greater than zero");

        if (request.Amount > invoice.RemainingAmount)
            return ApiResponse<PaymentDto>.Error($"Payment amount ({request.Amount}) exceeds remaining amount ({invoice.RemainingAmount})");

        var payment = new Payment
        {
            TenantId = tenantId,
            InvoiceId = request.InvoiceId,
            Amount = request.Amount,
            PaymentMethod = request.PaymentMethod,
            ReferenceNumber = request.ReferenceNumber,
            Notes = request.Notes,
            PaidAt = DateTime.UtcNow
        };

        _context.Payments.Add(payment);

        // Update invoice totals
        invoice.PaidAmount += request.Amount;
        invoice.RemainingAmount = invoice.Amount - invoice.PaidAmount;
        invoice.Status = invoice.RemainingAmount <= 0 ? InvoiceStatus.Paid : InvoiceStatus.PartiallyPaid;
        invoice.HasPendingSettlement = invoice.IsServiceRendered && invoice.RemainingAmount > 0;
        invoice.PendingSettlementAmount = invoice.HasPendingSettlement ? invoice.RemainingAmount : 0;

        var visit = await _context.Visits
            .FirstOrDefaultAsync(v => v.Id == invoice.VisitId && v.TenantId == tenantId && !v.IsDeleted);
        if (visit != null)
        {
            if (invoice.RemainingAmount <= 0)
            {
                visit.FinancialState = EncounterFinancialState.FinanciallySettled;
                visit.FinanciallySettledAt = DateTime.UtcNow;

                if (visit.LifecycleState == EncounterLifecycleState.MedicallyCompleted
                    || visit.Status == VisitStatus.Completed)
                {
                    visit.LifecycleState = EncounterLifecycleState.FullyClosed;
                    visit.FullyClosedAt = DateTime.UtcNow;
                }
            }
            else if (invoice.IsServiceRendered)
            {
                visit.FinancialState = EncounterFinancialState.PendingSettlement;
            }
        }

        await _context.SaveChangesAsync();

        return ApiResponse<PaymentDto>.Created(new PaymentDto
        {
            Id = payment.Id,
            InvoiceId = payment.InvoiceId,
            Amount = payment.Amount,
            PaymentMethod = payment.PaymentMethod,
            ReferenceNumber = payment.ReferenceNumber,
            PaidAt = payment.PaidAt,
            Notes = payment.Notes,
            IsRefund = payment.Amount < 0,
            CreatedAt = payment.CreatedAt
        }, "Payment recorded successfully");
    }

    public async Task<ApiResponse<InvoiceDto>> AddLineItemAsync(Guid tenantId, Guid invoiceId, AddInvoiceLineItemRequest request, Guid performedByUserId)
    {
        var invoice = await GetInvoiceWithIncludes(tenantId, invoiceId);
        if (invoice == null)
            return ApiResponse<InvoiceDto>.Error("Invoice not found");

        if (request.Quantity <= 0)
            return ApiResponse<InvoiceDto>.Error("Quantity must be greater than zero");

        if (request.UnitPrice < 0)
            return ApiResponse<InvoiceDto>.Error("Unit price must be non-negative");

        if (string.IsNullOrWhiteSpace(request.ItemName))
            return ApiResponse<InvoiceDto>.Error("Item name is required");

        var lineTotal = request.UnitPrice * request.Quantity;

        var lineItem = new InvoiceLineItem
        {
            TenantId = tenantId,
            InvoiceId = invoice.Id,
            ClinicServiceId = request.ClinicServiceId,
            AddedByUserId = performedByUserId,
            ItemName = request.ItemName.Trim(),
            UnitPrice = request.UnitPrice,
            Quantity = request.Quantity,
            TotalPrice = lineTotal,
            Notes = request.Notes
        };

        _context.Set<InvoiceLineItem>().Add(lineItem);

        invoice.Amount += lineTotal;
        invoice.RemainingAmount = invoice.Amount - invoice.PaidAmount;
        invoice.Status = invoice.RemainingAmount <= 0
            ? InvoiceStatus.Paid
            : invoice.PaidAmount > 0 ? InvoiceStatus.PartiallyPaid : InvoiceStatus.Unpaid;

        var visit = await _context.Visits
            .FirstOrDefaultAsync(v => v.Id == invoice.VisitId && v.TenantId == tenantId && !v.IsDeleted);
        if (visit != null && visit.Status == VisitStatus.Completed && invoice.RemainingAmount > 0)
        {
            invoice.HasPendingSettlement = true;
            invoice.PendingSettlementAmount = invoice.RemainingAmount;
            visit.LifecycleState = EncounterLifecycleState.MedicallyCompleted;
            visit.FinancialState = EncounterFinancialState.PendingSettlement;
        }

        await _context.SaveChangesAsync();

        var updated = await GetInvoiceWithIncludes(tenantId, invoiceId);
        return ApiResponse<InvoiceDto>.Ok(MapToDto(updated!), "Invoice line item added successfully");
    }

    public async Task<ApiResponse<InvoiceDto>> AddAdjustmentAsync(Guid tenantId, Guid invoiceId, AddInvoiceAdjustmentRequest request, Guid performedByUserId)
    {
        var invoice = await GetInvoiceWithIncludes(tenantId, invoiceId);
        if (invoice == null)
            return ApiResponse<InvoiceDto>.Error("Invoice not found");

        var visit = await _context.Visits.FirstOrDefaultAsync(v => v.Id == invoice.VisitId && !v.IsDeleted);
        if (visit != null && visit.Status != VisitStatus.Open)
            return ApiResponse<InvoiceDto>.Error("Cannot add extra charges — visit is already completed");

        if (request.ExtraAmount <= 0)
            return ApiResponse<InvoiceDto>.Error("Extra amount must be greater than zero");

        if (string.IsNullOrWhiteSpace(request.Reason))
            return ApiResponse<InvoiceDto>.Error("Adjustment reason is required");

        var oldValues = new
        {
            invoice.Amount,
            invoice.PaidAmount,
            invoice.RemainingAmount,
            invoice.Status
        };

        invoice.Amount += request.ExtraAmount;
        invoice.RemainingAmount = invoice.Amount - invoice.PaidAmount;
        invoice.Status = invoice.RemainingAmount <= 0 ? InvoiceStatus.Paid
            : invoice.PaidAmount > 0 ? InvoiceStatus.PartiallyPaid
            : InvoiceStatus.Unpaid;
        invoice.Notes = string.IsNullOrWhiteSpace(invoice.Notes)
            ? $"Adjustment +{request.ExtraAmount:0.##}: {request.Reason}"
            : $"{invoice.Notes} | Adjustment +{request.ExtraAmount:0.##}: {request.Reason}";

        _context.AuditLogs.Add(new AuditLog(performedByUserId, tenantId, nameof(Invoice), invoice.Id.ToString(), "FinancialAdjustment")
        {
            OldValues = JsonSerializer.Serialize(oldValues),
            NewValues = JsonSerializer.Serialize(new
            {
                invoice.Amount,
                invoice.PaidAmount,
                invoice.RemainingAmount,
                invoice.Status,
                request.ExtraAmount,
                request.Reason
            })
        });

        await _context.SaveChangesAsync();

        var updated = await GetInvoiceWithIncludes(tenantId, invoiceId);
        return ApiResponse<InvoiceDto>.Ok(MapToDto(updated!), "Invoice adjusted successfully");
    }

    public async Task<ApiResponse<PaymentDto>> RefundPaymentAsync(Guid tenantId, Guid invoiceId, RefundInvoiceRequest request, Guid performedByUserId)
    {
        var invoice = await GetInvoiceWithIncludes(tenantId, invoiceId);
        if (invoice == null)
            return ApiResponse<PaymentDto>.Error("Invoice not found");

        if (request.Amount <= 0)
            return ApiResponse<PaymentDto>.Error("Refund amount must be greater than zero");

        if (request.Amount > invoice.PaidAmount)
            return ApiResponse<PaymentDto>.Error("Refund amount cannot exceed current paid amount");

        var refund = new Payment
        {
            TenantId = tenantId,
            InvoiceId = invoice.Id,
            Amount = -request.Amount,
            PaymentMethod = "Refund",
            ReferenceNumber = request.ReferenceNumber,
            Notes = string.IsNullOrWhiteSpace(request.Reason)
                ? "Refund issued"
                : $"Refund issued: {request.Reason}",
            PaidAt = DateTime.UtcNow
        };

        _context.Payments.Add(refund);

        var oldValues = new
        {
            invoice.Amount,
            invoice.PaidAmount,
            invoice.RemainingAmount,
            invoice.Status
        };

        var paidBeforeRefund = invoice.PaidAmount;
        invoice.PaidAmount -= request.Amount;
        if (invoice.PaidAmount < 0)
            invoice.PaidAmount = 0;
        var isFullRefund = request.Amount >= paidBeforeRefund && paidBeforeRefund > 0;
        if (isFullRefund)
        {
            invoice.Amount = 0;
            invoice.PaidAmount = 0;
            invoice.RemainingAmount = 0;
            invoice.HasPendingSettlement = false;
            invoice.PendingSettlementAmount = 0;
        }
        else
        {
            invoice.RemainingAmount = Math.Max(invoice.Amount - invoice.PaidAmount, 0m);
        }
        invoice.Status = isFullRefund
            ? InvoiceStatus.Refunded
            : invoice.RemainingAmount <= 0 ? InvoiceStatus.Paid
            : invoice.PaidAmount > 0 ? InvoiceStatus.PartiallyPaid
            : InvoiceStatus.Unpaid;
        invoice.Notes = string.IsNullOrWhiteSpace(invoice.Notes)
            ? $"Refund -{request.Amount:0.##} issued"
            : $"{invoice.Notes} | Refund -{request.Amount:0.##} issued";

        _context.AuditLogs.Add(new AuditLog(performedByUserId, tenantId, nameof(Invoice), invoice.Id.ToString(), "Refund")
        {
            OldValues = JsonSerializer.Serialize(oldValues),
            NewValues = JsonSerializer.Serialize(new
            {
                invoice.Amount,
                invoice.PaidAmount,
                invoice.RemainingAmount,
                invoice.Status,
                RefundAmount = request.Amount,
                request.Reason
            })
        });

        await _context.SaveChangesAsync();

        return ApiResponse<PaymentDto>.Created(new PaymentDto
        {
            Id = refund.Id,
            InvoiceId = refund.InvoiceId,
            Amount = refund.Amount,
            PaymentMethod = refund.PaymentMethod,
            ReferenceNumber = refund.ReferenceNumber,
            PaidAt = refund.PaidAt,
            Notes = refund.Notes,
            IsRefund = true,
            CreatedAt = refund.CreatedAt
        }, "Refund recorded successfully");
    }

    public async Task<ApiResponse<List<PaymentDto>>> GetPaymentsByInvoiceAsync(Guid tenantId, Guid invoiceId)
    {
        var invoice = await _context.Invoices.FirstOrDefaultAsync(i => i.Id == invoiceId && i.TenantId == tenantId && !i.IsDeleted);
        if (invoice == null)
            return ApiResponse<List<PaymentDto>>.Error("Invoice not found");

        var payments = await _context.Payments
            .Where(p => p.InvoiceId == invoiceId && p.TenantId == tenantId && !p.IsDeleted)
            .OrderByDescending(p => p.PaidAt)
            .ToListAsync();

        return ApiResponse<List<PaymentDto>>.Ok(
            payments.Select(p => new PaymentDto
            {
                Id = p.Id,
                InvoiceId = p.InvoiceId,
                Amount = p.Amount,
                PaymentMethod = p.PaymentMethod,
                ReferenceNumber = p.ReferenceNumber,
                PaidAt = p.PaidAt,
                Notes = p.Notes,
                IsRefund = p.Amount < 0,
                CreatedAt = p.CreatedAt
            }).ToList(),
            $"Retrieved {payments.Count} payment(s)");
    }

    // ── Helpers ────────────────────────────────────────────────────

    private async Task<Invoice?> GetInvoiceWithIncludes(Guid tenantId, Guid id)
    {
        return await _context.Invoices
            .Include(i => i.Patient)
            .Include(i => i.Doctor)
            .Include(i => i.LineItems.Where(li => !li.IsDeleted))
            .Include(i => i.Payments.Where(p => !p.IsDeleted))
            .FirstOrDefaultAsync(i => i.Id == id && i.TenantId == tenantId && !i.IsDeleted);
    }

    private static InvoiceDto MapToDto(Invoice i)
    {
        var activePayments = i.Payments?.Where(p => !p.IsDeleted).ToList() ?? new List<Payment>();
        var hasPaymentRows = activePayments.Count > 0;
        var paidAmount = hasPaymentRows
            ? Math.Max(activePayments.Sum(p => p.Amount), 0m)
            : i.PaidAmount;
        var totalRefunded = activePayments.Where(p => p.Amount < 0).Sum(p => Math.Abs(p.Amount));
        var isFullyRefunded = totalRefunded >= i.Amount && paidAmount <= 0m;
        var remainingAmount = isFullyRefunded ? 0m : Math.Max(i.Amount - paidAmount, 0m);
        var status = isFullyRefunded
            ? InvoiceStatus.Refunded
            : remainingAmount <= 0 ? InvoiceStatus.Paid
            : paidAmount > 0 ? InvoiceStatus.PartiallyPaid : InvoiceStatus.Unpaid;

        return new InvoiceDto
        {
            Id = i.Id,
            InvoiceNumber = i.InvoiceNumber,
            VisitId = i.VisitId,
            PatientId = i.PatientId,
            PatientName = i.Patient?.Name ?? i.PatientNameSnapshot,
            PatientPhone = i.Patient?.Phone ?? i.PatientPhoneSnapshot,
            DoctorId = i.DoctorId,
            DoctorName = i.Doctor?.Name ?? string.Empty,
            Amount = i.Amount,
            PaidAmount = paidAmount,
            RemainingAmount = remainingAmount,
            Status = status,
            IsServiceRendered = i.IsServiceRendered,
            HasPendingSettlement = i.HasPendingSettlement,
            PendingSettlementAmount = i.PendingSettlementAmount,
            TotalRefunded = totalRefunded,
            Notes = i.Notes,
            LineItems = i.LineItems?.Where(li => !li.IsDeleted).Select(li => new InvoiceLineItemDto
            {
                Id = li.Id,
                InvoiceId = li.InvoiceId,
                ClinicServiceId = li.ClinicServiceId,
                ItemName = li.ItemName,
                UnitPrice = li.UnitPrice,
                Quantity = li.Quantity,
                TotalPrice = li.TotalPrice,
                Notes = li.Notes,
                CreatedAt = li.CreatedAt
            }).ToList() ?? new(),
            Payments = activePayments.Select(p => new PaymentDto
            {
                Id = p.Id,
                InvoiceId = p.InvoiceId,
                Amount = p.Amount,
                PaymentMethod = p.PaymentMethod,
                ReferenceNumber = p.ReferenceNumber,
                PaidAt = p.PaidAt,
                Notes = p.Notes,
                IsRefund = p.Amount < 0,
                CreatedAt = p.CreatedAt
            }).ToList() ?? new(),
            CreatedAt = i.CreatedAt
        };
    }
}
