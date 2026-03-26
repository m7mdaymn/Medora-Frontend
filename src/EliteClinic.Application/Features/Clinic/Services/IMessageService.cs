using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;
using EliteClinic.Domain.Enums;

namespace EliteClinic.Application.Features.Clinic.Services;

public interface IMessageService
{
    Task<ApiResponse<MessageLogDto>> SendMessageAsync(Guid tenantId, SendMessageRequest request);
    Task<ApiResponse<MessageLogDto>> RetryMessageAsync(Guid tenantId, Guid messageId);
    Task<ApiResponse<PagedResult<MessageLogDto>>> GetAllAsync(Guid tenantId, string? templateName, string? channel, string? status, int pageNumber = 1, int pageSize = 10);
    Task<ApiResponse<MessageLogDto>> GetByIdAsync(Guid tenantId, Guid messageId);
    Task LogScenarioAsync(Guid tenantId, MessageScenario scenario, Guid? recipientUserId = null, string? recipientPhone = null,
        Dictionary<string, string>? variables = null, string language = "ar", MessageChannel? channelOverride = null);
    Task LogWorkflowEventAsync(Guid tenantId, string templateName, Guid? recipientUserId = null, string? recipientPhone = null, Dictionary<string, string>? variables = null);
}
