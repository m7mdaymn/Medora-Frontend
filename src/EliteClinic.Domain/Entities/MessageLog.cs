using EliteClinic.Domain.Enums;

namespace EliteClinic.Domain.Entities;

/// <summary>
/// Logs every WhatsApp and PWA message sent through the system.
/// Tracks delivery status, retry attempts, and failure reasons.
/// </summary>
public class MessageLog : TenantBaseEntity
{
    public string TemplateName { get; set; } = string.Empty;
    public string? RenderedBody { get; set; }
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
    public string? FailureReason { get; set; }
    public string? Variables { get; set; } // JSON snapshot of template variables

    public MessageLog()
    {
        Status = MessageStatus.Pending;
        AttemptCount = 0;
    }
}
