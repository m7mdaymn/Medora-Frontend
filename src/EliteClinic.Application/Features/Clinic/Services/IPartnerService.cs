using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;
using EliteClinic.Domain.Enums;

namespace EliteClinic.Application.Features.Clinic.Services;

public interface IPartnerService
{
    Task<ApiResponse<PagedResult<PartnerDto>>> ListPartnersAsync(Guid tenantId, PartnerType? type, bool activeOnly, int pageNumber = 1, int pageSize = 20);
    Task<ApiResponse<PartnerDto>> CreatePartnerAsync(Guid tenantId, CreatePartnerRequest request);
    Task<ApiResponse<PartnerDto>> UpdatePartnerAsync(Guid tenantId, Guid partnerId, UpdatePartnerRequest request);
    Task<ApiResponse<PartnerDto>> SetPartnerActivationAsync(Guid tenantId, Guid partnerId, bool isActive);

    Task<ApiResponse<List<PartnerContractDto>>> ListContractsAsync(Guid tenantId, PartnerContractsQuery query);
    Task<ApiResponse<PartnerContractDto>> CreateContractAsync(Guid tenantId, CreatePartnerContractRequest request);
    Task<ApiResponse<PartnerContractDto>> UpdateContractAsync(Guid tenantId, Guid contractId, UpdatePartnerContractRequest request);

    Task<ApiResponse<PartnerOrderDto>> CreateLabOrderAsync(Guid tenantId, Guid visitId, Guid labRequestId, Guid callerUserId, CreateLabPartnerOrderRequest request);
    Task<ApiResponse<PartnerOrderDto>> CreatePrescriptionOrderAsync(Guid tenantId, Guid visitId, Guid prescriptionId, Guid callerUserId, CreatePrescriptionPartnerOrderRequest request);
    Task<ApiResponse<PagedResult<PartnerOrderDto>>> ListOrdersAsync(Guid tenantId, Guid callerUserId, PartnerOrdersQuery query);
    Task<ApiResponse<PartnerOrderDto>> GetOrderByIdAsync(Guid tenantId, Guid callerUserId, Guid orderId);
    Task<ApiResponse<PartnerOrderDto>> UpdateOrderStatusAsync(Guid tenantId, Guid callerUserId, Guid orderId, UpdatePartnerOrderStatusRequest request);
}
