using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;
using EliteClinic.Application.Features.Clinic.Services;
using EliteClinic.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EliteClinic.Api.Controllers;

/// <summary>
/// Manage clinic-level services (e.g. "General Consultation", "Dental Cleaning").
/// These are tenant-scoped service definitions that can be linked to doctors.
/// </summary>
[ApiController]
[Route("api/clinic/services")]
[Authorize]
public class ClinicServicesController : ControllerBase
{
    private readonly IClinicServiceManager _serviceManager;
    private readonly ITenantContext _tenantContext;
    private readonly ILogger<ClinicServicesController> _logger;

    public ClinicServicesController(
        IClinicServiceManager serviceManager,
        ITenantContext tenantContext,
        ILogger<ClinicServicesController> logger)
    {
        _serviceManager = serviceManager;
        _tenantContext = tenantContext;
        _logger = logger;
    }

    /// <summary>
    /// List all clinic services with optional filtering and pagination
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "SuperAdmin,ClinicOwner,ClinicManager,Doctor,Receptionist,Nurse")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<ClinicServiceDto>>), 200)]
    public async Task<ActionResult<ApiResponse<PagedResult<ClinicServiceDto>>>> GetAll(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] bool? activeOnly = null)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<PagedResult<ClinicServiceDto>>.Error("Tenant context not resolved"));

        var result = await _serviceManager.GetAllAsync(_tenantContext.TenantId, pageNumber, pageSize, activeOnly);
        return Ok(result);
    }

    /// <summary>
    /// Get a specific clinic service by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,ClinicOwner,ClinicManager,Doctor,Receptionist,Nurse")]
    [ProducesResponseType(typeof(ApiResponse<ClinicServiceDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 404)]
    public async Task<ActionResult<ApiResponse<ClinicServiceDto>>> GetById(Guid id)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<ClinicServiceDto>.Error("Tenant context not resolved"));

        var result = await _serviceManager.GetByIdAsync(_tenantContext.TenantId, id);
        if (!result.Success)
            return NotFound(result);

        return Ok(result);
    }

    /// <summary>
    /// Create a new clinic service
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "SuperAdmin,ClinicOwner,ClinicManager")]
    [ProducesResponseType(typeof(ApiResponse<ClinicServiceDto>), 201)]
    [ProducesResponseType(typeof(ApiResponse), 400)]
    [ProducesResponseType(typeof(ApiResponse), 409)]
    public async Task<ActionResult<ApiResponse<ClinicServiceDto>>> Create([FromBody] CreateClinicServiceRequest request)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<ClinicServiceDto>.Error("Tenant context not resolved"));

        var result = await _serviceManager.CreateAsync(_tenantContext.TenantId, request);
        if (!result.Success)
        {
            if (result.Message.Contains("already exists"))
                return Conflict(result);
            return BadRequest(result);
        }

        return StatusCode(201, result);
    }

    /// <summary>
    /// Update a clinic service (PATCH semantics — only provided fields are updated)
    /// </summary>
    [HttpPatch("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,ClinicOwner,ClinicManager")]
    [ProducesResponseType(typeof(ApiResponse<ClinicServiceDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 400)]
    [ProducesResponseType(typeof(ApiResponse), 404)]
    [ProducesResponseType(typeof(ApiResponse), 409)]
    public async Task<ActionResult<ApiResponse<ClinicServiceDto>>> Update(Guid id, [FromBody] UpdateClinicServiceRequest request)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<ClinicServiceDto>.Error("Tenant context not resolved"));

        var result = await _serviceManager.UpdateAsync(_tenantContext.TenantId, id, request);
        if (!result.Success)
        {
            if (result.Message.Contains("not found"))
                return NotFound(result);
            if (result.Message.Contains("already exists"))
                return Conflict(result);
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Delete a clinic service (soft delete)
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,ClinicOwner,ClinicManager")]
    [ProducesResponseType(typeof(ApiResponse<bool>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 400)]
    [ProducesResponseType(typeof(ApiResponse), 404)]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(Guid id)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<bool>.Error("Tenant context not resolved"));

        var result = await _serviceManager.DeleteAsync(_tenantContext.TenantId, id);
        if (!result.Success)
        {
            if (result.Message.Contains("not found"))
                return NotFound(result);
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// List effective clinic service links for a doctor.
    /// </summary>
    [HttpGet("doctors/{doctorId:guid}/links")]
    [Authorize(Roles = "SuperAdmin,ClinicOwner,ClinicManager,Doctor,Receptionist")]
    [ProducesResponseType(typeof(ApiResponse<List<DoctorClinicServiceLinkDto>>), 200)]
    public async Task<ActionResult<ApiResponse<List<DoctorClinicServiceLinkDto>>>> GetDoctorLinks(Guid doctorId)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<List<DoctorClinicServiceLinkDto>>.Error("Tenant context not resolved"));

        var result = await _serviceManager.GetDoctorLinksAsync(_tenantContext.TenantId, doctorId);
        if (!result.Success)
            return NotFound(result);

        return Ok(result);
    }

    /// <summary>
    /// Enable/disable a clinic service for a doctor and optionally set overrides.
    /// </summary>
    [HttpPut("doctors/{doctorId:guid}/links/{clinicServiceId:guid}")]
    [Authorize(Roles = "SuperAdmin,ClinicOwner,ClinicManager")]
    [ProducesResponseType(typeof(ApiResponse<DoctorClinicServiceLinkDto>), 200)]
    public async Task<ActionResult<ApiResponse<DoctorClinicServiceLinkDto>>> UpsertDoctorLink(
        Guid doctorId,
        Guid clinicServiceId,
        [FromBody] UpsertDoctorClinicServiceLinkRequest request)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<DoctorClinicServiceLinkDto>.Error("Tenant context not resolved"));

        var result = await _serviceManager.UpsertDoctorLinkAsync(_tenantContext.TenantId, doctorId, clinicServiceId, request);
        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    /// <summary>
    /// Remove clinic service link from doctor.
    /// </summary>
    [HttpDelete("doctors/{doctorId:guid}/links/{clinicServiceId:guid}")]
    [Authorize(Roles = "SuperAdmin,ClinicOwner,ClinicManager")]
    [ProducesResponseType(typeof(ApiResponse<bool>), 200)]
    public async Task<ActionResult<ApiResponse<bool>>> RemoveDoctorLink(Guid doctorId, Guid clinicServiceId)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<bool>.Error("Tenant context not resolved"));

        var result = await _serviceManager.RemoveDoctorLinkAsync(_tenantContext.TenantId, doctorId, clinicServiceId);
        if (!result.Success)
            return NotFound(result);

        return Ok(result);
    }
}
