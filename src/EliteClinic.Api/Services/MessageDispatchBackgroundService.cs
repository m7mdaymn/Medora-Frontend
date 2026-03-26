using EliteClinic.Application.Features.Clinic.Services;
using EliteClinic.Domain.Enums;
using EliteClinic.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace EliteClinic.Api.Services;

public class MessageDispatchBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<MessageDispatchBackgroundService> _logger;
    private readonly MessagingProviderOptions _options;

    public MessageDispatchBackgroundService(IServiceProvider serviceProvider, IOptions<MessagingProviderOptions> options, ILogger<MessageDispatchBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _options = options.Value;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessPendingMessages(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Message dispatch worker iteration failed");
            }

            await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
        }
    }

    private async Task ProcessPendingMessages(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<EliteClinicDbContext>();
        var provider = scope.ServiceProvider.GetRequiredService<IMessageDeliveryProvider>();

        var now = DateTime.UtcNow;
        var batch = await db.MessageLogs.IgnoreQueryFilters()
            .Where(m => !m.IsDeleted
                && (m.Status == MessageStatus.Pending || m.Status == MessageStatus.Retrying)
                && (!m.NextAttemptAt.HasValue || m.NextAttemptAt <= now))
            .OrderBy(m => m.CreatedAt)
            .Take(30)
            .ToListAsync(cancellationToken);

        foreach (var msg in batch)
        {
            msg.Status = MessageStatus.Sending;
            msg.LastAttemptAt = DateTime.UtcNow;
            msg.AttemptCount += 1;
            await db.SaveChangesAsync(cancellationToken);

            var result = await provider.DeliverAsync(msg, cancellationToken);
            msg.ProviderMessageId = result.ProviderMessageId;
            msg.LastProviderStatus = result.ProviderStatus;
            msg.ProviderRawResponse = result.ProviderRawResponse;

            if (result.Success)
            {
                msg.Status = result.Delivered ? MessageStatus.Delivered : MessageStatus.Sent;
                msg.SentAt = DateTime.UtcNow;
                if (result.Delivered)
                    msg.DeliveredAt = DateTime.UtcNow;
                msg.FailureReason = null;
                msg.NextAttemptAt = null;
            }
            else
            {
                var canRetry = !result.IsPermanentFailure && msg.AttemptCount < _options.MaxAttempts;
                if (canRetry)
                {
                    msg.Status = MessageStatus.Retrying;
                    var delaySeconds = (int)Math.Min(300, Math.Pow(2, msg.AttemptCount) * 5);
                    msg.NextAttemptAt = DateTime.UtcNow.AddSeconds(delaySeconds);
                }
                else
                {
                    msg.Status = MessageStatus.Failed;
                    msg.NextAttemptAt = null;
                }

                msg.FailureReason = result.Error;
            }

            await db.SaveChangesAsync(cancellationToken);
        }
    }
}
