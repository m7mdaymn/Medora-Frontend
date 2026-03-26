using EliteClinic.Domain.Enums;

namespace EliteClinic.Application.Features.Clinic.DTOs;

// ─── Message Log DTOs ──────────────────────────────────────────────

public class MessageLogDto
{
    public Guid Id { get; set; }
    public string TemplateName { get; set; } = string.Empty;
    public string? RecipientPhone { get; set; }
    public Guid? RecipientUserId { get; set; }
    public MessageChannel Channel { get; set; }
    public MessageStatus Status { get; set; }
    public int AttemptCount { get; set; }
    public DateTime? NextAttemptAt { get; set; }
    public DateTime? LastAttemptAt { get; set; }
    public DateTime? SentAt { get; set; }
    public DateTime? DeliveredAt { get; set; }
    public string? ProviderMessageId { get; set; }
    public string? LastProviderStatus { get; set; }
    public string? ProviderRawResponse { get; set; }
    public string? RenderedBody { get; set; }
    public string? FailureReason { get; set; }
    public string? Variables { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class SendMessageRequest
{
    public string TemplateName { get; set; } = string.Empty;
    public string? RecipientPhone { get; set; }
    public Guid? RecipientUserId { get; set; }
    public MessageChannel Channel { get; set; }
    public Dictionary<string, string>? Variables { get; set; }
}

public class RetryMessageRequest
{
    public Guid MessageId { get; set; }
}
