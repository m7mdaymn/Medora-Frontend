namespace EliteClinic.Api.Services;

public class StorageOptions
{
    public string RootPath { get; set; } = "media";
    public long MaxImageSizeBytes { get; set; } = 5 * 1024 * 1024;
    public long MaxDocumentSizeBytes { get; set; } = 10 * 1024 * 1024;
}
