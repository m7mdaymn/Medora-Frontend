using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;
using EliteClinic.Application.Features.Clinic.Services;
using EliteClinic.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EliteClinic.Api.Controllers;

[ApiController]
[Route("api/clinic/patient-credits")]
[Authorize]
public class PatientCreditsController : ControllerBase
{
    private readonly IPatientCreditService _patientCreditService;
    private readonly ITenantContext _tenantContext;

    public PatientCreditsController(IPatientCreditService patientCreditService, ITenantContext tenantContext)
    {
        _patientCreditService = patientCreditService;
        _tenantContext = tenantContext;
    }

    [HttpGet("{patientId:guid}/balance")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,Receptionist,Doctor,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<PatientCreditBalanceDto>), 200)]
    public async Task<ActionResult<ApiResponse<PatientCreditBalanceDto>>> GetBalance(Guid patientId, CancellationToken cancellationToken)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<PatientCreditBalanceDto>.Error("Tenant context not resolved"));

        var result = await _patientCreditService.GetBalanceAsync(_tenantContext.TenantId, patientId, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{patientId:guid}/history")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,Receptionist,Doctor,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<PatientCreditTransactionDto>>), 200)]
    public async Task<ActionResult<ApiResponse<PagedResult<PatientCreditTransactionDto>>>> GetHistory(
        Guid patientId,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<PagedResult<PatientCreditTransactionDto>>.Error("Tenant context not resolved"));

        var result = await _patientCreditService.GetHistoryAsync(_tenantContext.TenantId, patientId, pageNumber, pageSize, cancellationToken);
        return Ok(result);
    }
}
