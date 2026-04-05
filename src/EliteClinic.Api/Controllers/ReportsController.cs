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
[Route("api/clinic/reports")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly IReportsService _reportsService;
    private readonly ITenantContext _tenantContext;

    public ReportsController(IReportsService reportsService, ITenantContext tenantContext)
    {
        _reportsService = reportsService;
        _tenantContext = tenantContext;
    }

    private Guid GetCurrentUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    [HttpGet("overview")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<ClinicOverviewReportDto>), 200)]
    public async Task<ActionResult<ApiResponse<ClinicOverviewReportDto>>> GetOverview(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] Guid? doctorId,
        [FromQuery] VisitType? visitType,
        [FromQuery] VisitSource? source)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<ClinicOverviewReportDto>.Error("Tenant context not resolved"));

        var fromDate = from?.Date ?? DateTime.UtcNow.Date;
        var toDate = to?.Date ?? DateTime.UtcNow.Date;

        var result = await _reportsService.GetClinicOverviewAsync(
            _tenantContext.TenantId,
            fromDate,
            toDate,
            doctorId,
            visitType,
            source);

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    [HttpGet("services")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<ServicesSalesReportDto>), 200)]
    public async Task<ActionResult<ApiResponse<ServicesSalesReportDto>>> GetServicesSales(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] Guid? doctorId,
        [FromQuery] VisitType? visitType,
        [FromQuery] VisitSource? source)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<ServicesSalesReportDto>.Error("Tenant context not resolved"));

        var fromDate = from?.Date ?? DateTime.UtcNow.Date;
        var toDate = to?.Date ?? DateTime.UtcNow.Date;

        var result = await _reportsService.GetServicesSalesAsync(
            _tenantContext.TenantId,
            fromDate,
            toDate,
            doctorId,
            visitType,
            source);

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    [HttpGet("my-overview")]
    [Authorize(Roles = "Doctor,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<ClinicOverviewReportDto>), 200)]
    public async Task<ActionResult<ApiResponse<ClinicOverviewReportDto>>> GetMyOverview(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] VisitType? visitType,
        [FromQuery] VisitSource? source)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<ClinicOverviewReportDto>.Error("Tenant context not resolved"));

        var fromDate = from?.Date ?? DateTime.UtcNow.Date;
        var toDate = to?.Date ?? DateTime.UtcNow.Date;

        var result = await _reportsService.GetDoctorOwnOverviewAsync(
            _tenantContext.TenantId,
            GetCurrentUserId(),
            fromDate,
            toDate,
            visitType,
            source);

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }
}
