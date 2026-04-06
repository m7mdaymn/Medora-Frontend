using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;
using EliteClinic.Application.Features.Clinic.Services;
using EliteClinic.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EliteClinic.Api.Controllers;

[ApiController]
[Route("api/clinic/settings")]
[Authorize]
public class ClinicSettingsController : ControllerBase
{
    private readonly IClinicSettingsService _settingsService;
    private readonly ITenantContext _tenantContext;
    private readonly ILogger<ClinicSettingsController> _logger;

    public ClinicSettingsController(
        IClinicSettingsService settingsService,
        ITenantContext tenantContext,
        ILogger<ClinicSettingsController> logger)
    {
        _settingsService = settingsService;
        _tenantContext = tenantContext;
        _logger = logger;
    }

    /// <summary>
    /// Get clinic settings for current tenant
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<ClinicSettingsDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 404)]
    public async Task<ActionResult<ApiResponse<ClinicSettingsDto>>> GetSettings()
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<ClinicSettingsDto>.Error("Tenant context not resolved"));

        var result = await _settingsService.GetSettingsAsync(_tenantContext.TenantId);
        if (!result.Success)
            return NotFound(result);

        return Ok(result);
    }

    /// <summary>
    /// Update clinic settings (ClinicOwner only)
    /// </summary>
    [HttpPut]
    [Authorize(Roles = "ClinicOwner,ClinicManager,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<ClinicSettingsDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 400)]
    [ProducesResponseType(typeof(ApiResponse), 404)]
    public async Task<ActionResult<ApiResponse<ClinicSettingsDto>>> UpdateSettings([FromBody] UpdateClinicSettingsRequest request)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<ClinicSettingsDto>.Error("Tenant context not resolved"));

        var result = await _settingsService.UpdateSettingsAsync(_tenantContext.TenantId, request);
        if (!result.Success)
        {
            if (result.Message.Contains("not found"))
                return NotFound(result);
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Partially update clinic settings (PATCH — only provided fields are changed)
    /// </summary>
    [HttpPatch]
    [Authorize(Roles = "ClinicOwner,ClinicManager,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<ClinicSettingsDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 400)]
    [ProducesResponseType(typeof(ApiResponse), 404)]
    public async Task<ActionResult<ApiResponse<ClinicSettingsDto>>> PatchSettings([FromBody] PatchClinicSettingsRequest request)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<ClinicSettingsDto>.Error("Tenant context not resolved"));

        var result = await _settingsService.PatchSettingsAsync(_tenantContext.TenantId, request);
        if (!result.Success)
        {
            if (result.Message.Contains("not found"))
                return NotFound(result);
            return BadRequest(result);
        }

        return Ok(result);
    }

    [HttpGet("payment-options")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,Receptionist,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<ClinicPaymentOptionsDto>), 200)]
    public async Task<ActionResult<ApiResponse<ClinicPaymentOptionsDto>>> GetPaymentOptions(
        [FromQuery] bool activeOnly = false,
        [FromQuery] Guid? branchId = null)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<ClinicPaymentOptionsDto>.Error("Tenant context not resolved"));

        var result = await _settingsService.GetPaymentOptionsAsync(_tenantContext.TenantId, activeOnly, branchId);
        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    [HttpPut("payment-methods")]
    [Authorize(Roles = "ClinicOwner,ClinicManager,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<List<ClinicPaymentMethodDto>>), 200)]
    [ProducesResponseType(typeof(ApiResponse), 400)]
    public async Task<ActionResult<ApiResponse<List<ClinicPaymentMethodDto>>>> ReplacePaymentMethods(
        [FromBody] UpdateClinicPaymentMethodsRequest request)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<List<ClinicPaymentMethodDto>>.Error("Tenant context not resolved"));

        var result = await _settingsService.ReplacePaymentMethodsAsync(_tenantContext.TenantId, request);
        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }
}
