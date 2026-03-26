using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;
using EliteClinic.Application.Features.Clinic.Services;
using EliteClinic.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EliteClinic.Api.Controllers;

[ApiController]
[Route("api/clinic/workforce")]
[Authorize]
public class WorkforceController : ControllerBase
{
    private readonly ITenantContext _tenantContext;
    private readonly IWorkforceService _workforceService;

    public WorkforceController(ITenantContext tenantContext, IWorkforceService workforceService)
    {
        _tenantContext = tenantContext;
        _workforceService = workforceService;
    }

    private Guid GetCurrentUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    [HttpPost("doctors/{doctorId:guid}/compensation-rules")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<DoctorCompensationRuleDto>), 201)]
    [ProducesResponseType(typeof(ApiResponse), 400)]
    public async Task<ActionResult<ApiResponse<DoctorCompensationRuleDto>>> CreateCompensationRule(Guid doctorId, [FromBody] CreateDoctorCompensationRuleRequest request, CancellationToken cancellationToken)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<DoctorCompensationRuleDto>.Error("Tenant context not resolved"));

        var result = await _workforceService.CreateDoctorCompensationRuleAsync(_tenantContext.TenantId, doctorId, request, cancellationToken);
        if (!result.Success)
            return BadRequest(result);

        return StatusCode(201, result);
    }

    [HttpGet("doctors/{doctorId:guid}/compensation-rules")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<List<DoctorCompensationRuleDto>>), 200)]
    public async Task<ActionResult<ApiResponse<List<DoctorCompensationRuleDto>>>> ListCompensationRules(Guid doctorId, CancellationToken cancellationToken)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<List<DoctorCompensationRuleDto>>.Error("Tenant context not resolved"));

        var result = await _workforceService.ListDoctorCompensationRulesAsync(_tenantContext.TenantId, doctorId, cancellationToken);
        return Ok(result);
    }

    [HttpPost("attendance")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,Receptionist,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<AttendanceRecordDto>), 201)]
    [ProducesResponseType(typeof(ApiResponse), 400)]
    public async Task<ActionResult<ApiResponse<AttendanceRecordDto>>> CreateAttendance([FromBody] CreateAttendanceRecordRequest request, CancellationToken cancellationToken)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<AttendanceRecordDto>.Error("Tenant context not resolved"));

        var result = await _workforceService.CreateAttendanceRecordAsync(_tenantContext.TenantId, request, cancellationToken);
        if (!result.Success)
            return BadRequest(result);

        return StatusCode(201, result);
    }

    [HttpPut("attendance/{attendanceId:guid}/checkout")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,Receptionist,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<AttendanceRecordDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 400)]
    public async Task<ActionResult<ApiResponse<AttendanceRecordDto>>> CheckOutAttendance(Guid attendanceId, [FromBody] CheckOutAttendanceRequest request, CancellationToken cancellationToken)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<AttendanceRecordDto>.Error("Tenant context not resolved"));

        var result = await _workforceService.CheckOutAttendanceAsync(_tenantContext.TenantId, attendanceId, request, cancellationToken);
        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    [HttpGet("attendance")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,Receptionist,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<List<AttendanceRecordDto>>), 200)]
    public async Task<ActionResult<ApiResponse<List<AttendanceRecordDto>>>> ListAttendance(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] Guid? doctorId,
        [FromQuery] Guid? employeeId,
        CancellationToken cancellationToken)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<List<AttendanceRecordDto>>.Error("Tenant context not resolved"));

        var result = await _workforceService.ListAttendanceAsync(_tenantContext.TenantId, from, to, doctorId, employeeId, cancellationToken);
        return Ok(result);
    }

    [HttpPost("salary-payouts")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<SalaryPayoutExpenseDto>), 201)]
    [ProducesResponseType(typeof(ApiResponse), 400)]
    public async Task<ActionResult<ApiResponse<SalaryPayoutExpenseDto>>> CreateSalaryPayout([FromBody] CreateSalaryPayoutRequest request, CancellationToken cancellationToken)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<SalaryPayoutExpenseDto>.Error("Tenant context not resolved"));

        var result = await _workforceService.CreateSalaryPayoutAsync(_tenantContext.TenantId, GetCurrentUserId(), request, cancellationToken);
        if (!result.Success)
            return BadRequest(result);

        return StatusCode(201, result);
    }

    [HttpPost("daily-closing/generate")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<DailyClosingSnapshotDto>), 201)]
    [ProducesResponseType(typeof(ApiResponse), 400)]
    public async Task<ActionResult<ApiResponse<DailyClosingSnapshotDto>>> GenerateDailyClosing([FromQuery] DateTime? date, CancellationToken cancellationToken)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<DailyClosingSnapshotDto>.Error("Tenant context not resolved"));

        var result = await _workforceService.GenerateDailyClosingSnapshotAsync(
            _tenantContext.TenantId,
            GetCurrentUserId(),
            date ?? DateTime.UtcNow.Date,
            cancellationToken);

        if (!result.Success)
            return BadRequest(result);

        return result.Message.Contains("generated", StringComparison.OrdinalIgnoreCase)
            ? StatusCode(201, result)
            : Ok(result);
    }

    [HttpGet("daily-closing")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<List<DailyClosingSnapshotDto>>), 200)]
    public async Task<ActionResult<ApiResponse<List<DailyClosingSnapshotDto>>>> GetDailyClosingSnapshots(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        CancellationToken cancellationToken)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<List<DailyClosingSnapshotDto>>.Error("Tenant context not resolved"));

        var result = await _workforceService.GetDailyClosingSnapshotsAsync(_tenantContext.TenantId, from, to, cancellationToken);
        return Ok(result);
    }
}
