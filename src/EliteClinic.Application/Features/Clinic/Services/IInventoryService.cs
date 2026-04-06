using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;

namespace EliteClinic.Application.Features.Clinic.Services;

public interface IInventoryService
{
    Task<ApiResponse<InventoryItemDto>> CreateItemAsync(Guid tenantId, CreateInventoryItemRequest request);
    Task<ApiResponse<InventoryItemDto>> UpdateItemAsync(Guid tenantId, Guid itemId, UpdateInventoryItemRequest request);
    Task<ApiResponse<InventoryItemDto>> GetItemByIdAsync(Guid tenantId, Guid callerUserId, Guid itemId);
    Task<ApiResponse<PagedResult<InventoryItemDto>>> ListItemsAsync(Guid tenantId, Guid callerUserId, InventoryItemsQuery query);
    Task<ApiResponse<InventoryItemDto>> SetActivationAsync(Guid tenantId, Guid itemId, SetInventoryItemActivationRequest request);
    Task<ApiResponse<VisitInventoryUsageDto>> RecordVisitUsageAsync(Guid tenantId, Guid visitId, Guid callerUserId, RecordVisitInventoryUsageRequest request);
}
