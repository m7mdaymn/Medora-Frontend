using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;
using EliteClinic.Application.Features.Clinic.Services;
using EliteClinic.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EliteClinic.Api.Controllers;

[ApiController]
[Route("api/clinic/visits")]
[Authorize]
public class VisitsController : ControllerBase
{
    private readonly IVisitService _visitService;
    private readonly ITenantContext _tenantContext;
    private readonly ILogger<VisitsController> _logger;

    public VisitsController(IVisitService visitService, ITenantContext tenantContext, ILogger<VisitsController> logger)
    {
        _visitService = visitService;
        _tenantContext = tenantContext;
        _logger = logger;
    }

    private Guid GetCurrentUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    /// <summary>
    /// Create a visit manually (not from ticket) or from a ticket
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "ClinicOwner,ClinicManager,Doctor,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<VisitDto>), 201)]
    [ProducesResponseType(typeof(ApiResponse), 400)]
    public async Task<ActionResult<ApiResponse<VisitDto>>> CreateVisit([FromBody] CreateVisitRequest request)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<VisitDto>.Error("Tenant context not resolved"));

        var result = await _visitService.CreateVisitAsync(_tenantContext.TenantId, request, GetCurrentUserId());
        if (!result.Success)
            return BadRequest(result);

        _logger.LogInformation("Visit created for patient {PatientId}", request.PatientId);
        return StatusCode(201, result);
    }

    /// <summary>
    /// Update visit (complaint, vitals, diagnosis, notes, follow-up)
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "ClinicOwner,Doctor,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<VisitDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 400)]
    public async Task<ActionResult<ApiResponse<VisitDto>>> UpdateVisit(Guid id, [FromBody] UpdateVisitRequest request)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<VisitDto>.Error("Tenant context not resolved"));

        var result = await _visitService.UpdateVisitAsync(_tenantContext.TenantId, id, request, GetCurrentUserId());
        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    /// <summary>
    /// Complete a visit (marks visit and linked ticket as completed)
    /// </summary>
    [HttpPost("{id:guid}/complete")]
    [Authorize(Roles = "ClinicOwner,Doctor,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<VisitDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 400)]
    public async Task<ActionResult<ApiResponse<VisitDto>>> CompleteVisit(Guid id, [FromBody] CompleteVisitRequest request)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<VisitDto>.Error("Tenant context not resolved"));

        var result = await _visitService.CompleteVisitAsync(_tenantContext.TenantId, id, request, GetCurrentUserId());
        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    /// <summary>
    /// Get visit by ID with prescriptions, labs, and invoice
    /// </summary>
    [HttpGet("{id:guid}")]
    [Authorize(Roles = "ClinicOwner,Doctor,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<VisitDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 404)]
    public async Task<ActionResult<ApiResponse<VisitDto>>> GetVisit(Guid id)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<VisitDto>.Error("Tenant context not resolved"));

        var result = await _visitService.GetVisitByIdAsync(_tenantContext.TenantId, id, GetCurrentUserId());
        if (!result.Success)
            return NotFound(result);

        return Ok(result);
    }

    /// <summary>
    /// Get patient visit history (paginated)
    /// </summary>
    [HttpGet("~/api/clinic/patients/{patientId:guid}/visits")]
    [Authorize(Roles = "ClinicOwner,Doctor,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<VisitDto>>), 200)]
    public async Task<ActionResult<ApiResponse<PagedResult<VisitDto>>>> GetPatientVisits(Guid patientId,
        [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<PagedResult<VisitDto>>.Error("Tenant context not resolved"));

        var result = await _visitService.GetPatientVisitsAsync(_tenantContext.TenantId, patientId, GetCurrentUserId(), pageNumber, pageSize);
        return Ok(result);
    }

    /// <summary>
    /// Get patient summary (info + last 5 visits)
    /// </summary>
    [HttpGet("~/api/clinic/patients/{patientId:guid}/summary")]
    [Authorize(Roles = "ClinicOwner,Doctor,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<PatientSummaryDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 404)]
    public async Task<ActionResult<ApiResponse<PatientSummaryDto>>> GetPatientSummary(Guid patientId)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<PatientSummaryDto>.Error("Tenant context not resolved"));

        var result = await _visitService.GetPatientSummaryAsync(_tenantContext.TenantId, patientId, GetCurrentUserId());
        if (!result.Success)
            return NotFound(result);

        return Ok(result);
    }

    /// <summary>
    /// Doctor self endpoint: today's visits for the authenticated doctor.
    /// </summary>
    [HttpGet("my/today")]
    [Authorize(Roles = "Doctor,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<List<VisitDto>>), 200)]
    public async Task<ActionResult<ApiResponse<List<VisitDto>>>> GetMyTodayVisits()
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<List<VisitDto>>.Error("Tenant context not resolved"));

        var result = await _visitService.GetMyTodayVisitsAsync(_tenantContext.TenantId, GetCurrentUserId());
        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    /// <summary>
    /// Doctor self endpoint: paginated list of own patients.
    /// </summary>
    [HttpGet("my/patients")]
    [Authorize(Roles = "Doctor,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<PatientDto>>), 200)]
    public async Task<ActionResult<ApiResponse<PagedResult<PatientDto>>>> GetMyPatients(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<PagedResult<PatientDto>>.Error("Tenant context not resolved"));

        var result = await _visitService.GetMyPatientsAsync(_tenantContext.TenantId, GetCurrentUserId(), pageNumber, pageSize, search);
        return Ok(result);
    }

    /// <summary>
    /// List stale open visits for maintenance visibility.
    /// </summary>
    [HttpGet("maintenance/stale-open")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<List<StaleOpenVisitDto>>), 200)]
    public async Task<ActionResult<ApiResponse<List<StaleOpenVisitDto>>>> GetStaleOpenVisits([FromQuery] int olderThanHours = 12)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<List<StaleOpenVisitDto>>.Error("Tenant context not resolved"));

        var result = await _visitService.GetStaleOpenVisitsAsync(_tenantContext.TenantId, olderThanHours);
        return Ok(result);
    }

    /// <summary>
    /// Close a stale open visit safely and optionally mark queue ticket as no-show.
    /// </summary>
    [HttpPost("maintenance/{id:guid}/close")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<VisitDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 400)]
    public async Task<ActionResult<ApiResponse<VisitDto>>> CloseStaleVisit(Guid id, [FromBody] CloseStaleVisitRequest? request)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<VisitDto>.Error("Tenant context not resolved"));

        var payload = request ?? new CloseStaleVisitRequest();
        var result = await _visitService.CloseStaleVisitAsync(_tenantContext.TenantId, id, payload);
        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }
}
