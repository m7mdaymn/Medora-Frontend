using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;

namespace EliteClinic.Application.Features.Clinic.Services;

public interface IWorkforceService
{
    Task<ApiResponse<DoctorCompensationRuleDto>> CreateDoctorCompensationRuleAsync(Guid tenantId, Guid doctorId, Guid changedByUserId, CreateDoctorCompensationRuleRequest request, CancellationToken cancellationToken = default);
    Task<ApiResponse<List<DoctorCompensationRuleDto>>> ListDoctorCompensationRulesAsync(Guid tenantId, Guid doctorId, CancellationToken cancellationToken = default);

    Task<ApiResponse<AttendanceRecordDto>> CreateAttendanceRecordAsync(Guid tenantId, Guid enteredByUserId, CreateAttendanceRecordRequest request, CancellationToken cancellationToken = default);
    Task<ApiResponse<AttendanceRecordDto>> CheckOutAttendanceAsync(Guid tenantId, Guid attendanceId, CheckOutAttendanceRequest request, CancellationToken cancellationToken = default);
    Task<ApiResponse<List<AttendanceRecordDto>>> ListAttendanceAsync(Guid tenantId, DateTime? from, DateTime? to, Guid? doctorId, Guid? employeeId, CancellationToken cancellationToken = default);
    Task<ApiResponse<AbsenceRecordDto>> CreateAbsenceRecordAsync(Guid tenantId, Guid enteredByUserId, CreateAbsenceRecordRequest request, CancellationToken cancellationToken = default);
    Task<ApiResponse<List<AbsenceRecordDto>>> ListAbsenceRecordsAsync(Guid tenantId, DateTime? from, DateTime? to, Guid? doctorId, Guid? employeeId, CancellationToken cancellationToken = default);

    Task<ApiResponse<SalaryPayoutExpenseDto>> CreateSalaryPayoutAsync(Guid tenantId, Guid recordedByUserId, CreateSalaryPayoutRequest request, CancellationToken cancellationToken = default);

    Task<ApiResponse<DailyClosingSnapshotDto>> GenerateDailyClosingSnapshotAsync(Guid tenantId, Guid generatedByUserId, DateTime snapshotDate, CancellationToken cancellationToken = default);
    Task<ApiResponse<List<DailyClosingSnapshotDto>>> GetDailyClosingSnapshotsAsync(Guid tenantId, DateTime? from, DateTime? to, CancellationToken cancellationToken = default);
}
