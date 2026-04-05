using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;
using EliteClinic.Domain.Enums;

namespace EliteClinic.Application.Features.Clinic.Services;

public interface IReportsService
{
    Task<ApiResponse<ClinicOverviewReportDto>> GetClinicOverviewAsync(Guid tenantId, DateTime fromDate, DateTime toDate, Guid? doctorId = null, VisitType? visitType = null, VisitSource? source = null);
    Task<ApiResponse<ServicesSalesReportDto>> GetServicesSalesAsync(Guid tenantId, DateTime fromDate, DateTime toDate, Guid? doctorId = null, VisitType? visitType = null, VisitSource? source = null);
    Task<ApiResponse<ClinicOverviewReportDto>> GetDoctorOwnOverviewAsync(Guid tenantId, Guid doctorUserId, DateTime fromDate, DateTime toDate, VisitType? visitType = null, VisitSource? source = null);
}
