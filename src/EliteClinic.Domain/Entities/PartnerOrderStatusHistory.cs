using EliteClinic.Domain.Enums;

namespace EliteClinic.Domain.Entities;

public class PartnerOrderStatusHistory : TenantBaseEntity
{
    public Guid PartnerOrderId { get; set; }
    public PartnerOrderStatus? OldStatus { get; set; }
    public PartnerOrderStatus NewStatus { get; set; }
    public Guid ChangedByUserId { get; set; }
    public DateTime ChangedAt { get; set; }
    public string? Notes { get; set; }

    public PartnerOrder PartnerOrder { get; set; } = null!;

    public PartnerOrderStatusHistory()
    {
        ChangedAt = DateTime.UtcNow;
    }
}
