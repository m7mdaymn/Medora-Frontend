using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EliteClinic.Api.Controllers;

[ApiController]
[Route("api/clinic/patient-credits")]
[Authorize]
public class PatientCreditsController : ControllerBase
{
    public PatientCreditsController()
    {
    }

    [HttpGet("{patientId:guid}/balance")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,Receptionist,Doctor,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<PatientCreditBalanceDto>), 200)]
    public async Task<ActionResult<ApiResponse<PatientCreditBalanceDto>>> GetBalance(Guid patientId, CancellationToken cancellationToken)
    {
        await Task.CompletedTask;
        return StatusCode(410, ApiResponse<PatientCreditBalanceDto>.Error("Patient credits are deprecated. Use direct refund workflow."));
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
        await Task.CompletedTask;
        return StatusCode(410, ApiResponse<PagedResult<PatientCreditTransactionDto>>.Error("Patient credits are deprecated. Use direct refund workflow."));
    }
}
