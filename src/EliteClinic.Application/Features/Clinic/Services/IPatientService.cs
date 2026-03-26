using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;

namespace EliteClinic.Application.Features.Clinic.Services;

public interface IPatientService
{
    Task<ApiResponse<CreatePatientResponse>> CreatePatientAsync(Guid tenantId, CreatePatientRequest request);
    Task<ApiResponse<PagedResult<PatientDto>>> GetAllPatientsAsync(Guid tenantId, int pageNumber = 1, int pageSize = 10, string? search = null);
    Task<ApiResponse<PatientDto>> GetPatientByIdAsync(Guid tenantId, Guid id);
    Task<ApiResponse<PatientDto>> UpdatePatientAsync(Guid tenantId, Guid id, UpdatePatientRequest request);
    Task<ApiResponse<PatientDto>> PatchPatientAsync(Guid tenantId, Guid id, PatchPatientRequest request);
    Task<ApiResponse<PatientDto>> AddSubProfileAsync(Guid tenantId, Guid parentId, AddSubProfileRequest request);
    Task<ApiResponse<ResetPasswordResponse>> ResetPasswordAsync(Guid tenantId, Guid id);
    Task<ApiResponse<SendPatientCredentialsResponse>> SendCredentialsAsync(Guid tenantId, Guid id, SendPatientCredentialsRequest request);
    Task<ApiResponse<PatientDto>> GetOwnedProfileAsync(Guid tenantId, Guid patientUserId, Guid patientId);
    Task<ApiResponse<object>> DeletePatientAsync(Guid tenantId, Guid id);
}
