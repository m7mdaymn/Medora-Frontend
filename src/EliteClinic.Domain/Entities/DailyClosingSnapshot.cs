namespace EliteClinic.Domain.Entities;

public class DailyClosingSnapshot : TenantBaseEntity
{
    public DateTime SnapshotDate { get; set; }
    public Guid GeneratedByUserId { get; set; }
    public string MetricsJson { get; set; } = "{}";
}
