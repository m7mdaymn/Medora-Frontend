using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;
using EliteClinic.Domain.Entities;
using EliteClinic.Domain.Enums;
using EliteClinic.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Data;

namespace EliteClinic.Application.Features.Clinic.Services;

public class PatientCreditService : IPatientCreditService
{
    private readonly EliteClinicDbContext _context;
    private readonly IMessageService _messageService;

    public PatientCreditService(EliteClinicDbContext context, IMessageService messageService)
    {
        _context = context;
        _messageService = messageService;
    }

    public async Task<ApiResponse<PatientCreditTransactionDto>> IssueCreditAsync(Guid tenantId, IssuePatientCreditRequest request, CancellationToken cancellationToken = default)
    {
        if (request.Amount <= 0)
            return ApiResponse<PatientCreditTransactionDto>.Error("Credit amount must be greater than zero");

        var patientExists = await _context.Patients.AnyAsync(p => p.TenantId == tenantId && !p.IsDeleted && p.Id == request.PatientId, cancellationToken);
        if (!patientExists)
            return ApiResponse<PatientCreditTransactionDto>.Error("Patient not found");

        // Prevent duplicate issuance for same invoice/reason combination.
        if (request.InvoiceId.HasValue)
        {
            var existing = await _context.PatientCreditTransactions
                .AnyAsync(t => t.TenantId == tenantId && !t.IsDeleted
                    && t.Type == CreditTransactionType.Issued
                    && t.InvoiceId == request.InvoiceId
                    && t.Reason == request.Reason, cancellationToken);

            if (existing)
                return ApiResponse<PatientCreditTransactionDto>.Error("Credit already issued for this invoice and reason");
        }

        await using var tx = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);

        var balance = await _context.PatientCreditBalances
            .FirstOrDefaultAsync(b => b.TenantId == tenantId && !b.IsDeleted && b.PatientId == request.PatientId, cancellationToken);

        if (balance == null)
        {
            balance = new PatientCreditBalance
            {
                TenantId = tenantId,
                PatientId = request.PatientId,
                Balance = 0
            };
            _context.PatientCreditBalances.Add(balance);
        }

        balance.Balance += request.Amount;

        var transaction = new PatientCreditTransaction
        {
            TenantId = tenantId,
            PatientId = request.PatientId,
            CreditBalance = balance,
            Type = CreditTransactionType.Issued,
            Reason = request.Reason,
            Amount = request.Amount,
            BalanceAfter = balance.Balance,
            InvoiceId = request.InvoiceId,
            PaymentId = request.PaymentId,
            QueueTicketId = request.QueueTicketId,
            QueueSessionId = request.QueueSessionId,
            Notes = request.Notes
        };

        _context.PatientCreditTransactions.Add(transaction);
        await _context.SaveChangesAsync(cancellationToken);
        await tx.CommitAsync(cancellationToken);

        var patient = await _context.Patients
            .FirstOrDefaultAsync(p => p.TenantId == tenantId && !p.IsDeleted && p.Id == request.PatientId, cancellationToken);

        await _messageService.LogWorkflowEventAsync(
            tenantId,
            nameof(MessageScenario.CreditIssued),
            recipientUserId: patient?.UserId,
            recipientPhone: patient?.Phone,
            variables: new Dictionary<string, string>
            {
                ["creditAmount"] = request.Amount.ToString("0.00"),
                ["creditReason"] = request.Reason.ToString()
            });

        return ApiResponse<PatientCreditTransactionDto>.Created(MapTransaction(transaction), "Credit issued successfully");
    }

    public async Task<ApiResponse<PatientCreditTransactionDto>> ConsumeCreditAsync(Guid tenantId, ConsumePatientCreditRequest request, CancellationToken cancellationToken = default)
    {
        if (request.Amount <= 0)
            return ApiResponse<PatientCreditTransactionDto>.Error("Credit amount must be greater than zero");

        await using var tx = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);

        var balance = await _context.PatientCreditBalances
            .FirstOrDefaultAsync(b => b.TenantId == tenantId && !b.IsDeleted && b.PatientId == request.PatientId, cancellationToken);

        if (balance == null || balance.Balance < request.Amount)
            return ApiResponse<PatientCreditTransactionDto>.Error("Insufficient patient credit balance");

        balance.Balance -= request.Amount;

        var transaction = new PatientCreditTransaction
        {
            TenantId = tenantId,
            PatientId = request.PatientId,
            CreditBalanceId = balance.Id,
            Type = CreditTransactionType.Consumed,
            Reason = CreditReason.CreditConsumption,
            Amount = -request.Amount,
            BalanceAfter = balance.Balance,
            InvoiceId = request.InvoiceId,
            PaymentId = request.PaymentId,
            Notes = request.Notes
        };

        _context.PatientCreditTransactions.Add(transaction);
        await _context.SaveChangesAsync(cancellationToken);
        await tx.CommitAsync(cancellationToken);

        return ApiResponse<PatientCreditTransactionDto>.Ok(MapTransaction(transaction), "Credit consumed successfully");
    }

    public async Task<ApiResponse<PatientCreditBalanceDto>> GetBalanceAsync(Guid tenantId, Guid patientId, CancellationToken cancellationToken = default)
    {
        var balance = await _context.PatientCreditBalances
            .FirstOrDefaultAsync(b => b.TenantId == tenantId && !b.IsDeleted && b.PatientId == patientId, cancellationToken);

        return ApiResponse<PatientCreditBalanceDto>.Ok(new PatientCreditBalanceDto
        {
            PatientId = patientId,
            Balance = balance?.Balance ?? 0
        });
    }

    public async Task<ApiResponse<PagedResult<PatientCreditTransactionDto>>> GetHistoryAsync(Guid tenantId, Guid patientId, int pageNumber = 1, int pageSize = 20, CancellationToken cancellationToken = default)
    {
        var query = _context.PatientCreditTransactions
            .Where(t => t.TenantId == tenantId && !t.IsDeleted && t.PatientId == patientId);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var result = new PagedResult<PatientCreditTransactionDto>
        {
            Items = items.Select(MapTransaction).ToList(),
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };

        return ApiResponse<PagedResult<PatientCreditTransactionDto>>.Ok(result);
    }

    private static PatientCreditTransactionDto MapTransaction(PatientCreditTransaction transaction) => new()
    {
        Id = transaction.Id,
        PatientId = transaction.PatientId,
        Type = transaction.Type,
        Reason = transaction.Reason,
        Amount = transaction.Amount,
        BalanceAfter = transaction.BalanceAfter,
        InvoiceId = transaction.InvoiceId,
        PaymentId = transaction.PaymentId,
        QueueTicketId = transaction.QueueTicketId,
        QueueSessionId = transaction.QueueSessionId,
        Notes = transaction.Notes,
        CreatedAt = transaction.CreatedAt
    };
}
