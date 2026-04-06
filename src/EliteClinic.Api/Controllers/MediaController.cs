using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;
using EliteClinic.Application.Features.Clinic.Services;
using EliteClinic.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EliteClinic.Api.Controllers;

[ApiController]
[Route("api/clinic/media")]
[Authorize]
public class MediaController : ControllerBase
{
    private readonly IMediaService _mediaService;
    private readonly ITenantContext _tenantContext;

    public MediaController(IMediaService mediaService, ITenantContext tenantContext)
    {
        _mediaService = mediaService;
        _tenantContext = tenantContext;
    }

    [HttpPost("clinic-logo")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<MediaFileDto>), 201)]
    public async Task<ActionResult<ApiResponse<MediaFileDto>>> UploadClinicLogo([FromForm] IFormFile file, CancellationToken cancellationToken)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<MediaFileDto>.Error("Tenant context not resolved"));

        var result = await _mediaService.UploadClinicLogoAsync(_tenantContext.TenantId, file, cancellationToken);
        if (!result.Success)
            return BadRequest(result);

        return StatusCode(201, result);
    }

    [HttpPost("clinic-image")]
    [Authorize(Roles = "ClinicOwner,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<MediaFileDto>), 201)]
    public async Task<ActionResult<ApiResponse<MediaFileDto>>> UploadClinicImage([FromForm] IFormFile file, CancellationToken cancellationToken)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<MediaFileDto>.Error("Tenant context not resolved"));

        var result = await _mediaService.UploadClinicImageAsync(_tenantContext.TenantId, file, cancellationToken);
        if (!result.Success)
            return BadRequest(result);

        return StatusCode(201, result);
    }

    [HttpGet("clinic-gallery")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<List<MediaFileDto>>), 200)]
    public async Task<ActionResult<ApiResponse<List<MediaFileDto>>>> GetClinicGallery(CancellationToken cancellationToken)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<List<MediaFileDto>>.Error("Tenant context not resolved"));

        var result = await _mediaService.GetClinicGalleryAsync(_tenantContext.TenantId, cancellationToken);
        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    [HttpPost("clinic-gallery")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<MediaFileDto>), 201)]
    public async Task<ActionResult<ApiResponse<MediaFileDto>>> UploadClinicGalleryImage([FromForm] IFormFile file, CancellationToken cancellationToken)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<MediaFileDto>.Error("Tenant context not resolved"));

        var result = await _mediaService.UploadClinicGalleryImageAsync(_tenantContext.TenantId, file, cancellationToken);
        if (!result.Success)
            return BadRequest(result);

        return StatusCode(201, result);
    }

    [HttpDelete("clinic-gallery/{mediaId:guid}")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse), 200)]
    public async Task<ActionResult<ApiResponse>> DeleteClinicGalleryImage(Guid mediaId, CancellationToken cancellationToken)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse.Error("Tenant context not resolved"));

        var result = await _mediaService.DeleteClinicGalleryImageAsync(_tenantContext.TenantId, mediaId, cancellationToken);
        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    [HttpPost("doctors/{doctorId:guid}/photo")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<MediaFileDto>), 201)]
    public async Task<ActionResult<ApiResponse<MediaFileDto>>> UploadDoctorPhoto(Guid doctorId, [FromForm] IFormFile file, CancellationToken cancellationToken)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<MediaFileDto>.Error("Tenant context not resolved"));

        var result = await _mediaService.UploadDoctorPhotoAsync(_tenantContext.TenantId, doctorId, file, cancellationToken);
        if (!result.Success)
            return BadRequest(result);

        return StatusCode(201, result);
    }
}
