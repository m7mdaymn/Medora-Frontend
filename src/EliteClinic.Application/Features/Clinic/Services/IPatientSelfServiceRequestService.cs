using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;
using Microsoft.AspNetCore.Http;

namespace EliteClinic.Application.Features.Clinic.Services;

public interface IPatientSelfServiceRequestService
{
    Task<ApiResponse<PatientSelfServiceRequestDto>> CreateAsync(
        Guid tenantId,
        Guid callerUserId,
        CreatePatientSelfServiceRequest request,
        IFormFile paymentProof,
        List<IFormFile>? supportingDocuments,
        CancellationToken cancellationToken = default);

    Task<ApiResponse<List<PatientSelfServiceRequestListItemDto>>> ListOwnedAsync(
        Guid tenantId,
        Guid callerUserId,
        Guid? patientId,
        CancellationToken cancellationToken = default);

    Task<ApiResponse<PatientSelfServiceRequestDto>> GetOwnedByIdAsync(
        Guid tenantId,
        Guid callerUserId,
        Guid requestId,
        CancellationToken cancellationToken = default);

    Task<ApiResponse<PatientSelfServiceRequestDto>> ReuploadPaymentProofAsync(
        Guid tenantId,
        Guid callerUserId,
        Guid requestId,
        IFormFile paymentProof,
        CancellationToken cancellationToken = default);

    Task<ApiResponse<PagedResult<PatientSelfServiceRequestListItemDto>>> GetClinicRequestsAsync(
        Guid tenantId,
        SelfServiceRequestsQuery query,
        CancellationToken cancellationToken = default);

    Task<ApiResponse<PatientSelfServiceRequestDto>> GetClinicRequestByIdAsync(
        Guid tenantId,
        Guid requestId,
        CancellationToken cancellationToken = default);

    Task<ApiResponse<PatientSelfServiceRequestDto>> ApproveAsync(
        Guid tenantId,
        Guid requestId,
        Guid approverUserId,
        ApprovePatientSelfServiceRequest request,
        CancellationToken cancellationToken = default);

    Task<ApiResponse<PatientSelfServiceRequestDto>> RejectAsync(
        Guid tenantId,
        Guid requestId,
        Guid reviewerUserId,
        RejectPatientSelfServiceRequest request,
        CancellationToken cancellationToken = default);

    Task<ApiResponse<PatientSelfServiceRequestDto>> RequestReuploadAsync(
        Guid tenantId,
        Guid requestId,
        Guid reviewerUserId,
        RequestSelfServicePaymentReupload request,
        CancellationToken cancellationToken = default);

    Task<ApiResponse<PatientSelfServiceRequestDto>> AdjustPaidAmountAsync(
        Guid tenantId,
        Guid requestId,
        Guid reviewerUserId,
        AdjustSelfServicePaidAmountRequest request,
        CancellationToken cancellationToken = default);
}
