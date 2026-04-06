using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;
using EliteClinic.Application.Features.Clinic.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace EliteClinic.Api.Controllers;

/// <summary>
/// Public SEO endpoints. No auth required.
/// Tenant identified by slug in the URL path.
/// Returns 404 if slug does not match any active clinic.
/// </summary>
[ApiController]
[Route("api/public")]
[EnableRateLimiting("PublicPolicy")]
public class PublicController : ControllerBase
{
    private readonly IPublicService _publicService;
    private readonly IMarketplaceService _marketplaceService;

    public PublicController(IPublicService publicService, IMarketplaceService marketplaceService)
    {
        _publicService = publicService;
        _marketplaceService = marketplaceService;
    }

    /// <summary>
    /// Get enriched landing payload (clinic, featured services/products, available doctors, branches, payment methods)
    /// </summary>
    [HttpGet("{slug}/landing")]
    [ProducesResponseType(typeof(ApiResponse<PublicLandingDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse<PublicLandingDto>), 404)]
    public async Task<ActionResult<ApiResponse<PublicLandingDto>>> GetLanding(string slug)
    {
        var result = await _publicService.GetLandingAsync(slug);
        if (!result.Success)
            return NotFound(result);
        return Ok(result);
    }

    /// <summary>
    /// Get public clinic profile (no auth, always 200)
    /// </summary>
    [HttpGet("{slug}/clinic")]
    [ProducesResponseType(typeof(ApiResponse<PublicClinicDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse<PublicClinicDto>), 404)]
    public async Task<ActionResult<ApiResponse<PublicClinicDto>>> GetClinicProfile(string slug)
    {
        var result = await _publicService.GetClinicProfileAsync(slug);
        if (!result.Success)
            return NotFound(result);
        return Ok(result);
    }

    /// <summary>
    /// Get public list of enabled doctors (no auth, always 200)
    /// </summary>
    [HttpGet("{slug}/doctors")]
    [ProducesResponseType(typeof(ApiResponse<List<PublicDoctorDto>>), 200)]
    [ProducesResponseType(typeof(ApiResponse<List<PublicDoctorDto>>), 404)]
    public async Task<ActionResult<ApiResponse<List<PublicDoctorDto>>>> GetDoctors(string slug)
    {
        var result = await _publicService.GetDoctorsAsync(slug);
        if (!result.Success)
            return NotFound(result);
        return Ok(result);
    }

    /// <summary>
    /// Get doctors currently available in active sessions (immediate booking)
    /// </summary>
    [HttpGet("{slug}/doctors/available-now")]
    [ProducesResponseType(typeof(ApiResponse<List<PublicDoctorDto>>), 200)]
    [ProducesResponseType(typeof(ApiResponse<List<PublicDoctorDto>>), 404)]
    public async Task<ActionResult<ApiResponse<List<PublicDoctorDto>>>> GetAvailableDoctorsNow(string slug)
    {
        var result = await _publicService.GetAvailableDoctorsNowAsync(slug);
        if (!result.Success)
            return NotFound(result);
        return Ok(result);
    }

    /// <summary>
    /// Get public list of active services (no auth, always 200)
    /// </summary>
    [HttpGet("{slug}/services")]
    [ProducesResponseType(typeof(ApiResponse<List<PublicDoctorServiceDto>>), 200)]
    [ProducesResponseType(typeof(ApiResponse<List<PublicDoctorServiceDto>>), 404)]
    public async Task<ActionResult<ApiResponse<List<PublicDoctorServiceDto>>>> GetServices(string slug)
    {
        var result = await _publicService.GetServicesAsync(slug);
        if (!result.Success)
            return NotFound(result);
        return Ok(result);
    }

    /// <summary>
    /// Get public payment options for patient self-service checkout
    /// </summary>
    [HttpGet("{slug}/payment-options")]
    [ProducesResponseType(typeof(ApiResponse<ClinicPaymentOptionsDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse<ClinicPaymentOptionsDto>), 404)]
    public async Task<ActionResult<ApiResponse<ClinicPaymentOptionsDto>>> GetPaymentOptions(string slug, [FromQuery] Guid? branchId = null)
    {
        var result = await _publicService.GetPaymentOptionsAsync(slug, branchId);
        if (!result.Success)
            return NotFound(result);
        return Ok(result);
    }

    /// <summary>
    /// Public marketplace listing.
    /// </summary>
    [HttpGet("{slug}/marketplace/items")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<PublicMarketplaceItemDto>>), 200)]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<PublicMarketplaceItemDto>>), 404)]
    public async Task<ActionResult<ApiResponse<PagedResult<PublicMarketplaceItemDto>>>> GetMarketplaceItems(
        string slug,
        [FromQuery] PublicMarketplaceItemsQuery query)
    {
        var result = await _marketplaceService.GetPublicItemsAsync(slug, query);
        if (!result.Success)
            return NotFound(result);
        return Ok(result);
    }

    /// <summary>
    /// Public marketplace item detail.
    /// </summary>
    [HttpGet("{slug}/marketplace/items/{itemId:guid}")]
    [ProducesResponseType(typeof(ApiResponse<PublicMarketplaceItemDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse<PublicMarketplaceItemDto>), 404)]
    public async Task<ActionResult<ApiResponse<PublicMarketplaceItemDto>>> GetMarketplaceItemById(string slug, Guid itemId)
    {
        var result = await _marketplaceService.GetPublicItemByIdAsync(slug, itemId);
        if (!result.Success)
            return NotFound(result);
        return Ok(result);
    }

    /// <summary>
    /// Create a public marketplace order and mark WhatsApp redirect state.
    /// </summary>
    [HttpPost("{slug}/marketplace/orders")]
    [ProducesResponseType(typeof(ApiResponse<MarketplaceOrderDto>), 201)]
    [ProducesResponseType(typeof(ApiResponse<MarketplaceOrderDto>), 400)]
    public async Task<ActionResult<ApiResponse<MarketplaceOrderDto>>> CreateMarketplaceOrder(
        string slug,
        [FromBody] CreatePublicMarketplaceOrderRequest request)
    {
        var result = await _marketplaceService.CreatePublicOrderAsync(slug, request);
        if (!result.Success)
            return BadRequest(result);
        return StatusCode(201, result);
    }

    /// <summary>
    /// Get public working hours (no auth, always 200)
    /// </summary>
    [HttpGet("{slug}/working-hours")]
    [ProducesResponseType(typeof(ApiResponse<List<PublicWorkingHourDto>>), 200)]
    [ProducesResponseType(typeof(ApiResponse<List<PublicWorkingHourDto>>), 404)]
    public async Task<ActionResult<ApiResponse<List<PublicWorkingHourDto>>>> GetWorkingHours(string slug)
    {
        var result = await _publicService.GetWorkingHoursAsync(slug);
        if (!result.Success)
            return NotFound(result);
        return Ok(result);
    }
}
