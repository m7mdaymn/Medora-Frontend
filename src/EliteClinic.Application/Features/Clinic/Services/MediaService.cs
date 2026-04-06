using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;
using EliteClinic.Domain.Entities;
using EliteClinic.Infrastructure.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace EliteClinic.Application.Features.Clinic.Services;

public class MediaService : IMediaService
{
    private readonly EliteClinicDbContext _context;
    private readonly IFileStorageService _fileStorage;

    public MediaService(EliteClinicDbContext context, IFileStorageService fileStorage)
    {
        _context = context;
        _fileStorage = fileStorage;
    }

    public async Task<ApiResponse<MediaFileDto>> UploadClinicLogoAsync(Guid tenantId, IFormFile file, CancellationToken cancellationToken = default)
    {
        var settings = await _context.ClinicSettings.FirstOrDefaultAsync(cancellationToken);
        if (settings == null)
            return ApiResponse<MediaFileDto>.Error("Clinic settings not found");

        var validationError = Validate(file);
        if (validationError != null)
            return ApiResponse<MediaFileDto>.Error(validationError);

        var saved = await _fileStorage.SaveImageAsync(tenantId, "clinic-logo", file, cancellationToken);
        settings.LogoUrl = saved.PublicUrl;

        await ReplaceExistingActiveMediaAsync(tenantId, "ClinicLogo", "ClinicSettings", settings.Id, cancellationToken);

        var media = new MediaFile
        {
            TenantId = tenantId,
            Category = "ClinicLogo",
            EntityType = "ClinicSettings",
            EntityId = settings.Id,
            OriginalFileName = Path.GetFileName(file.FileName),
            StoredFileName = saved.StoredFileName,
            RelativePath = saved.RelativePath,
            PublicUrl = saved.PublicUrl,
            ContentType = file.ContentType,
            FileSizeBytes = file.Length,
            IsActive = true
        };

        _context.MediaFiles.Add(media);
        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<MediaFileDto>.Created(Map(media), "Clinic logo uploaded successfully");
    }

    public async Task<ApiResponse<MediaFileDto>> UploadClinicImageAsync(Guid tenantId, IFormFile file, CancellationToken cancellationToken = default)
    {
        var settings = await _context.ClinicSettings.FirstOrDefaultAsync(cancellationToken);
        if (settings == null)
            return ApiResponse<MediaFileDto>.Error("Clinic settings not found");

        var validationError = Validate(file);
        if (validationError != null)
            return ApiResponse<MediaFileDto>.Error(validationError);

        var saved = await _fileStorage.SaveImageAsync(tenantId, "clinic-image", file, cancellationToken);
        settings.ImgUrl = saved.PublicUrl;

        await ReplaceExistingActiveMediaAsync(tenantId, "ClinicImage", "ClinicSettings", settings.Id, cancellationToken);

        var media = new MediaFile
        {
            TenantId = tenantId,
            Category = "ClinicImage",
            EntityType = "ClinicSettings",
            EntityId = settings.Id,
            OriginalFileName = Path.GetFileName(file.FileName),
            StoredFileName = saved.StoredFileName,
            RelativePath = saved.RelativePath,
            PublicUrl = saved.PublicUrl,
            ContentType = file.ContentType,
            FileSizeBytes = file.Length,
            IsActive = true
        };

        _context.MediaFiles.Add(media);
        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<MediaFileDto>.Created(Map(media), "Clinic image uploaded successfully");
    }

    public async Task<ApiResponse<MediaFileDto>> UploadClinicGalleryImageAsync(Guid tenantId, IFormFile file, CancellationToken cancellationToken = default)
    {
        var settings = await _context.ClinicSettings.FirstOrDefaultAsync(cancellationToken);
        if (settings == null)
            return ApiResponse<MediaFileDto>.Error("Clinic settings not found");

        var validationError = Validate(file);
        if (validationError != null)
            return ApiResponse<MediaFileDto>.Error(validationError);

        var saved = await _fileStorage.SaveImageAsync(tenantId, "clinic-gallery", file, cancellationToken);

        var media = new MediaFile
        {
            TenantId = tenantId,
            Category = "ClinicGallery",
            EntityType = "ClinicSettings",
            EntityId = settings.Id,
            OriginalFileName = Path.GetFileName(file.FileName),
            StoredFileName = saved.StoredFileName,
            RelativePath = saved.RelativePath,
            PublicUrl = saved.PublicUrl,
            ContentType = file.ContentType,
            FileSizeBytes = file.Length,
            IsActive = true
        };

        _context.MediaFiles.Add(media);

        if (string.IsNullOrWhiteSpace(settings.ImgUrl))
            settings.ImgUrl = saved.PublicUrl;

        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<MediaFileDto>.Created(Map(media), "Clinic gallery image uploaded successfully");
    }

    public async Task<ApiResponse<List<MediaFileDto>>> GetClinicGalleryAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var settings = await _context.ClinicSettings.FirstOrDefaultAsync(cancellationToken);
        if (settings == null)
            return ApiResponse<List<MediaFileDto>>.Error("Clinic settings not found");

