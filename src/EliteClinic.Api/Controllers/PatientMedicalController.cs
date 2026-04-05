using EliteClinic.Api.Services;
using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;
using EliteClinic.Application.Features.Clinic.Services;
using EliteClinic.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using System.Security.Claims;

namespace EliteClinic.Api.Controllers;

[ApiController]
[Route("api/clinic/patients/{patientId:guid}")]
[Authorize]
public class PatientMedicalController : ControllerBase
{
    private readonly ITenantContext _tenantContext;
    private readonly IPatientMedicalService _patientMedicalService;
    private readonly StorageOptions _storageOptions;
    private readonly IWebHostEnvironment _environment;

    public PatientMedicalController(
        ITenantContext tenantContext,
        IPatientMedicalService patientMedicalService,
        IOptions<StorageOptions> storageOptions,
        IWebHostEnvironment environment)
    {
        _tenantContext = tenantContext;
        _patientMedicalService = patientMedicalService;
        _storageOptions = storageOptions.Value;
        _environment = environment;
    }

    private Guid GetCurrentUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    private bool IsPatientRole() => User.IsInRole("Patient");

    [HttpPost("medical-documents")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,Receptionist,Nurse,Doctor,Patient,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<PatientMedicalDocumentDto>), 201)]
    [ProducesResponseType(typeof(ApiResponse), 400)]
    public async Task<ActionResult<ApiResponse<PatientMedicalDocumentDto>>> UploadDocument(
        Guid patientId,
        [FromForm] IFormFile file,
        [FromForm] UploadPatientMedicalDocumentRequest request,
        CancellationToken cancellationToken)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<PatientMedicalDocumentDto>.Error("Tenant context not resolved"));

        var result = await _patientMedicalService.UploadDocumentAsync(
            _tenantContext.TenantId,
            patientId,
            file,
            request,
            GetCurrentUserId(),
            IsPatientRole(),
            cancellationToken);

        if (!result.Success)
            return BadRequest(result);

        return StatusCode(201, result);
    }

    [HttpGet("medical-documents")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,Receptionist,Nurse,Doctor,Patient,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<List<PatientMedicalDocumentDto>>), 200)]
    public async Task<ActionResult<ApiResponse<List<PatientMedicalDocumentDto>>>> ListDocuments(Guid patientId, CancellationToken cancellationToken)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<List<PatientMedicalDocumentDto>>.Error("Tenant context not resolved"));

        var result = await _patientMedicalService.ListDocumentsAsync(
            _tenantContext.TenantId,
            patientId,
            GetCurrentUserId(),
            IsPatientRole(),
            cancellationToken);

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    [HttpGet("medical-documents/{documentId:guid}")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,Receptionist,Nurse,Doctor,Patient,SuperAdmin")]
    [ProducesResponseType(typeof(FileStreamResult), 200)]
    [ProducesResponseType(typeof(ApiResponse), 404)]
    public async Task<IActionResult> DownloadDocument(Guid patientId, Guid documentId, CancellationToken cancellationToken)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse.Error("Tenant context not resolved"));

        var result = await _patientMedicalService.GetDocumentAccessAsync(
            _tenantContext.TenantId,
            patientId,
            documentId,
            GetCurrentUserId(),
            IsPatientRole(),
            cancellationToken);

        if (!result.Success || result.Data == null)
            return NotFound(ApiResponse.Error(result.Message));

        var fullPath = Path.Combine(_environment.ContentRootPath, _storageOptions.RootPath, result.Data.RelativePath.Replace('/', Path.DirectorySeparatorChar));
        if (!System.IO.File.Exists(fullPath))
            return NotFound(ApiResponse.Error("Document file was not found in storage"));

        var stream = new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read);
        return File(stream, result.Data.ContentType, result.Data.OriginalFileName);
    }

    [HttpGet("medical-documents/{documentId:guid}/threads")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,Receptionist,Nurse,Doctor,Patient,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<List<PatientMedicalDocumentThreadDto>>), 200)]
    [ProducesResponseType(typeof(ApiResponse<List<PatientMedicalDocumentThreadDto>>), 400)]
    public async Task<ActionResult<ApiResponse<List<PatientMedicalDocumentThreadDto>>>> ListDocumentThreads(
        Guid patientId,
        Guid documentId,
        CancellationToken cancellationToken)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<List<PatientMedicalDocumentThreadDto>>.Error("Tenant context not resolved"));

        var result = await _patientMedicalService.ListDocumentThreadsAsync(
            _tenantContext.TenantId,
            patientId,
            documentId,
            GetCurrentUserId(),
            IsPatientRole(),
            cancellationToken);

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    [HttpPost("medical-documents/{documentId:guid}/threads")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,Receptionist,Nurse,Doctor,Patient,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<PatientMedicalDocumentThreadDto>), 201)]
    [ProducesResponseType(typeof(ApiResponse<PatientMedicalDocumentThreadDto>), 400)]
    public async Task<ActionResult<ApiResponse<PatientMedicalDocumentThreadDto>>> CreateDocumentThread(
        Guid patientId,
        Guid documentId,
        [FromBody] CreatePatientMedicalDocumentThreadRequest request,
        CancellationToken cancellationToken)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<PatientMedicalDocumentThreadDto>.Error("Tenant context not resolved"));

        var result = await _patientMedicalService.CreateDocumentThreadAsync(
            _tenantContext.TenantId,
            patientId,
            documentId,
            request,
            GetCurrentUserId(),
            IsPatientRole(),
            cancellationToken);

        if (!result.Success)
            return BadRequest(result);

        return StatusCode(201, result);
    }

    [HttpPost("medical-documents/{documentId:guid}/threads/{threadId:guid}/replies")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,Receptionist,Nurse,Doctor,Patient,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<PatientMedicalDocumentThreadDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse<PatientMedicalDocumentThreadDto>), 400)]
    public async Task<ActionResult<ApiResponse<PatientMedicalDocumentThreadDto>>> AddThreadReply(
        Guid patientId,
        Guid documentId,
        Guid threadId,
        [FromBody] AddPatientMedicalDocumentThreadReplyRequest request,
        CancellationToken cancellationToken)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<PatientMedicalDocumentThreadDto>.Error("Tenant context not resolved"));

        var result = await _patientMedicalService.AddThreadReplyAsync(
            _tenantContext.TenantId,
            patientId,
            documentId,
            threadId,
            request,
            GetCurrentUserId(),
            IsPatientRole(),
            cancellationToken);

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    [HttpPost("medical-documents/{documentId:guid}/threads/{threadId:guid}/close")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,Receptionist,Nurse,Doctor,Patient,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<PatientMedicalDocumentThreadDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse<PatientMedicalDocumentThreadDto>), 400)]
    public async Task<ActionResult<ApiResponse<PatientMedicalDocumentThreadDto>>> CloseThread(
        Guid patientId,
        Guid documentId,
        Guid threadId,
        [FromBody] ClosePatientMedicalDocumentThreadRequest request,
        CancellationToken cancellationToken)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<PatientMedicalDocumentThreadDto>.Error("Tenant context not resolved"));

        var result = await _patientMedicalService.CloseThreadAsync(
            _tenantContext.TenantId,
            patientId,
            documentId,
            threadId,
            request,
            GetCurrentUserId(),
            IsPatientRole(),
            cancellationToken);

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    [HttpGet("chronic-conditions")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,Receptionist,Nurse,Doctor,Patient,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<PatientChronicProfileDto>), 200)]
    public async Task<ActionResult<ApiResponse<PatientChronicProfileDto>>> GetChronicProfile(Guid patientId, CancellationToken cancellationToken)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<PatientChronicProfileDto>.Error("Tenant context not resolved"));

        var result = await _patientMedicalService.GetChronicProfileAsync(
            _tenantContext.TenantId,
            patientId,
            GetCurrentUserId(),
            IsPatientRole(),
            cancellationToken);

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    [HttpPut("chronic-conditions")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,Nurse,Doctor,Patient,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<PatientChronicProfileDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse<PatientChronicProfileDto>), 201)]
    public async Task<ActionResult<ApiResponse<PatientChronicProfileDto>>> UpsertChronicProfile(
        Guid patientId,
        [FromBody] UpsertPatientChronicProfileRequest request,
        CancellationToken cancellationToken)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<PatientChronicProfileDto>.Error("Tenant context not resolved"));

        var result = await _patientMedicalService.UpsertChronicProfileAsync(
            _tenantContext.TenantId,
            patientId,
            request,
            GetCurrentUserId(),
            IsPatientRole(),
            cancellationToken);

        if (!result.Success)
            return BadRequest(result);

        return result.Message.Contains("created", StringComparison.OrdinalIgnoreCase)
            ? StatusCode(201, result)
            : Ok(result);
    }
}
