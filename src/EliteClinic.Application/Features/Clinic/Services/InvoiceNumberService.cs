using EliteClinic.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Data;

namespace EliteClinic.Application.Features.Clinic.Services;

public class InvoiceNumberService : IInvoiceNumberService
{
    private readonly EliteClinicDbContext _context;

    public InvoiceNumberService(EliteClinicDbContext context)
    {
        _context = context;
    }

    public async Task<string> GenerateNextAsync(Guid tenantId, DateTime? issuedAtUtc = null, CancellationToken cancellationToken = default)
    {
        var issueDate = issuedAtUtc ?? DateTime.UtcNow;
        var year = issueDate.Year;

        for (var attempt = 1; attempt <= 5; attempt++)
        {
            await using var tx = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
            try
            {
                var counter = await _context.InvoiceNumberCounters
                    .IgnoreQueryFilters()
                    .FirstOrDefaultAsync(c => !c.IsDeleted && c.TenantId == tenantId && c.Year == year, cancellationToken);

                var nextNumber = 1;
                if (counter == null)
                {
                    counter = new Domain.Entities.InvoiceNumberCounter
                    {
                        TenantId = tenantId,
                        Year = year,
                        NextNumber = 2,
                        LastIssuedAt = DateTime.UtcNow
                    };
                    _context.InvoiceNumberCounters.Add(counter);
                }
                else
                {
                    nextNumber = counter.NextNumber;
                    counter.NextNumber = nextNumber + 1;
                    counter.LastIssuedAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync(cancellationToken);
                await tx.CommitAsync(cancellationToken);

                return $"INV-{year}-{nextNumber:D6}";
            }
            catch (DbUpdateConcurrencyException)
            {
                await tx.RollbackAsync(cancellationToken);
            }
            catch (DbUpdateException)
            {
                await tx.RollbackAsync(cancellationToken);
            }

            await Task.Delay(20 * attempt, cancellationToken);
        }

        throw new InvalidOperationException("Could not generate a unique invoice number after retries");
    }
}
