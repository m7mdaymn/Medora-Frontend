using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;
using EliteClinic.Application.Features.Clinic.Services;
using EliteClinic.Domain.Enums;
using EliteClinic.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EliteClinic.Api.Controllers;

[ApiController]
[Route("api/clinic/partners")]
[Authorize]
public class PartnersController : ControllerBase
{
    private readonly IPartnerService _partnerService;
    private readonly ITenantContext _tenantContext;

    public PartnersController(IPartnerService partnerService, ITenantContext tenantContext)
    {
        _partnerService = partnerService;
        _tenantContext = tenantContext;
    }

    private Guid GetCurrentUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    [HttpGet]
    [Authorize(Roles = "ClinicOwner,ClinicManager,Receptionist,Doctor,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<PartnerDto>>), 200)]
    public async Task<ActionResult<ApiResponse<PagedResult<PartnerDto>>>> List(
        [FromQuery] PartnerType? type,
        [FromQuery] bool activeOnly = true,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<PagedResult<PartnerDto>>.Error("Tenant context not resolved"));

        var result = await _partnerService.ListPartnersAsync(_tenantContext.TenantId, type, activeOnly, pageNumber, pageSize);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "ClinicOwner,ClinicManager,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<PartnerDto>), 201)]
    [ProducesResponseType(typeof(ApiResponse<PartnerDto>), 400)]
    public async Task<ActionResult<ApiResponse<PartnerDto>>> Create([FromBody] CreatePartnerRequest request)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<PartnerDto>.Error("Tenant context not resolved"));

        var result = await _partnerService.CreatePartnerAsync(_tenantContext.TenantId, request);
        if (!result.Success)
            return BadRequest(result);

        return StatusCode(201, result);
    }

    [HttpPut("{partnerId:guid}")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<PartnerDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse<PartnerDto>), 400)]
    public async Task<ActionResult<ApiResponse<PartnerDto>>> Update(Guid partnerId, [FromBody] UpdatePartnerRequest request)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<PartnerDto>.Error("Tenant context not resolved"));

        var result = await _partnerService.UpdatePartnerAsync(_tenantContext.TenantId, partnerId, request);
        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    [HttpPost("{partnerId:guid}/activation")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<PartnerDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse<PartnerDto>), 400)]
    public async Task<ActionResult<ApiResponse<PartnerDto>>> SetActivation(Guid partnerId, [FromBody] SetPartnerActivationRequest request)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<PartnerDto>.Error("Tenant context not resolved"));

        var result = await _partnerService.SetPartnerActivationAsync(_tenantContext.TenantId, partnerId, request.IsActive);
        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    [HttpPost("{partnerId:guid}/users")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<PartnerUserDto>), 201)]
    [ProducesResponseType(typeof(ApiResponse<PartnerUserDto>), 400)]
    public async Task<ActionResult<ApiResponse<PartnerUserDto>>> CreatePartnerUser(Guid partnerId, [FromBody] CreatePartnerUserRequest request)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<PartnerUserDto>.Error("Tenant context not resolved"));

        var result = await _partnerService.CreatePartnerUserAsync(_tenantContext.TenantId, partnerId, request);
        if (!result.Success)
            return BadRequest(result);

        return StatusCode(201, result);
    }

    [HttpGet("contracts")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,Receptionist,Doctor,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<List<PartnerContractDto>>), 200)]
    public async Task<ActionResult<ApiResponse<List<PartnerContractDto>>>> ListContracts([FromQuery] PartnerContractsQuery query)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<List<PartnerContractDto>>.Error("Tenant context not resolved"));

        var result = await _partnerService.ListContractsAsync(_tenantContext.TenantId, query);
        return Ok(result);
    }

    [HttpPost("contracts")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,Doctor,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<PartnerContractDto>), 201)]
    [ProducesResponseType(typeof(ApiResponse<PartnerContractDto>), 400)]
    public async Task<ActionResult<ApiResponse<PartnerContractDto>>> CreateContract([FromBody] CreatePartnerContractRequest request)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<PartnerContractDto>.Error("Tenant context not resolved"));

        var result = await _partnerService.CreateContractAsync(_tenantContext.TenantId, request);
        if (!result.Success)
            return BadRequest(result);

        return StatusCode(201, result);
    }

    [HttpPut("contracts/{contractId:guid}")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,Doctor,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<PartnerContractDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse<PartnerContractDto>), 400)]
    public async Task<ActionResult<ApiResponse<PartnerContractDto>>> UpdateContract(Guid contractId, [FromBody] UpdatePartnerContractRequest request)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<PartnerContractDto>.Error("Tenant context not resolved"));

        var result = await _partnerService.UpdateContractAsync(_tenantContext.TenantId, contractId, request);
        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    [HttpGet("services")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,Receptionist,Doctor,Contractor,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<List<PartnerServiceCatalogItemDto>>), 200)]
    public async Task<ActionResult<ApiResponse<List<PartnerServiceCatalogItemDto>>>> ListServices([FromQuery] PartnerServiceCatalogQuery query)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<List<PartnerServiceCatalogItemDto>>.Error("Tenant context not resolved"));

        var result = await _partnerService.ListServiceCatalogAsync(_tenantContext.TenantId, GetCurrentUserId(), query);
        return Ok(result);
    }

    [HttpPost("services")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,Doctor,Contractor,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<PartnerServiceCatalogItemDto>), 201)]
    [ProducesResponseType(typeof(ApiResponse<PartnerServiceCatalogItemDto>), 400)]
    public async Task<ActionResult<ApiResponse<PartnerServiceCatalogItemDto>>> CreateService([FromBody] CreatePartnerServiceCatalogItemRequest request)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<PartnerServiceCatalogItemDto>.Error("Tenant context not resolved"));

        var result = await _partnerService.CreateServiceCatalogItemAsync(_tenantContext.TenantId, GetCurrentUserId(), request);
        if (!result.Success)
            return BadRequest(result);

        return StatusCode(201, result);
    }

    [HttpPut("services/{itemId:guid}")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,Doctor,Contractor,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<PartnerServiceCatalogItemDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse<PartnerServiceCatalogItemDto>), 400)]
    public async Task<ActionResult<ApiResponse<PartnerServiceCatalogItemDto>>> UpdateService(Guid itemId, [FromBody] UpdatePartnerServiceCatalogItemRequest request)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<PartnerServiceCatalogItemDto>.Error("Tenant context not resolved"));

        var result = await _partnerService.UpdateServiceCatalogItemAsync(_tenantContext.TenantId, GetCurrentUserId(), itemId, request);
        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }
}
