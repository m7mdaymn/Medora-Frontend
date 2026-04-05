using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;
using EliteClinic.Application.Features.Clinic.Services;
using EliteClinic.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EliteClinic.Api.Controllers;

[ApiController]
[Route("api/clinic/marketplace/orders")]
[Authorize]
public class MarketplaceOrdersController : ControllerBase
{
    private readonly IMarketplaceService _marketplaceService;
    private readonly ITenantContext _tenantContext;

    public MarketplaceOrdersController(IMarketplaceService marketplaceService, ITenantContext tenantContext)
    {
        _marketplaceService = marketplaceService;
        _tenantContext = tenantContext;
    }

    private Guid GetCurrentUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    [HttpGet]
    [Authorize(Roles = "ClinicOwner,ClinicManager,Receptionist,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<MarketplaceOrderDto>>), 200)]
    public async Task<ActionResult<ApiResponse<PagedResult<MarketplaceOrderDto>>>> GetOrders([FromQuery] MarketplaceOrdersQuery query)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<PagedResult<MarketplaceOrderDto>>.Error("Tenant context not resolved"));

        var result = await _marketplaceService.GetClinicOrdersAsync(_tenantContext.TenantId, query);
        return Ok(result);
    }

    [HttpGet("{orderId:guid}")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,Receptionist,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<MarketplaceOrderDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse<MarketplaceOrderDto>), 404)]
    public async Task<ActionResult<ApiResponse<MarketplaceOrderDto>>> GetOrderById(Guid orderId)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<MarketplaceOrderDto>.Error("Tenant context not resolved"));

        var result = await _marketplaceService.GetClinicOrderByIdAsync(_tenantContext.TenantId, orderId);
        if (!result.Success)
            return NotFound(result);

        return Ok(result);
    }

    [HttpPost("{orderId:guid}/status")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,Receptionist,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<MarketplaceOrderDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse<MarketplaceOrderDto>), 400)]
    public async Task<ActionResult<ApiResponse<MarketplaceOrderDto>>> UpdateStatus(Guid orderId, [FromBody] UpdateMarketplaceOrderStatusRequest request)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<MarketplaceOrderDto>.Error("Tenant context not resolved"));

        var result = await _marketplaceService.UpdateOrderStatusAsync(_tenantContext.TenantId, orderId, GetCurrentUserId(), request);
        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }
}
