using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;

namespace EliteClinic.Application.Features.Clinic.Services;

public interface IClinicSettingsService
{
    Task<ApiResponse<ClinicSettingsDto>> GetSettingsAsync(Guid tenantId);
    Task<ApiResponse<ClinicSettingsDto>> UpdateSettingsAsync(Guid tenantId, UpdateClinicSettingsRequest request);
    Task<ApiResponse<ClinicSettingsDto>> PatchSettingsAsync(Guid tenantId, PatchClinicSettingsRequest request);
    Task<ApiResponse<ClinicPaymentOptionsDto>> GetPaymentOptionsAsync(Guid tenantId, bool activeOnly = false);
    Task<ApiResponse<List<ClinicPaymentMethodDto>>> ReplacePaymentMethodsAsync(Guid tenantId, UpdateClinicPaymentMethodsRequest request);
}
