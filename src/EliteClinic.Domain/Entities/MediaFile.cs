namespace EliteClinic.Domain.Entities;

public class MediaFile : TenantBaseEntity
{
    public string Category { get; set; } = string.Empty;
    public Guid? EntityId { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public string StoredFileName { get; set; } = string.Empty;
    public string RelativePath { get; set; } = string.Empty;
    public string PublicUrl { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public bool IsActive { get; set; }

    public MediaFile()
    {
        IsActive = true;
    }
}
