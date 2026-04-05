using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;
using EliteClinic.Application.Features.Clinic.Services;
using EliteClinic.Domain.Enums;

namespace EliteClinic.Tests;

internal sealed class FakeMessageService : IMessageService
{
    public Task<ApiResponse<MessageLogDto>> SendMessageAsync(Guid tenantId, SendMessageRequest request)
    {
        _ = tenantId;
        var dto = new MessageLogDto
        {
            Id = Guid.NewGuid(),
            TemplateName = request.TemplateName,
            RecipientPhone = request.RecipientPhone,
            RecipientUserId = request.RecipientUserId,
            Channel = request.Channel,
            Status = MessageStatus.Pending,
            AttemptCount = 0,
            CreatedAt = DateTime.UtcNow
        };

        return Task.FromResult(ApiResponse<MessageLogDto>.Created(dto, "Message queued (fake)"));
    }

    public Task<ApiResponse<MessageLogDto>> RetryMessageAsync(Guid tenantId, Guid messageId)
    {
        _ = tenantId;
        var dto = new MessageLogDto
        {
            Id = messageId,
            TemplateName = "retry",
            Channel = MessageChannel.WhatsApp,
            Status = MessageStatus.Pending,
            AttemptCount = 1,
            CreatedAt = DateTime.UtcNow
        };

        return Task.FromResult(ApiResponse<MessageLogDto>.Ok(dto, "Message retry queued (fake)"));
    }

    public Task<ApiResponse<PagedResult<MessageLogDto>>> GetAllAsync(
        Guid tenantId,
        string? templateName,
        string? channel,
        string? status,
        int pageNumber = 1,
        int pageSize = 10)
    {
        _ = tenantId;
        _ = templateName;
        _ = channel;
        _ = status;

        var result = new PagedResult<MessageLogDto>
        {
            Items = new List<MessageLogDto>(),
            TotalCount = 0,
            PageNumber = pageNumber,
            PageSize = pageSize
        };

        return Task.FromResult(ApiResponse<PagedResult<MessageLogDto>>.Ok(result, "No messages (fake)"));
    }

    public Task<ApiResponse<MessageLogDto>> GetByIdAsync(Guid tenantId, Guid messageId)
    {
        _ = tenantId;
        var dto = new MessageLogDto
        {
            Id = messageId,
            TemplateName = "fake",
            Channel = MessageChannel.WhatsApp,
            Status = MessageStatus.Pending,
            AttemptCount = 0,
            CreatedAt = DateTime.UtcNow
        };

        return Task.FromResult(ApiResponse<MessageLogDto>.Ok(dto, "Message fetched (fake)"));
    }

    public Task LogScenarioAsync(
        Guid tenantId,
        MessageScenario scenario,
        Guid? recipientUserId = null,
        string? recipientPhone = null,
        Dictionary<string, string>? variables = null,
        string language = "ar",
        MessageChannel? channelOverride = null)
    {
        _ = tenantId;
        _ = scenario;
        _ = recipientUserId;
        _ = recipientPhone;
        _ = variables;
        _ = language;
        _ = channelOverride;
        return Task.CompletedTask;
    }

    public Task LogWorkflowEventAsync(
        Guid tenantId,
        string templateName,
        Guid? recipientUserId = null,
        string? recipientPhone = null,
        Dictionary<string, string>? variables = null)
    {
        _ = tenantId;
        _ = templateName;
        _ = recipientUserId;
        _ = recipientPhone;
        _ = variables;
        return Task.CompletedTask;
    }
}