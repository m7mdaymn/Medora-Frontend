using EliteClinic.Application.Features.Clinic.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using System.Text.RegularExpressions;

namespace EliteClinic.Api.Services;

public class LocalFileStorageService : IFileStorageService
{
    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/png", "image/jpeg", "image/webp"
    };

    private readonly StorageOptions _options;
    private readonly IWebHostEnvironment _environment;

    public LocalFileStorageService(IOptions<StorageOptions> options, IWebHostEnvironment environment)
    {
        _options = options.Value;
        _environment = environment;
    }

    public bool IsSupportedImage(IFormFile file) => AllowedContentTypes.Contains(file.ContentType);

    public bool IsAllowedSize(long size) => size > 0 && size <= _options.MaxImageSizeBytes;

    public bool IsAllowedSize(long size, long maxSizeBytes) => size > 0 && size <= maxSizeBytes;

    public async Task<(string RelativePath, string PublicUrl, string StoredFileName)> SaveImageAsync(Guid tenantId, string category, IFormFile file, CancellationToken cancellationToken = default)
    {
        return await SaveFileAsync(tenantId, category, file, cancellationToken);
    }

    public async Task<(string RelativePath, string PublicUrl, string StoredFileName)> SaveFileAsync(Guid tenantId, string category, IFormFile file, CancellationToken cancellationToken = default)
    {
        var root = Path.Combine(_environment.ContentRootPath, _options.RootPath);
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        var safeName = Regex.Replace(Path.GetFileNameWithoutExtension(file.FileName), "[^a-zA-Z0-9_-]", string.Empty);
        if (string.IsNullOrWhiteSpace(safeName)) safeName = "file";

        var storedFileName = $"{DateTime.UtcNow:yyyyMMddHHmmssfff}_{safeName}{ext}";
        var relativePath = Path.Combine("tenants", tenantId.ToString(), category, storedFileName).Replace('\\', '/');
        var fullPath = Path.Combine(root, relativePath.Replace('/', Path.DirectorySeparatorChar));

        Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);

        await using var stream = new FileStream(fullPath, FileMode.Create, FileAccess.Write, FileShare.None);
        await file.CopyToAsync(stream, cancellationToken);

        var publicUrl = $"/media/{relativePath}";
        return (relativePath, publicUrl, storedFileName);
    }

    public Task DeleteAsync(string relativePath, CancellationToken cancellationToken = default)
    {
        var root = Path.Combine(_environment.ContentRootPath, _options.RootPath);
        var fullPath = Path.Combine(root, relativePath.Replace('/', Path.DirectorySeparatorChar));
        if (File.Exists(fullPath))
            File.Delete(fullPath);

        return Task.CompletedTask;
    }
}
