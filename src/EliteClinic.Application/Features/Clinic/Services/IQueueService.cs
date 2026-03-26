using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;

namespace EliteClinic.Application.Features.Clinic.Services;

public interface IQueueService
{
    // Sessions
    Task<ApiResponse<QueueSessionDto>> OpenSessionAsync(Guid tenantId, CreateQueueSessionRequest request, Guid callerUserId);
    Task<ApiResponse<QueueSessionDto>> CloseSessionAsync(Guid tenantId, Guid sessionId, Guid callerUserId, bool forceClose = false);
    Task<ApiResponse<int>> CloseAllSessionsForDateAsync(Guid tenantId, DateTime date);
    Task<ApiResponse<PagedResult<QueueSessionDto>>> GetSessionsAsync(Guid tenantId, int pageNumber = 1, int pageSize = 10);
    Task<ApiResponse<QueueSessionDto>> GetSessionByIdAsync(Guid tenantId, Guid sessionId, Guid callerUserId);

    // Tickets
    Task<ApiResponse<QueueTicketDto>> IssueTicketAsync(Guid tenantId, CreateQueueTicketRequest request);
    Task<ApiResponse<QueueTicketDto>> IssueTicketWithPaymentAsync(Guid tenantId, CreateQueueTicketWithPaymentRequest request);
    Task<ApiResponse<QueueTicketDto>> CallTicketAsync(Guid tenantId, Guid ticketId, Guid callerUserId);
    Task<ApiResponse<StartVisitResultDto>> StartVisitFromTicketAsync(Guid tenantId, Guid ticketId, Guid callerUserId);
    Task<ApiResponse<QueueTicketDto>> FinishTicketAsync(Guid tenantId, Guid ticketId, Guid callerUserId);
    Task<ApiResponse<QueueTicketDto>> SkipTicketAsync(Guid tenantId, Guid ticketId, Guid callerUserId);
    Task<ApiResponse<QueueTicketDto>> CancelTicketAsync(Guid tenantId, Guid ticketId, Guid callerUserId);
    Task<ApiResponse<QueueTicketDto>> MarkUrgentAsync(Guid tenantId, Guid ticketId, Guid callerUserId);
    Task<ApiResponse<List<QueueTicketDto>>> GetTicketsBySessionAsync(Guid tenantId, Guid sessionId, Guid callerUserId);

    // Views
    Task<ApiResponse<QueueBoardDto>> GetBoardAsync(Guid tenantId);
    Task<ApiResponse<QueueBoardSessionDto>> GetMyQueueAsync(Guid tenantId, Guid doctorUserId);
    Task<ApiResponse<QueueTicketDto>> GetMyTicketAsync(Guid tenantId, Guid patientUserId);
    Task<ApiResponse<QueueTicketDto>> GetTicketForOwnedProfileAsync(Guid tenantId, Guid patientUserId, Guid patientId);
}
