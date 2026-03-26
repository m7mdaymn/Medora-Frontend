using EliteClinic.Application.Features.Clinic.Services;
using EliteClinic.Domain.Entities;
using EliteClinic.Domain.Enums;
using Microsoft.Extensions.Options;

namespace EliteClinic.Api.Services;

public class NoopMessageDeliveryProvider : IMessageDeliveryProvider
{
    private readonly MessagingProviderOptions _options;

    public NoopMessageDeliveryProvider(IOptions<MessagingProviderOptions> options)
    {
        _options = options.Value;
    }

    public Task<MessageDeliveryResult> DeliverAsync(MessageLog message, CancellationToken cancellationToken = default)
    {
        if (message.Channel == MessageChannel.PWA)
        {
            return Task.FromResult(new MessageDeliveryResult
            {
                Success = true,
                Delivered = true,
                ProviderStatus = "PWA_DELIVERED_LOCAL"
            });
        }

        if (!_options.Whats360Enabled)
        {
            return Task.FromResult(new MessageDeliveryResult
            {
                Success = false,
                IsPermanentFailure = false,
                Error = "Whats360 provider is disabled or not configured"
            });
        }

        return Task.FromResult(new MessageDeliveryResult
        {
            Success = false,
            IsPermanentFailure = false,
            Error = "WhatsApp provider adapter not implemented for this environment"
        });
    }
}
