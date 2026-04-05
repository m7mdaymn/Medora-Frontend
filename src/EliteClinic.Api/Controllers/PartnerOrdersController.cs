using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;
using EliteClinic.Application.Features.Clinic.Services;
using EliteClinic.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EliteClinic.Api.Controllers;

[ApiController]
[Route("api/clinic/partner-orders")]
[Authorize]
public class PartnerOrdersController : ControllerBase
{
    private readonly IPartnerService _partnerService;
    private readonly ITenantContext _tenantContext;

    public PartnerOrdersController(IPartnerService partnerService, ITenantContext tenantContext)
    {
        _partnerService = partnerService;
        _tenantContext = tenantContext;
    }

    private Guid GetCurrentUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    [HttpGet]
    [Authorize(Roles = "ClinicOwner,ClinicManager,Receptionist,Doctor,Nurse,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<PartnerOrderDto>>), 200)]
    public async Task<ActionResult<ApiResponse<PagedResult<PartnerOrderDto>>>> List([FromQuery] PartnerOrdersQuery query)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<PagedResult<PartnerOrderDto>>.Error("Tenant context not resolved"));

        var result = await _partnerService.ListOrdersAsync(_tenantContext.TenantId, GetCurrentUserId(), query);
        return Ok(result);
    }

    [HttpGet("{orderId:guid}")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,Receptionist,Doctor,Nurse,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<PartnerOrderDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse<PartnerOrderDto>), 400)]
    public async Task<ActionResult<ApiResponse<PartnerOrderDto>>> GetById(Guid orderId)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<PartnerOrderDto>.Error("Tenant context not resolved"));

        var result = await _partnerService.GetOrderByIdAsync(_tenantContext.TenantId, GetCurrentUserId(), orderId);
        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    [HttpPost("{orderId:guid}/status")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,Receptionist,Doctor,Nurse,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<PartnerOrderDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse<PartnerOrderDto>), 400)]
    public async Task<ActionResult<ApiResponse<PartnerOrderDto>>> UpdateStatus(Guid orderId, [FromBody] UpdatePartnerOrderStatusRequest request)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<PartnerOrderDto>.Error("Tenant context not resolved"));

        var result = await _partnerService.UpdateOrderStatusAsync(_tenantContext.TenantId, GetCurrentUserId(), orderId, request);
        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }
}