        var files = await _context.MediaFiles
            .Where(m => m.TenantId == tenantId
                && !m.IsDeleted
                && m.IsActive
                && m.Category == "ClinicGallery"
                && m.EntityType == "ClinicSettings"
                && m.EntityId == settings.Id)
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync(cancellationToken);

        return ApiResponse<List<MediaFileDto>>.Ok(files.Select(Map).ToList(), "Clinic gallery retrieved successfully");
    }

    public async Task<ApiResponse> DeleteClinicGalleryImageAsync(Guid tenantId, Guid mediaId, CancellationToken cancellationToken = default)
    {
        var settings = await _context.ClinicSettings.FirstOrDefaultAsync(cancellationToken);
        if (settings == null)
            return ApiResponse.Error("Clinic settings not found");

        var media = await _context.MediaFiles
            .FirstOrDefaultAsync(m => m.TenantId == tenantId
                && !m.IsDeleted
                && m.Category == "ClinicGallery"
                && m.EntityType == "ClinicSettings"
                && m.Id == mediaId,
                cancellationToken);

        if (media == null)
            return ApiResponse.Error("Gallery image not found");

        media.IsDeleted = true;
        media.DeletedAt = DateTime.UtcNow;
        media.IsActive = false;

        await _fileStorage.DeleteAsync(media.RelativePath, cancellationToken);

        if (!string.IsNullOrWhiteSpace(settings.ImgUrl) && string.Equals(settings.ImgUrl, media.PublicUrl, StringComparison.OrdinalIgnoreCase))
        {
            var replacement = await _context.MediaFiles
                .Where(m => m.TenantId == tenantId
                    && !m.IsDeleted
                    && m.IsActive
                    && m.Id != mediaId
                    && m.Category == "ClinicGallery"
                    && m.EntityType == "ClinicSettings"
                    && m.EntityId == settings.Id)
                .OrderByDescending(m => m.CreatedAt)
                .Select(m => m.PublicUrl)
                .FirstOrDefaultAsync(cancellationToken);

            settings.ImgUrl = replacement;
        }

        await _context.SaveChangesAsync(cancellationToken);
        return ApiResponse.Ok("Gallery image deleted successfully");
    }

    public async Task<ApiResponse<MediaFileDto>> UploadDoctorPhotoAsync(Guid tenantId, Guid doctorId, IFormFile file, CancellationToken cancellationToken = default)
    {
        var doctor = await _context.Doctors.FirstOrDefaultAsync(d => d.Id == doctorId, cancellationToken);
        if (doctor == null)
            return ApiResponse<MediaFileDto>.Error("Doctor not found");

        var validationError = Validate(file);
        if (validationError != null)
            return ApiResponse<MediaFileDto>.Error(validationError);

        var saved = await _fileStorage.SaveImageAsync(tenantId, "doctor-photo", file, cancellationToken);
        doctor.PhotoUrl = saved.PublicUrl;

        await ReplaceExistingActiveMediaAsync(tenantId, "DoctorPhoto", "Doctor", doctor.Id, cancellationToken);

        var media = new MediaFile
        {
            TenantId = tenantId,
            Category = "DoctorPhoto",
            EntityType = "Doctor",
            EntityId = doctor.Id,
            OriginalFileName = Path.GetFileName(file.FileName),
            StoredFileName = saved.StoredFileName,
            RelativePath = saved.RelativePath,
            PublicUrl = saved.PublicUrl,
            ContentType = file.ContentType,
            FileSizeBytes = file.Length,
            IsActive = true
        };

        _context.MediaFiles.Add(media);
        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<MediaFileDto>.Created(Map(media), "Doctor photo uploaded successfully");
    }

    private async Task ReplaceExistingActiveMediaAsync(Guid tenantId, string category, string entityType, Guid entityId, CancellationToken cancellationToken)
    {
        var existing = await _context.MediaFiles
            .Where(m => m.TenantId == tenantId && !m.IsDeleted && m.IsActive
                && m.Category == category && m.EntityType == entityType && m.EntityId == entityId)
            .ToListAsync(cancellationToken);

        foreach (var item in existing)
        {
            item.IsActive = false;
            await _fileStorage.DeleteAsync(item.RelativePath, cancellationToken);
        }
    }

    private string? Validate(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return "File is required";

        if (!_fileStorage.IsSupportedImage(file))
            return "Unsupported file type. Allowed types: png, jpeg, webp";

        if (!_fileStorage.IsAllowedSize(file.Length))
            return "File size exceeds allowed limit";

        return null;
    }

    private static MediaFileDto Map(MediaFile media) => new()
    {
        Id = media.Id,
        Category = media.Category,
        PublicUrl = media.PublicUrl,
        ContentType = media.ContentType,
        FileSizeBytes = media.FileSizeBytes,
        OriginalFileName = media.OriginalFileName,
        CreatedAt = media.CreatedAt
    };
}
