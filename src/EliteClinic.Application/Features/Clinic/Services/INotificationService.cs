using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;

namespace EliteClinic.Application.Features.Clinic.Services;

public interface INotificationService
{
    Task<ApiResponse<NotificationSubscriptionDto>> SubscribeAsync(Guid tenantId, Guid userId, CreateNotificationSubscriptionRequest request);
    Task<ApiResponse> UnsubscribeAsync(Guid tenantId, Guid subscriptionId, Guid userId);
    Task<ApiResponse<List<NotificationSubscriptionDto>>> GetMySubscriptionsAsync(Guid tenantId, Guid userId);
    Task<ApiResponse<MessageLogDto>> SendNotificationAsync(Guid tenantId, SendNotificationRequest request);
    Task<ApiResponse<PagedResult<InAppNotificationDto>>> GetInAppNotificationsAsync(Guid tenantId, Guid userId, InAppNotificationsQuery query);
    Task<ApiResponse<InAppNotificationDto>> MarkInAppReadAsync(Guid tenantId, Guid userId, Guid notificationId);
    Task<ApiResponse<int>> MarkAllInAppReadAsync(Guid tenantId, Guid userId);
}
