using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;
using EliteClinic.Application.Features.Clinic.Services;
using EliteClinic.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EliteClinic.Api.Controllers;

[ApiController]
[Route("api/clinic/inventory/items")]
[Authorize]
public class InventoryController : ControllerBase
{
    private readonly IInventoryService _inventoryService;
    private readonly ITenantContext _tenantContext;

    public InventoryController(IInventoryService inventoryService, ITenantContext tenantContext)
    {
        _inventoryService = inventoryService;
        _tenantContext = tenantContext;
    }

    [HttpGet]
    [Authorize(Roles = "ClinicOwner,ClinicManager,Receptionist,Doctor,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<InventoryItemDto>>), 200)]
    public async Task<ActionResult<ApiResponse<PagedResult<InventoryItemDto>>>> GetItems([FromQuery] InventoryItemsQuery query)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<PagedResult<InventoryItemDto>>.Error("Tenant context not resolved"));

        var result = await _inventoryService.ListItemsAsync(_tenantContext.TenantId, query);
        return Ok(result);
    }

    [HttpGet("{itemId:guid}")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,Receptionist,Doctor,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<InventoryItemDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse<InventoryItemDto>), 404)]
    public async Task<ActionResult<ApiResponse<InventoryItemDto>>> GetItemById(Guid itemId)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<InventoryItemDto>.Error("Tenant context not resolved"));

        var result = await _inventoryService.GetItemByIdAsync(_tenantContext.TenantId, itemId);
        if (!result.Success)
            return NotFound(result);

        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "ClinicOwner,ClinicManager,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<InventoryItemDto>), 201)]
    [ProducesResponseType(typeof(ApiResponse<InventoryItemDto>), 400)]
    public async Task<ActionResult<ApiResponse<InventoryItemDto>>> Create([FromBody] CreateInventoryItemRequest request)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<InventoryItemDto>.Error("Tenant context not resolved"));

        var result = await _inventoryService.CreateItemAsync(_tenantContext.TenantId, request);
        if (!result.Success)
            return BadRequest(result);

        return StatusCode(201, result);
    }

    [HttpPut("{itemId:guid}")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<InventoryItemDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse<InventoryItemDto>), 400)]
    public async Task<ActionResult<ApiResponse<InventoryItemDto>>> Update(Guid itemId, [FromBody] UpdateInventoryItemRequest request)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<InventoryItemDto>.Error("Tenant context not resolved"));

        var result = await _inventoryService.UpdateItemAsync(_tenantContext.TenantId, itemId, request);
        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    [HttpPost("{itemId:guid}/activation")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<InventoryItemDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse<InventoryItemDto>), 400)]
    public async Task<ActionResult<ApiResponse<InventoryItemDto>>> SetActivation(Guid itemId, [FromBody] SetInventoryItemActivationRequest request)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<InventoryItemDto>.Error("Tenant context not resolved"));

        var result = await _inventoryService.SetActivationAsync(_tenantContext.TenantId, itemId, request);
        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }
}
