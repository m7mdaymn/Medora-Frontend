using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;
using EliteClinic.Domain.Enums;

namespace EliteClinic.Application.Features.Clinic.Services;

public interface IPatientCreditService
{
    Task<ApiResponse<PatientCreditTransactionDto>> IssueCreditAsync(Guid tenantId, IssuePatientCreditRequest request, CancellationToken cancellationToken = default);
    Task<ApiResponse<PatientCreditTransactionDto>> ConsumeCreditAsync(Guid tenantId, ConsumePatientCreditRequest request, CancellationToken cancellationToken = default);
    Task<ApiResponse<PatientCreditBalanceDto>> GetBalanceAsync(Guid tenantId, Guid patientId, CancellationToken cancellationToken = default);
    Task<ApiResponse<PagedResult<PatientCreditTransactionDto>>> GetHistoryAsync(Guid tenantId, Guid patientId, int pageNumber = 1, int pageSize = 20, CancellationToken cancellationToken = default);
}
