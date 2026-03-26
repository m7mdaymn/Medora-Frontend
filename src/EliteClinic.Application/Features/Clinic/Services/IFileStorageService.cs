using Microsoft.AspNetCore.Http;

namespace EliteClinic.Application.Features.Clinic.Services;

public interface IFileStorageService
{
    Task<(string RelativePath, string PublicUrl, string StoredFileName)> SaveImageAsync(Guid tenantId, string category, IFormFile file, CancellationToken cancellationToken = default);
    Task<(string RelativePath, string PublicUrl, string StoredFileName)> SaveFileAsync(Guid tenantId, string category, IFormFile file, CancellationToken cancellationToken = default);
    Task DeleteAsync(string relativePath, CancellationToken cancellationToken = default);
    bool IsSupportedImage(IFormFile file);
    bool IsAllowedSize(long size);
    bool IsAllowedSize(long size, long maxSizeBytes);
}
