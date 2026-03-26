namespace EliteClinic.Application.Features.Clinic.DTOs;

public class MediaFileDto
{
    public Guid Id { get; set; }
    public string Category { get; set; } = string.Empty;
    public string PublicUrl { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public string OriginalFileName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
