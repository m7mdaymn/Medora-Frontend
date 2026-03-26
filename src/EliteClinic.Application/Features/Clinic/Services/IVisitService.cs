using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;

namespace EliteClinic.Application.Features.Clinic.Services;

public interface IVisitService
{
    Task<ApiResponse<VisitDto>> CreateVisitAsync(Guid tenantId, CreateVisitRequest request, Guid callerUserId);
    Task<ApiResponse<VisitDto>> UpdateVisitAsync(Guid tenantId, Guid visitId, UpdateVisitRequest request, Guid callerUserId);
    Task<ApiResponse<VisitDto>> CompleteVisitAsync(Guid tenantId, Guid visitId, CompleteVisitRequest request, Guid callerUserId);
    Task<ApiResponse<VisitDto>> GetVisitByIdAsync(Guid tenantId, Guid visitId, Guid callerUserId);
    Task<ApiResponse<PagedResult<VisitDto>>> GetPatientVisitsAsync(Guid tenantId, Guid patientId, Guid callerUserId, int pageNumber = 1, int pageSize = 10);
    Task<ApiResponse<PatientSummaryDto>> GetPatientSummaryAsync(Guid tenantId, Guid patientId, Guid callerUserId);
    Task<ApiResponse<List<VisitDto>>> GetMyTodayVisitsAsync(Guid tenantId, Guid doctorUserId);
    Task<ApiResponse<PagedResult<PatientDto>>> GetMyPatientsAsync(Guid tenantId, Guid doctorUserId, int pageNumber = 1, int pageSize = 10, string? search = null);
    Task<ApiResponse<PagedResult<VisitDto>>> GetPatientVisitsForOwnedProfileAsync(Guid tenantId, Guid patientUserId, Guid patientId, int pageNumber = 1, int pageSize = 10);
    Task<ApiResponse<PatientSummaryDto>> GetPatientSummaryForOwnedProfileAsync(Guid tenantId, Guid patientUserId, Guid patientId);
    Task<ApiResponse<List<StaleOpenVisitDto>>> GetStaleOpenVisitsAsync(Guid tenantId, int olderThanHours = 12);
    Task<ApiResponse<VisitDto>> CloseStaleVisitAsync(Guid tenantId, Guid visitId, CloseStaleVisitRequest request);
}
