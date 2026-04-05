using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;

namespace EliteClinic.Application.Features.Clinic.Services;

public interface IMarketplaceService
{
    Task<ApiResponse<PagedResult<PublicMarketplaceItemDto>>> GetPublicItemsAsync(string tenantSlug, PublicMarketplaceItemsQuery query);
    Task<ApiResponse<PublicMarketplaceItemDto>> GetPublicItemByIdAsync(string tenantSlug, Guid itemId);
    Task<ApiResponse<MarketplaceOrderDto>> CreatePublicOrderAsync(string tenantSlug, CreatePublicMarketplaceOrderRequest request);
    Task<ApiResponse<PagedResult<MarketplaceOrderDto>>> GetClinicOrdersAsync(Guid tenantId, MarketplaceOrdersQuery query);
    Task<ApiResponse<MarketplaceOrderDto>> GetClinicOrderByIdAsync(Guid tenantId, Guid orderId);
    Task<ApiResponse<MarketplaceOrderDto>> UpdateOrderStatusAsync(Guid tenantId, Guid orderId, Guid changedByUserId, UpdateMarketplaceOrderStatusRequest request);
}
