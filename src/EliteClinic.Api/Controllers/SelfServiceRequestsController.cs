using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;
using EliteClinic.Application.Features.Clinic.Services;
using EliteClinic.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EliteClinic.Api.Controllers;

[ApiController]
[Route("api/clinic/self-service-requests")]
[Authorize]
public class SelfServiceRequestsController : ControllerBase
{
    private readonly ITenantContext _tenantContext;
    private readonly IPatientSelfServiceRequestService _selfServiceRequestService;

    public SelfServiceRequestsController(
        ITenantContext tenantContext,
        IPatientSelfServiceRequestService selfServiceRequestService)
    {
        _tenantContext = tenantContext;
        _selfServiceRequestService = selfServiceRequestService;
    }

    private Guid GetCurrentUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    [HttpGet]
    [Authorize(Roles = "ClinicOwner,ClinicManager,Receptionist,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<PatientSelfServiceRequestListItemDto>>), 200)]
    public async Task<ActionResult<ApiResponse<PagedResult<PatientSelfServiceRequestListItemDto>>>> GetAll(
        [FromQuery] SelfServiceRequestsQuery query,
        CancellationToken cancellationToken)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<PagedResult<PatientSelfServiceRequestListItemDto>>.Error("Tenant context not resolved"));

        var result = await _selfServiceRequestService.GetClinicRequestsAsync(_tenantContext.TenantId, query, cancellationToken);
        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    [HttpGet("{requestId:guid}")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,Receptionist,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<PatientSelfServiceRequestDto>), 200)]
    public async Task<ActionResult<ApiResponse<PatientSelfServiceRequestDto>>> GetById(Guid requestId, CancellationToken cancellationToken)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<PatientSelfServiceRequestDto>.Error("Tenant context not resolved"));

        var result = await _selfServiceRequestService.GetClinicRequestByIdAsync(_tenantContext.TenantId, requestId, cancellationToken);
        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    [HttpPost("{requestId:guid}/approve")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,Receptionist,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<PatientSelfServiceRequestDto>), 200)]
    public async Task<ActionResult<ApiResponse<PatientSelfServiceRequestDto>>> Approve(
        Guid requestId,
        [FromBody] ApprovePatientSelfServiceRequest request,
        CancellationToken cancellationToken)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<PatientSelfServiceRequestDto>.Error("Tenant context not resolved"));

        var result = await _selfServiceRequestService.ApproveAsync(
            _tenantContext.TenantId,
            requestId,
            GetCurrentUserId(),
            request,
            cancellationToken);

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    [HttpPost("{requestId:guid}/reject")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,Receptionist,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<PatientSelfServiceRequestDto>), 200)]
    public async Task<ActionResult<ApiResponse<PatientSelfServiceRequestDto>>> Reject(
        Guid requestId,
        [FromBody] RejectPatientSelfServiceRequest request,
        CancellationToken cancellationToken)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<PatientSelfServiceRequestDto>.Error("Tenant context not resolved"));

        var result = await _selfServiceRequestService.RejectAsync(
            _tenantContext.TenantId,
            requestId,
            GetCurrentUserId(),
            request,
            cancellationToken);

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    [HttpPost("{requestId:guid}/request-reupload")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,Receptionist,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<PatientSelfServiceRequestDto>), 200)]
    public async Task<ActionResult<ApiResponse<PatientSelfServiceRequestDto>>> RequestReupload(
        Guid requestId,
        [FromBody] RequestSelfServicePaymentReupload request,
        CancellationToken cancellationToken)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<PatientSelfServiceRequestDto>.Error("Tenant context not resolved"));

        var result = await _selfServiceRequestService.RequestReuploadAsync(
            _tenantContext.TenantId,
            requestId,
            GetCurrentUserId(),
            request,
            cancellationToken);

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    [HttpPost("{requestId:guid}/adjust-paid-amount")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,Receptionist,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<PatientSelfServiceRequestDto>), 200)]
    public async Task<ActionResult<ApiResponse<PatientSelfServiceRequestDto>>> AdjustPaidAmount(
        Guid requestId,
        [FromBody] AdjustSelfServicePaidAmountRequest request,
        CancellationToken cancellationToken)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<PatientSelfServiceRequestDto>.Error("Tenant context not resolved"));

        var result = await _selfServiceRequestService.AdjustPaidAmountAsync(
            _tenantContext.TenantId,
            requestId,
            GetCurrentUserId(),
            request,
            cancellationToken);

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }
}
