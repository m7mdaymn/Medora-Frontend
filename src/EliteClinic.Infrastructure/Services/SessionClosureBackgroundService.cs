using EliteClinic.Domain.Enums;
using EliteClinic.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace EliteClinic.Infrastructure.Services;

/// <summary>
/// Background hosted service that closes all active queue sessions at the end of each day.
/// Runs every 30 minutes, checks if any sessions from previous days are still open, and closes them.
/// Remaining Waiting/Called tickets are marked as NoShow.
/// Multi-tenant safe: processes all tenants but each session is tenant-scoped.
/// </summary>
public class SessionClosureBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<SessionClosureBackgroundService> _logger;
    private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(30);

    public SessionClosureBackgroundService(
        IServiceScopeFactory scopeFactory,
        ILogger<SessionClosureBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("SessionClosureBackgroundService started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CloseExpiredSessionsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in SessionClosureBackgroundService");
            }

            await Task.Delay(_checkInterval, stoppingToken);
        }

        _logger.LogInformation("SessionClosureBackgroundService stopped.");
    }

    public async Task CloseExpiredSessionsAsync(CancellationToken cancellationToken = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<EliteClinicDbContext>();

        var today = DateTime.UtcNow.Date;

        // Find all active sessions that started before today (i.e., from previous days)
        // We use IgnoreQueryFilters to bypass tenant filter since we process all tenants
        var expiredSessions = await dbContext.QueueSessions
            .IgnoreQueryFilters()
            .Include(s => s.Tickets.Where(t => !t.IsDeleted))
            .Where(s => !s.IsDeleted && s.IsActive && s.StartedAt.Date < today)
            .ToListAsync(cancellationToken);

        if (!expiredSessions.Any())
            return;

        _logger.LogInformation("Closing {Count} expired queue sessions", expiredSessions.Count);

        foreach (var session in expiredSessions)
        {
            // Mark remaining Waiting/Called tickets as NoShow
            foreach (var ticket in session.Tickets.Where(t =>
                t.Status == TicketStatus.Waiting || t.Status == TicketStatus.Called))
            {
                ticket.Status = TicketStatus.NoShow;
                ticket.UpdatedAt = DateTime.UtcNow;
            }

            session.IsActive = false;
            session.ClosedAt = DateTime.UtcNow;
            session.UpdatedAt = DateTime.UtcNow;

            _logger.LogInformation(
                "Auto-closed session {SessionId} for tenant {TenantId} (started {StartedAt})",
                session.Id, session.TenantId, session.StartedAt);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Successfully closed {Count} expired sessions", expiredSessions.Count);
    }
}
