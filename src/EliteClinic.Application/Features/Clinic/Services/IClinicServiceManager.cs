using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;

namespace EliteClinic.Application.Features.Clinic.Services;

public interface IClinicServiceManager
{
    Task<ApiResponse<ClinicServiceDto>> CreateAsync(Guid tenantId, CreateClinicServiceRequest request);
    Task<ApiResponse<ClinicServiceDto>> GetByIdAsync(Guid tenantId, Guid id);
    Task<ApiResponse<PagedResult<ClinicServiceDto>>> GetAllAsync(Guid tenantId, int pageNumber = 1, int pageSize = 20, bool? activeOnly = null);
    Task<ApiResponse<ClinicServiceDto>> UpdateAsync(Guid tenantId, Guid id, UpdateClinicServiceRequest request);
    Task<ApiResponse<bool>> DeleteAsync(Guid tenantId, Guid id);
    Task<ApiResponse<List<DoctorClinicServiceLinkDto>>> GetDoctorLinksAsync(Guid tenantId, Guid doctorId);
    Task<ApiResponse<DoctorClinicServiceLinkDto>> UpsertDoctorLinkAsync(Guid tenantId, Guid doctorId, Guid clinicServiceId, UpsertDoctorClinicServiceLinkRequest request);
    Task<ApiResponse<bool>> RemoveDoctorLinkAsync(Guid tenantId, Guid doctorId, Guid clinicServiceId);
}
