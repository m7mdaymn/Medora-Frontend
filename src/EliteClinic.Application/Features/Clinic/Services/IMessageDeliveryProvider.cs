using EliteClinic.Domain.Entities;

namespace EliteClinic.Application.Features.Clinic.Services;

public interface IMessageDeliveryProvider
{
    Task<MessageDeliveryResult> DeliverAsync(MessageLog message, CancellationToken cancellationToken = default);
}

public class MessageDeliveryResult
{
    public bool Success { get; set; }
    public bool Delivered { get; set; }
    public bool IsPermanentFailure { get; set; }
    public string? ProviderMessageId { get; set; }
    public string? ProviderStatus { get; set; }
    public string? ProviderRawResponse { get; set; }
    public string? Error { get; set; }
}
