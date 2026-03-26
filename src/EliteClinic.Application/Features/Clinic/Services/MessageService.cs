using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;
using EliteClinic.Domain.Entities;
using EliteClinic.Domain.Enums;
using EliteClinic.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace EliteClinic.Application.Features.Clinic.Services;

public class MessageService : IMessageService
{
    private readonly EliteClinicDbContext _context;
    private readonly IMessageTemplateRenderer _renderer;

    private static readonly Dictionary<string, MessageScenario> ScenarioAliases = new(StringComparer.OrdinalIgnoreCase)
    {
        [nameof(MessageScenario.PatientAccountCreated)] = MessageScenario.PatientAccountCreated,
        [nameof(MessageScenario.QueueTicketIssued)] = MessageScenario.QueueTicketIssued,
        [nameof(MessageScenario.QueueTurnReady)] = MessageScenario.QueueTurnReady,
        [nameof(MessageScenario.MedicationReminder)] = MessageScenario.MedicationReminder,
        [nameof(MessageScenario.CreditIssued)] = MessageScenario.CreditIssued,
        [nameof(MessageScenario.BookingConfirmed)] = MessageScenario.BookingConfirmed,
        [nameof(MessageScenario.BookingCancelled)] = MessageScenario.BookingCancelled,
        ["patient_account_created"] = MessageScenario.PatientAccountCreated,
        ["queue_ticket_issued"] = MessageScenario.QueueTicketIssued,
        ["turn_ready"] = MessageScenario.QueueTurnReady,
        ["medication_reminder"] = MessageScenario.MedicationReminder,
        ["credit_entitlement_issued"] = MessageScenario.CreditIssued,
        ["booking_confirmation"] = MessageScenario.BookingConfirmed,
        ["booking_cancelled"] = MessageScenario.BookingCancelled,
    };

    public MessageService(EliteClinicDbContext context, IMessageTemplateRenderer renderer)
    {
        _context = context;
        _renderer = renderer;
    }

