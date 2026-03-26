using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;
using EliteClinic.Application.Features.Clinic.Services;
using EliteClinic.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EliteClinic.Api.Controllers;

[ApiController]
[Route("api/clinic/doctors")]
[Authorize]
public class DoctorsController : ControllerBase
{
    private readonly IDoctorService _doctorService;
    private readonly IVisitService _visitService;
    private readonly ITenantContext _tenantContext;
    private readonly ILogger<DoctorsController> _logger;

    public DoctorsController(
        IDoctorService doctorService,
        IVisitService visitService,
        ITenantContext tenantContext,
        ILogger<DoctorsController> logger)
    {
        _doctorService = doctorService;
        _visitService = visitService;
        _tenantContext = tenantContext;
        _logger = logger;
    }

    private Guid GetCurrentUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    /// <summary>
    /// Create a new doctor (ClinicOwner only)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "ClinicOwner,ClinicManager,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<DoctorDto>), 201)]
    [ProducesResponseType(typeof(ApiResponse), 400)]
    public async Task<ActionResult<ApiResponse<DoctorDto>>> CreateDoctor([FromBody] CreateDoctorRequest request)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<DoctorDto>.Error("Tenant context not resolved"));

        var result = await _doctorService.CreateDoctorAsync(_tenantContext.TenantId, request);
        if (!result.Success)
            return BadRequest(result);

        _logger.LogInformation("Doctor created: {Name} for tenant {TenantId}", request.Name, _tenantContext.TenantId);
        return StatusCode(201, result);
    }

    /// <summary>
    /// List all doctors (paginated)
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "ClinicOwner,ClinicManager,Receptionist,Nurse,Doctor,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<DoctorDto>>), 200)]
    public async Task<ActionResult<ApiResponse<PagedResult<DoctorDto>>>> GetAllDoctors(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<PagedResult<DoctorDto>>.Error("Tenant context not resolved"));

        var result = await _doctorService.GetAllDoctorsAsync(_tenantContext.TenantId, pageNumber, pageSize);
        return Ok(result);
    }

    /// <summary>
    /// Doctor self endpoint: get my own doctor profile.
    /// </summary>
    [HttpGet("me")]
    [Authorize(Roles = "Doctor,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<DoctorDto>), 200)]
    public async Task<ActionResult<ApiResponse<DoctorDto>>> GetMyProfile()
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<DoctorDto>.Error("Tenant context not resolved"));

        var result = await _doctorService.GetMyProfileAsync(_tenantContext.TenantId, GetCurrentUserId());
        if (!result.Success)
            return NotFound(result);

        return Ok(result);
    }

    /// <summary>
    /// Get doctor by ID (with services and visit field config)
    /// </summary>
    [HttpGet("{id:guid}")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,Receptionist,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<DoctorDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 404)]
    public async Task<ActionResult<ApiResponse<DoctorDto>>> GetDoctorById(Guid id)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<DoctorDto>.Error("Tenant context not resolved"));

        var result = await _doctorService.GetDoctorByIdAsync(_tenantContext.TenantId, id);
        if (!result.Success)
            return NotFound(result);

        return Ok(result);
    }

    /// <summary>
    /// Update doctor profile (ClinicOwner only)
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<DoctorDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 404)]
    public async Task<ActionResult<ApiResponse<DoctorDto>>> UpdateDoctor(Guid id, [FromBody] UpdateDoctorRequest request)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<DoctorDto>.Error("Tenant context not resolved"));

        var result = await _doctorService.UpdateDoctorAsync(_tenantContext.TenantId, id, request);
        if (!result.Success)
            return NotFound(result);

        return Ok(result);
    }

    /// <summary>
    /// Partially update a doctor (PATCH — only provided fields are changed)
    /// </summary>
    [HttpPatch("{id:guid}")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<DoctorDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 404)]
    public async Task<ActionResult<ApiResponse<DoctorDto>>> PatchDoctor(Guid id, [FromBody] PatchDoctorRequest request)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<DoctorDto>.Error("Tenant context not resolved"));

        var result = await _doctorService.PatchDoctorAsync(_tenantContext.TenantId, id, request);
        if (!result.Success)
            return NotFound(result);

        return Ok(result);
    }

    /// <summary>
    /// Enable doctor (ClinicOwner only)
    /// </summary>
    [HttpPost("{id:guid}/enable")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<DoctorDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 404)]
    public async Task<ActionResult<ApiResponse<DoctorDto>>> EnableDoctor(Guid id)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<DoctorDto>.Error("Tenant context not resolved"));

        var result = await _doctorService.EnableDoctorAsync(_tenantContext.TenantId, id);
        if (!result.Success)
            return NotFound(result);

        return Ok(result);
    }

    /// <summary>
    /// Disable doctor (ClinicOwner only)
    /// </summary>
    [HttpPost("{id:guid}/disable")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<DoctorDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 404)]
    public async Task<ActionResult<ApiResponse<DoctorDto>>> DisableDoctor(Guid id)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<DoctorDto>.Error("Tenant context not resolved"));

        var result = await _doctorService.DisableDoctorAsync(_tenantContext.TenantId, id);
        if (!result.Success)
            return NotFound(result);

        return Ok(result);
    }

    /// <summary>
    /// Update doctor services (replace all)
    /// </summary>
    [HttpPut("{id:guid}/services")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<List<DoctorServiceDto>>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 404)]
    public async Task<ActionResult<ApiResponse<List<DoctorServiceDto>>>> UpdateServices(Guid id, [FromBody] UpdateDoctorServicesRequest request)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<List<DoctorServiceDto>>.Error("Tenant context not resolved"));

        var result = await _doctorService.UpdateServicesAsync(_tenantContext.TenantId, id, request);
        if (!result.Success)
            return NotFound(result);

        return Ok(result);
    }

    /// <summary>
    /// Update doctor visit field configuration
    /// </summary>
    [HttpPut("{id:guid}/visit-fields")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<DoctorVisitFieldConfigDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 404)]
    public async Task<ActionResult<ApiResponse<DoctorVisitFieldConfigDto>>> UpdateVisitFields(Guid id, [FromBody] UpdateVisitFieldsRequest request)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<DoctorVisitFieldConfigDto>.Error("Tenant context not resolved"));

        var result = await _doctorService.UpdateVisitFieldsAsync(_tenantContext.TenantId, id, request);
        if (!result.Success)
            return NotFound(result);

        return Ok(result);
    }

    /// <summary>
    /// Doctor self endpoint: get my own visit field configuration.
    /// </summary>
    [HttpGet("me/visit-fields")]
    [Authorize(Roles = "Doctor,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<DoctorVisitFieldConfigDto>), 200)]
    public async Task<ActionResult<ApiResponse<DoctorVisitFieldConfigDto>>> GetMyVisitFields()
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<DoctorVisitFieldConfigDto>.Error("Tenant context not resolved"));

        var result = await _doctorService.GetMyVisitFieldsAsync(_tenantContext.TenantId, GetCurrentUserId());
        if (!result.Success)
            return NotFound(result);

        return Ok(result);
    }

    /// <summary>
    /// Doctor self endpoint: update my own visit field configuration.
    /// </summary>
    [HttpPut("me/visit-fields")]
    [Authorize(Roles = "Doctor,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<DoctorVisitFieldConfigDto>), 200)]
    public async Task<ActionResult<ApiResponse<DoctorVisitFieldConfigDto>>> UpdateMyVisitFields([FromBody] UpdateVisitFieldsRequest request)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<DoctorVisitFieldConfigDto>.Error("Tenant context not resolved"));

        var result = await _doctorService.UpdateMyVisitFieldsAsync(_tenantContext.TenantId, GetCurrentUserId(), request);
        if (!result.Success)
            return NotFound(result);

        return Ok(result);
    }

    /// <summary>
    /// Doctor self endpoint: my own patient's visit history.
    /// </summary>
    [HttpGet("me/patients/{patientId:guid}/history")]
    [Authorize(Roles = "Doctor,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<VisitDto>>), 200)]
    public async Task<ActionResult<ApiResponse<PagedResult<VisitDto>>>> GetMyPatientHistory(
        Guid patientId,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<PagedResult<VisitDto>>.Error("Tenant context not resolved"));

        var result = await _visitService.GetPatientVisitsAsync(_tenantContext.TenantId, patientId, GetCurrentUserId(), pageNumber, pageSize);
        if (!result.Success)
            return NotFound(result);

        return Ok(result);
    }

    /// <summary>
    /// Doctor self endpoint: my patients.
    /// </summary>
    [HttpGet("me/patients")]
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
}
