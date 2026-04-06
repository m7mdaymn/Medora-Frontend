using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;
using Microsoft.AspNetCore.Http;

namespace EliteClinic.Application.Features.Clinic.Services;

public interface IMediaService
{
    Task<ApiResponse<MediaFileDto>> UploadClinicLogoAsync(Guid tenantId, IFormFile file, CancellationToken cancellationToken = default);
    Task<ApiResponse<MediaFileDto>> UploadClinicImageAsync(Guid tenantId, IFormFile file, CancellationToken cancellationToken = default);
    Task<ApiResponse<MediaFileDto>> UploadClinicGalleryImageAsync(Guid tenantId, IFormFile file, CancellationToken cancellationToken = default);
    Task<ApiResponse<List<MediaFileDto>>> GetClinicGalleryAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<ApiResponse> DeleteClinicGalleryImageAsync(Guid tenantId, Guid mediaId, CancellationToken cancellationToken = default);
    Task<ApiResponse<MediaFileDto>> UploadDoctorPhotoAsync(Guid tenantId, Guid doctorId, IFormFile file, CancellationToken cancellationToken = default);
}
