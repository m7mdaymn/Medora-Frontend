using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;
using EliteClinic.Application.Features.Clinic.Services;
using EliteClinic.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EliteClinic.Api.Controllers;

[ApiController]
[Route("api/clinic/branches")]
[Authorize]
public class BranchesController : ControllerBase
{
    private readonly IBranchService _branchService;
    private readonly ITenantContext _tenantContext;

    public BranchesController(IBranchService branchService, ITenantContext tenantContext)
    {
        _branchService = branchService;
        _tenantContext = tenantContext;
    }

    [HttpGet]
    [Authorize(Roles = "ClinicOwner,BranchManager,ClinicManager,Receptionist,Doctor,Nurse,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<List<BranchDto>>), 200)]
    public async Task<ActionResult<ApiResponse<List<BranchDto>>>> GetBranches([FromQuery] bool includeInactive = false)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<List<BranchDto>>.Error("Tenant context not resolved"));

        var result = await _branchService.GetBranchesAsync(_tenantContext.TenantId, includeInactive);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "ClinicOwner,BranchManager,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<BranchDto>), 201)]
    [ProducesResponseType(typeof(ApiResponse), 400)]
    public async Task<ActionResult<ApiResponse<BranchDto>>> CreateBranch([FromBody] CreateBranchRequest request)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<BranchDto>.Error("Tenant context not resolved"));

        var result = await _branchService.CreateBranchAsync(_tenantContext.TenantId, request);
        if (!result.Success)
            return BadRequest(result);

        return StatusCode(201, result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "ClinicOwner,BranchManager,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<BranchDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 400)]
    [ProducesResponseType(typeof(ApiResponse), 404)]
    public async Task<ActionResult<ApiResponse<BranchDto>>> UpdateBranch(Guid id, [FromBody] UpdateBranchRequest request)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<BranchDto>.Error("Tenant context not resolved"));

        var result = await _branchService.UpdateBranchAsync(_tenantContext.TenantId, id, request);
        if (!result.Success)
            return result.Message.Contains("not found", StringComparison.OrdinalIgnoreCase)
                ? NotFound(result)
                : BadRequest(result);

        return Ok(result);
    }

    [HttpPost("{id:guid}/activate")]
    [Authorize(Roles = "ClinicOwner,BranchManager,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<BranchDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 404)]
    public async Task<ActionResult<ApiResponse<BranchDto>>> ActivateBranch(Guid id)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<BranchDto>.Error("Tenant context not resolved"));

        var result = await _branchService.SetBranchStatusAsync(_tenantContext.TenantId, id, true);
        if (!result.Success)
            return NotFound(result);

        return Ok(result);
    }

    [HttpPost("{id:guid}/deactivate")]
    [Authorize(Roles = "ClinicOwner,BranchManager,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<BranchDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 404)]
    public async Task<ActionResult<ApiResponse<BranchDto>>> DeactivateBranch(Guid id)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<BranchDto>.Error("Tenant context not resolved"));

        var result = await _branchService.SetBranchStatusAsync(_tenantContext.TenantId, id, false);
        if (!result.Success)
            return NotFound(result);

        return Ok(result);
    }
}