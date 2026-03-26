namespace EliteClinic.Application.Features.Clinic.Services;

public interface IInvoiceNumberService
{
    Task<string> GenerateNextAsync(Guid tenantId, DateTime? issuedAtUtc = null, CancellationToken cancellationToken = default);
}
