using EliteClinic.Domain.Enums;

namespace EliteClinic.Domain.Entities;

public class InAppNotification : TenantBaseEntity
{
    public Guid UserId { get; set; }
    public InAppNotificationType Type { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string? EntityType { get; set; }
    public Guid? EntityId { get; set; }
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
    public string? MetadataJson { get; set; }

    public ApplicationUser User { get; set; } = null!;

    public InAppNotification()
    {
        IsRead = false;
    }
}