    public async Task<ApiResponse<MessageLogDto>> SendMessageAsync(Guid tenantId, SendMessageRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.TemplateName))
            return ApiResponse<MessageLogDto>.Error("Template name is required");

        if (!TryResolveScenario(request.TemplateName, out var scenario))
            return ApiResponse<MessageLogDto>.Error($"Invalid template/scenario name: {request.TemplateName}");

        if (request.Channel == MessageChannel.WhatsApp && string.IsNullOrWhiteSpace(request.RecipientPhone))
            return ApiResponse<MessageLogDto>.Error("Recipient phone is required for WhatsApp messages");

        if (request.Channel == MessageChannel.PWA && !request.RecipientUserId.HasValue)
            return ApiResponse<MessageLogDto>.Error("Recipient user ID is required for PWA notifications");

        var mergedVariables = await BuildVariablesAsync(tenantId, request.Variables);
        var renderResult = await _renderer.RenderAsync(tenantId, scenario, request.Channel, "ar", mergedVariables);
        if (!renderResult.Success)
            return ApiResponse<MessageLogDto>.Error(renderResult.Error ?? "Failed to render template");

        var messageLog = new MessageLog
        {
            TenantId = tenantId,
            TemplateName = scenario.ToString(),
            RenderedBody = renderResult.RenderedBody,
            RecipientPhone = request.RecipientPhone,
            RecipientUserId = request.RecipientUserId,
            Channel = request.Channel,
            Status = MessageStatus.Pending,
            AttemptCount = 0,
            NextAttemptAt = DateTime.UtcNow,
            Variables = JsonSerializer.Serialize(mergedVariables)
        };

        _context.MessageLogs.Add(messageLog);
        await _context.SaveChangesAsync();

        return ApiResponse<MessageLogDto>.Created(MapToDto(messageLog), "Message queued successfully");
    }

    public async Task<ApiResponse<MessageLogDto>> RetryMessageAsync(Guid tenantId, Guid messageId)
    {
        var message = await _context.MessageLogs
            .FirstOrDefaultAsync(m => m.Id == messageId && m.TenantId == tenantId && !m.IsDeleted);

        if (message == null)
            return ApiResponse<MessageLogDto>.Error("Message not found");

        if (message.Status != MessageStatus.Failed && message.Status != MessageStatus.Retrying)
            return ApiResponse<MessageLogDto>.Error("Only failed or retrying messages can be retried");

        if (message.AttemptCount >= 3)
            return ApiResponse<MessageLogDto>.Error("Maximum retry attempts (3) reached");

        message.Status = MessageStatus.Pending;
        message.NextAttemptAt = DateTime.UtcNow;
        message.FailureReason = null;
        await _context.SaveChangesAsync();

        return ApiResponse<MessageLogDto>.Ok(MapToDto(message), "Message re-queued successfully");
    }

    public async Task<ApiResponse<PagedResult<MessageLogDto>>> GetAllAsync(Guid tenantId, string? templateName,
        string? channel, string? status, int pageNumber = 1, int pageSize = 10)
    {
        var query = _context.MessageLogs
            .Where(m => m.TenantId == tenantId && !m.IsDeleted);

        if (!string.IsNullOrEmpty(templateName))
            query = query.Where(m => m.TemplateName == templateName);

        if (!string.IsNullOrEmpty(channel) && Enum.TryParse<MessageChannel>(channel, true, out var channelEnum))
            query = query.Where(m => m.Channel == channelEnum);

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<MessageStatus>(status, true, out var statusEnum))
            query = query.Where(m => m.Status == statusEnum);

        var totalCount = await query.CountAsync();
        var messages = await query
            .OrderByDescending(m => m.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var result = new PagedResult<MessageLogDto>
        {
            Items = messages.Select(MapToDto).ToList(),
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };

        return ApiResponse<PagedResult<MessageLogDto>>.Ok(result, $"Retrieved {result.Items.Count} message(s)");
    }

    public async Task<ApiResponse<MessageLogDto>> GetByIdAsync(Guid tenantId, Guid messageId)
    {
        var message = await _context.MessageLogs
            .FirstOrDefaultAsync(m => m.Id == messageId && m.TenantId == tenantId && !m.IsDeleted);

        if (message == null)
            return ApiResponse<MessageLogDto>.Error("Message not found");

        return ApiResponse<MessageLogDto>.Ok(MapToDto(message));
    }

    public async Task LogWorkflowEventAsync(Guid tenantId, string templateName, Guid? recipientUserId = null, string? recipientPhone = null,
        Dictionary<string, string>? variables = null)
    {
        if (TryResolveScenario(templateName, out var scenario))
        {
            await LogScenarioAsync(tenantId, scenario, recipientUserId, recipientPhone, variables);
            return;
        }

        // Keep compatibility for non-scenario internal events.
        var fallbackChannel = !string.IsNullOrWhiteSpace(recipientPhone)
            ? MessageChannel.WhatsApp
            : MessageChannel.PWA;
        var mergedVariables = await BuildVariablesAsync(tenantId, variables);
        var messageLog = new MessageLog
        {
            TenantId = tenantId,
            TemplateName = string.IsNullOrWhiteSpace(templateName) ? "workflow_event" : templateName.Trim(),
            RenderedBody = null,
            RecipientPhone = recipientPhone,
            RecipientUserId = recipientUserId,
            Channel = fallbackChannel,
            Status = MessageStatus.Pending,
            AttemptCount = 0,
            NextAttemptAt = DateTime.UtcNow,
            Variables = JsonSerializer.Serialize(mergedVariables)
        };

        _context.MessageLogs.Add(messageLog);
        await _context.SaveChangesAsync();
    }

    public async Task LogScenarioAsync(Guid tenantId, MessageScenario scenario, Guid? recipientUserId = null, string? recipientPhone = null,
        Dictionary<string, string>? variables = null, string language = "ar", MessageChannel? channelOverride = null)
    {
        var channel = channelOverride
            ?? (!string.IsNullOrWhiteSpace(recipientPhone) ? MessageChannel.WhatsApp : MessageChannel.PWA);

        var mergedVariables = await BuildVariablesAsync(tenantId, variables);
        var renderResult = await _renderer.RenderAsync(tenantId, scenario, channel, language, mergedVariables);
        if (!renderResult.Success)
            throw new InvalidOperationException(renderResult.Error ?? "Failed to render scenario message");

        var messageLog = new MessageLog
        {
            TenantId = tenantId,
            TemplateName = scenario.ToString(),
            RenderedBody = renderResult.RenderedBody,
            RecipientPhone = recipientPhone,
            RecipientUserId = recipientUserId,
            Channel = channel,
            Status = MessageStatus.Pending,
            AttemptCount = 0,
            NextAttemptAt = DateTime.UtcNow,
            Variables = JsonSerializer.Serialize(mergedVariables)
        };

        _context.MessageLogs.Add(messageLog);
        await _context.SaveChangesAsync();
    }

    private static MessageLogDto MapToDto(MessageLog m) => new()
    {
        Id = m.Id,
        TemplateName = m.TemplateName,
        RecipientPhone = m.RecipientPhone,
        RecipientUserId = m.RecipientUserId,
        Channel = m.Channel,
        Status = m.Status,
        AttemptCount = m.AttemptCount,
        LastAttemptAt = m.LastAttemptAt,
        SentAt = m.SentAt,
        DeliveredAt = m.DeliveredAt,
        NextAttemptAt = m.NextAttemptAt,
        ProviderMessageId = m.ProviderMessageId,
        LastProviderStatus = m.LastProviderStatus,
        ProviderRawResponse = m.ProviderRawResponse,
        RenderedBody = m.RenderedBody,
        FailureReason = m.FailureReason,
        Variables = m.Variables,
        CreatedAt = m.CreatedAt
    };

    private static bool TryResolveScenario(string templateName, out MessageScenario scenario)
    {
        if (ScenarioAliases.TryGetValue(templateName, out scenario))
            return true;

        return Enum.TryParse(templateName, ignoreCase: true, out scenario);
    }

    private async Task<Dictionary<string, string>> BuildVariablesAsync(Guid tenantId, Dictionary<string, string>? variables)
    {
        var merged = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        if (variables != null)
        {
            foreach (var kv in variables)
                merged[kv.Key] = kv.Value;
        }

        var tenant = await _context.Tenants.IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => t.Id == tenantId && !t.IsDeleted);
        var settings = await _context.ClinicSettings.IgnoreQueryFilters()
            .FirstOrDefaultAsync(s => s.TenantId == tenantId && !s.IsDeleted);

        merged.TryAdd("clinicName", settings?.ClinicName ?? tenant?.Name ?? "العيادة");
        merged.TryAdd("clinicPhone", settings?.Phone ?? tenant?.ContactPhone ?? string.Empty);
        merged.TryAdd("clinicAddress", settings?.Address ?? tenant?.Address ?? string.Empty);
        merged.TryAdd("bookingLink", "/booking");
        merged.TryAdd("accountLink", "/account");

        return merged;
    }
}
