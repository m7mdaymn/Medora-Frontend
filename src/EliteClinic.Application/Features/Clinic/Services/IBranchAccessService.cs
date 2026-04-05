using EliteClinic.Application.Common.Models;

namespace EliteClinic.Application.Features.Clinic.Services;

public interface IBranchAccessService
{
    Task<HashSet<Guid>?> GetScopedBranchIdsAsync(Guid tenantId, Guid callerUserId, CancellationToken cancellationToken = default);
    Task<ApiResponse> EnsureCanAccessBranchAsync(Guid tenantId, Guid callerUserId, Guid branchId, CancellationToken cancellationToken = default);
}
