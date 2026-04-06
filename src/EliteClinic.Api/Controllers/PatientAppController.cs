using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;
using EliteClinic.Application.Features.Clinic.Services;
using EliteClinic.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EliteClinic.Api.Controllers;

[ApiController]
[Route("api/clinic/patient-app")]
[Authorize(Roles = "Patient,SuperAdmin")]
public class PatientAppController : ControllerBase
{
    private readonly ITenantContext _tenantContext;
    private readonly IPatientService _patientService;
    private readonly IVisitService _visitService;
    private readonly IQueueService _queueService;
    private readonly IBookingService _bookingService;
    private readonly IPartnerService _partnerService;
    private readonly IPatientSelfServiceRequestService _selfServiceRequestService;

    public PatientAppController(
        ITenantContext tenantContext,
        IPatientService patientService,
        IVisitService visitService,
        IQueueService queueService,
        IBookingService bookingService,
        IPartnerService partnerService,
        IPatientSelfServiceRequestService selfServiceRequestService)
    {
        _tenantContext = tenantContext;
        _patientService = patientService;
        _visitService = visitService;
        _queueService = queueService;
        _bookingService = bookingService;
        _partnerService = partnerService;
        _selfServiceRequestService = selfServiceRequestService;
    }

    private Guid GetCurrentUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    [HttpGet("profiles/{patientId:guid}")]
    [ProducesResponseType(typeof(ApiResponse<PatientDto>), 200)]
    public async Task<ActionResult<ApiResponse<PatientDto>>> GetProfile(Guid patientId)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<PatientDto>.Error("Tenant context not resolved"));

        var result = await _patientService.GetOwnedProfileAsync(_tenantContext.TenantId, GetCurrentUserId(), patientId);
        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    [HttpGet("profiles/{patientId:guid}/visits")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<VisitDto>>), 200)]
    public async Task<ActionResult<ApiResponse<PagedResult<VisitDto>>>> GetVisits(Guid patientId, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<PagedResult<VisitDto>>.Error("Tenant context not resolved"));

        var result = await _visitService.GetPatientVisitsForOwnedProfileAsync(_tenantContext.TenantId, GetCurrentUserId(), patientId, pageNumber, pageSize);
        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    [HttpGet("profiles/{patientId:guid}/summary")]
    [ProducesResponseType(typeof(ApiResponse<PatientSummaryDto>), 200)]
    public async Task<ActionResult<ApiResponse<PatientSummaryDto>>> GetSummary(Guid patientId)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<PatientSummaryDto>.Error("Tenant context not resolved"));

        var result = await _visitService.GetPatientSummaryForOwnedProfileAsync(_tenantContext.TenantId, GetCurrentUserId(), patientId);
        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    [HttpGet("profiles/{patientId:guid}/queue-ticket")]
    [ProducesResponseType(typeof(ApiResponse<QueueTicketDto>), 200)]
    public async Task<ActionResult<ApiResponse<QueueTicketDto>>> GetQueueTicket(Guid patientId)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<QueueTicketDto>.Error("Tenant context not resolved"));

        var result = await _queueService.GetTicketForOwnedProfileAsync(_tenantContext.TenantId, GetCurrentUserId(), patientId);
        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    [HttpGet("profiles/{patientId:guid}/bookings")]
    [ProducesResponseType(typeof(ApiResponse<List<BookingDto>>), 200)]
    public async Task<ActionResult<ApiResponse<List<BookingDto>>>> GetBookings(Guid patientId)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<List<BookingDto>>.Error("Tenant context not resolved"));

        var result = await _bookingService.GetBookingsForOwnedProfileAsync(_tenantContext.TenantId, GetCurrentUserId(), patientId);
        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    [HttpGet("profiles/{patientId:guid}/partner-orders")]
    [ProducesResponseType(typeof(ApiResponse<List<PatientPartnerOrderTimelineDto>>), 200)]
    public async Task<ActionResult<ApiResponse<List<PatientPartnerOrderTimelineDto>>>> GetPartnerOrders(Guid patientId)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<List<PatientPartnerOrderTimelineDto>>.Error("Tenant context not resolved"));

        var result = await _partnerService.GetPatientTimelineAsync(_tenantContext.TenantId, GetCurrentUserId(), patientId);
        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    [HttpPost("profiles/{patientId:guid}/partner-orders/{orderId:guid}/arrived")]
    [ProducesResponseType(typeof(ApiResponse<PartnerOrderDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse<PartnerOrderDto>), 400)]
    public async Task<ActionResult<ApiResponse<PartnerOrderDto>>> ConfirmPartnerOrderArrival(
        Guid patientId,
        Guid orderId,
        [FromBody] MarkPartnerOrderArrivedRequest? request = null)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<PartnerOrderDto>.Error("Tenant context not resolved"));

        var payload = request ?? new MarkPartnerOrderArrivedRequest();
        var result = await _partnerService.MarkPatientArrivedFromPatientAppAsync(
            _tenantContext.TenantId,
            GetCurrentUserId(),
            patientId,
            orderId,
            payload);

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    [HttpPost("profiles/{patientId:guid}/partner-orders/{orderId:guid}/comment")]
    [ProducesResponseType(typeof(ApiResponse<PartnerOrderDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse<PartnerOrderDto>), 400)]
    public async Task<ActionResult<ApiResponse<PartnerOrderDto>>> AddPartnerOrderComment(
        Guid patientId,
        Guid orderId,
        [FromBody] AddPartnerOrderCommentRequest? request = null)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<PartnerOrderDto>.Error("Tenant context not resolved"));

        var payload = request ?? new AddPartnerOrderCommentRequest();
        var result = await _partnerService.AddOrderCommentFromPatientAppAsync(
            _tenantContext.TenantId,
            GetCurrentUserId(),
            patientId,
            orderId,
            payload);

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    [HttpGet("profiles/{patientId:guid}/self-service-requests")]
    [ProducesResponseType(typeof(ApiResponse<List<PatientSelfServiceRequestListItemDto>>), 200)]
    public async Task<ActionResult<ApiResponse<List<PatientSelfServiceRequestListItemDto>>>> GetSelfServiceRequests(Guid patientId, CancellationToken cancellationToken)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<List<PatientSelfServiceRequestListItemDto>>.Error("Tenant context not resolved"));

        var result = await _selfServiceRequestService.ListOwnedAsync(
            _tenantContext.TenantId,
            GetCurrentUserId(),
            patientId,
            cancellationToken);

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    [HttpGet("profiles/{patientId:guid}/self-service-requests/{requestId:guid}")]
    [ProducesResponseType(typeof(ApiResponse<PatientSelfServiceRequestDto>), 200)]
    public async Task<ActionResult<ApiResponse<PatientSelfServiceRequestDto>>> GetSelfServiceRequestById(
        Guid patientId,
        Guid requestId,
        CancellationToken cancellationToken)
    {
        _ = patientId;

        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<PatientSelfServiceRequestDto>.Error("Tenant context not resolved"));

        var result = await _selfServiceRequestService.GetOwnedByIdAsync(
            _tenantContext.TenantId,
            GetCurrentUserId(),
            requestId,
            cancellationToken);

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    [HttpPost("profiles/{patientId:guid}/self-service-requests")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(ApiResponse<PatientSelfServiceRequestDto>), 201)]
    [ProducesResponseType(typeof(ApiResponse<PatientSelfServiceRequestDto>), 400)]
    public async Task<ActionResult<ApiResponse<PatientSelfServiceRequestDto>>> CreateSelfServiceRequest(
        Guid patientId,
        [FromForm] CreatePatientSelfServiceRequest request,
        [FromForm] IFormFile? paymentProof,
        [FromForm] List<IFormFile>? supportingDocuments,
        CancellationToken cancellationToken)
    {
        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<PatientSelfServiceRequestDto>.Error("Tenant context not resolved"));

        if (paymentProof == null)
            return BadRequest(ApiResponse<PatientSelfServiceRequestDto>.Error("Payment proof screenshot is required"));

        request.PatientId = patientId;

        var result = await _selfServiceRequestService.CreateAsync(
            _tenantContext.TenantId,
            GetCurrentUserId(),
            request,
            paymentProof,
            supportingDocuments,
            cancellationToken);

        if (!result.Success)
            return BadRequest(result);

        return StatusCode(201, result);
    }

    [HttpPost("profiles/{patientId:guid}/self-service-requests/{requestId:guid}/payment-proof/reupload")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(ApiResponse<PatientSelfServiceRequestDto>), 200)]
    [ProducesResponseType(typeof(ApiResponse<PatientSelfServiceRequestDto>), 400)]
    public async Task<ActionResult<ApiResponse<PatientSelfServiceRequestDto>>> ReuploadSelfServicePaymentProof(
        Guid patientId,
        Guid requestId,
        [FromForm] IFormFile? paymentProof,
        CancellationToken cancellationToken)
    {
        _ = patientId;

        if (!_tenantContext.IsTenantResolved)
            return BadRequest(ApiResponse<PatientSelfServiceRequestDto>.Error("Tenant context not resolved"));

        if (paymentProof == null)
            return BadRequest(ApiResponse<PatientSelfServiceRequestDto>.Error("Payment proof screenshot is required"));

        var result = await _selfServiceRequestService.ReuploadPaymentProofAsync(
            _tenantContext.TenantId,
            GetCurrentUserId(),
            requestId,
            paymentProof,
            cancellationToken);

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }
}
