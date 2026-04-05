using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;
using EliteClinic.Domain.Entities;
using EliteClinic.Domain.Enums;
using EliteClinic.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace EliteClinic.Application.Features.Clinic.Services;

public class NotificationService : INotificationService
{
    private readonly EliteClinicDbContext _context;

    public NotificationService(EliteClinicDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<NotificationSubscriptionDto>> SubscribeAsync(Guid tenantId, Guid userId, CreateNotificationSubscriptionRequest request)
    {
        // Check feature flag
        var featureFlags = await _context.TenantFeatureFlags
            .FirstOrDefaultAsync(f => f.TenantId == tenantId && !f.IsDeleted);
        if (featureFlags == null || !featureFlags.PwaNotifications)
            return ApiResponse<NotificationSubscriptionDto>.Error("PWA notifications are not enabled for this clinic");

        if (string.IsNullOrWhiteSpace(request.Endpoint))
            return ApiResponse<NotificationSubscriptionDto>.Error("Endpoint is required");

        // Check for duplicate subscription
        var existing = await _context.NotificationSubscriptions
            .FirstOrDefaultAsync(ns => ns.TenantId == tenantId && ns.UserId == userId && ns.Endpoint == request.Endpoint && !ns.IsDeleted);
        if (existing != null)
        {
            existing.IsActive = true;
            existing.P256dh = request.P256dh;
            existing.Auth = request.Auth;
            await _context.SaveChangesAsync();
            return ApiResponse<NotificationSubscriptionDto>.Ok(MapToDto(existing), "Subscription reactivated");
        }

        var subscription = new NotificationSubscription
        {
            TenantId = tenantId,
            UserId = userId,
            Endpoint = request.Endpoint,
            P256dh = request.P256dh,
            Auth = request.Auth,
            IsActive = true
        };

        _context.NotificationSubscriptions.Add(subscription);
        await _context.SaveChangesAsync();

        return ApiResponse<NotificationSubscriptionDto>.Created(MapToDto(subscription), "Push notification subscription created");
    }

    public async Task<ApiResponse> UnsubscribeAsync(Guid tenantId, Guid subscriptionId, Guid userId)
    {
        var subscription = await _context.NotificationSubscriptions
            .FirstOrDefaultAsync(ns => ns.Id == subscriptionId && ns.TenantId == tenantId && ns.UserId == userId && !ns.IsDeleted);
        if (subscription == null)
            return ApiResponse.Error("Subscription not found");

        subscription.IsActive = false;
        await _context.SaveChangesAsync();

        return ApiResponse.Ok("Unsubscribed successfully");
    }

    public async Task<ApiResponse<List<NotificationSubscriptionDto>>> GetMySubscriptionsAsync(Guid tenantId, Guid userId)
    {
        var subscriptions = await _context.NotificationSubscriptions
            .Where(ns => ns.TenantId == tenantId && ns.UserId == userId && !ns.IsDeleted && ns.IsActive)
            .OrderByDescending(ns => ns.CreatedAt)
            .ToListAsync();

        return ApiResponse<List<NotificationSubscriptionDto>>.Ok(
            subscriptions.Select(MapToDto).ToList(),
            $"Retrieved {subscriptions.Count} subscription(s)");
    }

    public async Task<ApiResponse<MessageLogDto>> SendNotificationAsync(Guid tenantId, SendNotificationRequest request)
    {
        // Check feature flag
        var featureFlags = await _context.TenantFeatureFlags
            .FirstOrDefaultAsync(f => f.TenantId == tenantId && !f.IsDeleted);
        if (featureFlags == null || !featureFlags.PwaNotifications)
            return ApiResponse<MessageLogDto>.Error("PWA notifications are not enabled for this clinic");

        // Check user has active subscriptions
        var hasSubscription = await _context.NotificationSubscriptions
            .AnyAsync(ns => ns.TenantId == tenantId && ns.UserId == request.UserId && ns.IsActive && !ns.IsDeleted);
        if (!hasSubscription)
            return ApiResponse<MessageLogDto>.Error("User has no active push notification subscriptions");

        // Build variables
        var variables = request.Variables ?? new Dictionary<string, string>();
        variables["title"] = request.Title;
        variables["body"] = request.Body;

        // Log as MessageLog (PWA channel)
        var messageLog = new MessageLog
        {
            TenantId = tenantId,
            TemplateName = request.TemplateName ?? "custom_notification",
            RecipientUserId = request.UserId,
            Channel = MessageChannel.PWA,
            Status = MessageStatus.Sent,
            AttemptCount = 1,
            LastAttemptAt = DateTime.UtcNow,
            SentAt = DateTime.UtcNow,
            Variables = JsonSerializer.Serialize(variables)
        };

        _context.MessageLogs.Add(messageLog);

        // Update LastUsedAt on subscriptions
        var subs = await _context.NotificationSubscriptions
            .Where(ns => ns.TenantId == tenantId && ns.UserId == request.UserId && ns.IsActive && !ns.IsDeleted)
            .ToListAsync();
        foreach (var sub in subs)
            sub.LastUsedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return ApiResponse<MessageLogDto>.Created(new MessageLogDto
        {
            Id = messageLog.Id,
            TemplateName = messageLog.TemplateName,
            RecipientUserId = messageLog.RecipientUserId,
            Channel = messageLog.Channel,
            Status = messageLog.Status,
            AttemptCount = messageLog.AttemptCount,
            LastAttemptAt = messageLog.LastAttemptAt,
            SentAt = messageLog.SentAt,
            Variables = messageLog.Variables,
            CreatedAt = messageLog.CreatedAt
        }, "PWA notification sent successfully");
    }

    public async Task<ApiResponse<PagedResult<InAppNotificationDto>>> GetInAppNotificationsAsync(Guid tenantId, Guid userId, InAppNotificationsQuery query)
    {
        var q = _context.InAppNotifications
            .Where(n => n.TenantId == tenantId && !n.IsDeleted && n.UserId == userId)
            .AsQueryable();

        if (query.UnreadOnly)
            q = q.Where(n => !n.IsRead);

        var pageNumber = query.PageNumber <= 0 ? 1 : query.PageNumber;
        var pageSize = query.PageSize <= 0 ? 20 : Math.Min(query.PageSize, 200);

        var total = await q.CountAsync();
        var rows = await q
            .OrderByDescending(n => n.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return ApiResponse<PagedResult<InAppNotificationDto>>.Ok(new PagedResult<InAppNotificationDto>
        {
            Items = rows.Select(MapInApp).ToList(),
            TotalCount = total,
            PageNumber = pageNumber,
            PageSize = pageSize
        }, $"Retrieved {rows.Count} in-app notification(s)");
    }

    public async Task<ApiResponse<InAppNotificationDto>> MarkInAppReadAsync(Guid tenantId, Guid userId, Guid notificationId)
    {
        var entity = await _context.InAppNotifications
            .FirstOrDefaultAsync(n => n.TenantId == tenantId && !n.IsDeleted && n.UserId == userId && n.Id == notificationId);

        if (entity == null)
            return ApiResponse<InAppNotificationDto>.Error("In-app notification not found");

        if (!entity.IsRead)
        {
            entity.IsRead = true;
            entity.ReadAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        return ApiResponse<InAppNotificationDto>.Ok(MapInApp(entity), "In-app notification marked as read");
    }

    public async Task<ApiResponse<int>> MarkAllInAppReadAsync(Guid tenantId, Guid userId)
    {
        var unread = await _context.InAppNotifications
            .Where(n => n.TenantId == tenantId && !n.IsDeleted && n.UserId == userId && !n.IsRead)
            .ToListAsync();

        if (!unread.Any())
            return ApiResponse<int>.Ok(0, "No unread notifications");

        var now = DateTime.UtcNow;
        foreach (var item in unread)
        {
            item.IsRead = true;
            item.ReadAt = now;
        }

        await _context.SaveChangesAsync();
        return ApiResponse<int>.Ok(unread.Count, $"Marked {unread.Count} notification(s) as read");
    }

    private static NotificationSubscriptionDto MapToDto(NotificationSubscription ns) => new()
    {
        Id = ns.Id,
        UserId = ns.UserId,
        Endpoint = ns.Endpoint,
        IsActive = ns.IsActive,
        LastUsedAt = ns.LastUsedAt,
        CreatedAt = ns.CreatedAt
    };

    private static InAppNotificationDto MapInApp(InAppNotification notification) => new()
    {
        Id = notification.Id,
        Type = notification.Type,
        Title = notification.Title,
        Body = notification.Body,
        EntityType = notification.EntityType,
        EntityId = notification.EntityId,
        IsRead = notification.IsRead,
        ReadAt = notification.ReadAt,
        CreatedAt = notification.CreatedAt
    };
}
