using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;
using EliteClinic.Application.Features.Clinic.Services;
using EliteClinic.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EliteClinic.Api.Controllers;

[ApiController]
[Route("api/clinic/visits/{visitId:guid}/prescriptions")]
[Authorize]
public class PrescriptionsController : ControllerBase
{
    private readonly IPrescriptionService _prescriptionService;
    private readonly IPartnerService _partnerService;
    private readonly ITenantContext _tenantContext;

    public PrescriptionsController(IPrescriptionService prescriptionService, IPartnerService partnerService, ITenantContext tenantContext)
    {
        _prescriptionService = prescriptionService;
        _partnerService = partnerService;
        _tenantContext = tenantContext;
    }

    private Guid GetCurrentUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    /// <summary>
    /// Add prescription to visit (Doctor only)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "ClinicOwner,Doctor,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<PrescriptionDto>), 201)]
    [ProducesResponseType(typeof(ApiResponse), 400)]
    public async Task<ActionResult<ApiResponse<PrescriptionDto>>> Create(Guid visitId, [FromBody] CreatePrescriptionRequest request)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<PrescriptionDto>.Error("Tenant context not resolved"));

        var result = await _prescriptionService.CreateAsync(_tenantContext.TenantId, visitId, request, GetCurrentUserId());
        if (!result.Success)
            return BadRequest(result);

        return StatusCode(201, result);
    }

    [HttpPost("{prescriptionId:guid}/partner-order")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,Doctor,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<PartnerOrderDto>), 201)]
    [ProducesResponseType(typeof(ApiResponse<PartnerOrderDto>), 400)]
    public async Task<ActionResult<ApiResponse<PartnerOrderDto>>> CreatePartnerOrder(Guid visitId, Guid prescriptionId, [FromBody] CreatePrescriptionPartnerOrderRequest request)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<PartnerOrderDto>.Error("Tenant context not resolved"));

        var result = await _partnerService.CreatePrescriptionOrderAsync(_tenantContext.TenantId, visitId, prescriptionId, GetCurrentUserId(), request);
        if (!result.Success)
            return BadRequest(result);

        return StatusCode(201, result);
    }

    /// <summary>
    /// Update prescription (Doctor, same-day only)
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "ClinicOwner,Doctor,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<PrescriptionDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 400)]
    public async Task<ActionResult<ApiResponse<PrescriptionDto>>> Update(Guid visitId, Guid id, [FromBody] UpdatePrescriptionRequest request)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<PrescriptionDto>.Error("Tenant context not resolved"));

        var result = await _prescriptionService.UpdateAsync(_tenantContext.TenantId, visitId, id, request, GetCurrentUserId());
        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    /// <summary>
    /// Delete prescription (Doctor, same-day only)
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "ClinicOwner,Doctor,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse), 200)]
    [ProducesResponseType(typeof(ApiResponse), 400)]
    public async Task<ActionResult<ApiResponse>> Delete(Guid visitId, Guid id)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse.Error("Tenant context not resolved"));

        var result = await _prescriptionService.DeleteAsync(_tenantContext.TenantId, visitId, id, GetCurrentUserId());
        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    /// <summary>
    /// List all prescriptions for a visit
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "ClinicOwner,Doctor,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<List<PrescriptionDto>>), 200)]
    public async Task<ActionResult<ApiResponse<List<PrescriptionDto>>>> GetByVisit(Guid visitId)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<List<PrescriptionDto>>.Error("Tenant context not resolved"));

        var result = await _prescriptionService.GetByVisitAsync(_tenantContext.TenantId, visitId);
        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    [HttpGet("{id:guid}/revisions")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,Receptionist,Doctor,Nurse,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<List<PrescriptionRevisionDto>>), 200)]
    [ProducesResponseType(typeof(ApiResponse<List<PrescriptionRevisionDto>>), 400)]
    public async Task<ActionResult<ApiResponse<List<PrescriptionRevisionDto>>>> GetRevisions(Guid visitId, Guid id)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<List<PrescriptionRevisionDto>>.Error("Tenant context not resolved"));

        var result = await _prescriptionService.GetRevisionsAsync(_tenantContext.TenantId, visitId, id, GetCurrentUserId());
        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }
}
