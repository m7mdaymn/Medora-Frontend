using EliteClinic.Domain.Enums;

namespace EliteClinic.Domain.Entities;

public class PatientMedicalDocument : TenantBaseEntity
{
    public Guid PatientId { get; set; }
    public Guid UploadedByUserId { get; set; }
    public DocumentCategory Category { get; set; }
    public string OriginalFileName { get; set; } = string.Empty;
    public string StoredFileName { get; set; } = string.Empty;
    public string RelativePath { get; set; } = string.Empty;
    public string PublicUrl { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public string? Notes { get; set; }

    public Patient Patient { get; set; } = null!;
}
