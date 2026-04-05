using EliteClinic.Application.Common.Models;
using EliteClinic.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EliteClinic.Application.Features.Clinic.Services;

public class BranchAccessService : IBranchAccessService
{
    private readonly EliteClinicDbContext _context;

    public BranchAccessService(EliteClinicDbContext context)
    {
        _context = context;
    }

    public async Task<HashSet<Guid>?> GetScopedBranchIdsAsync(Guid tenantId, Guid callerUserId, CancellationToken cancellationToken = default)
    {
        var roles = await GetUserRolesAsync(callerUserId, cancellationToken);
        if (roles.Contains("SUPERADMIN") || roles.Contains("CLINICOWNER") || roles.Contains("CLINICMANAGER"))
            return null;

        if (roles.Contains("DOCTOR"))
        {
            var doctorId = await _context.Doctors
                .Where(d => d.TenantId == tenantId && !d.IsDeleted && d.UserId == callerUserId)
                .Select(d => (Guid?)d.Id)
                .FirstOrDefaultAsync(cancellationToken);

            if (!doctorId.HasValue)
                return new HashSet<Guid>();

            var scheduleBranches = await _context.DoctorBranchSchedules
                .Where(s => s.TenantId == tenantId && !s.IsDeleted && s.IsActive && s.DoctorId == doctorId.Value)
                .Select(s => s.BranchId)
                .Distinct()
                .ToListAsync(cancellationToken);

            var activeSessionBranches = await _context.QueueSessions
                .Where(s => s.TenantId == tenantId && !s.IsDeleted && s.IsActive && s.DoctorId == doctorId.Value && s.BranchId.HasValue)
                .Select(s => s.BranchId!.Value)
                .Distinct()
                .ToListAsync(cancellationToken);

            var visitBranches = await _context.Visits
                .Where(v => v.TenantId == tenantId && !v.IsDeleted && v.DoctorId == doctorId.Value && v.BranchId.HasValue)
                .Select(v => v.BranchId!.Value)
                .Distinct()
                .ToListAsync(cancellationToken);

            return scheduleBranches
                .Concat(activeSessionBranches)
                .Concat(visitBranches)
                .ToHashSet();
        }

        var activeBranches = await _context.Branches
            .Where(b => b.TenantId == tenantId && !b.IsDeleted && b.IsActive)
            .Select(b => b.Id)
            .ToListAsync(cancellationToken);

        return activeBranches.ToHashSet();
    }

    public async Task<ApiResponse> EnsureCanAccessBranchAsync(Guid tenantId, Guid callerUserId, Guid branchId, CancellationToken cancellationToken = default)
    {
        var exists = await _context.Branches
            .AnyAsync(b => b.TenantId == tenantId && !b.IsDeleted && b.IsActive && b.Id == branchId, cancellationToken);

        if (!exists)
            return ApiResponse.Error("Branch not found or inactive");

        var scope = await GetScopedBranchIdsAsync(tenantId, callerUserId, cancellationToken);
        if (scope == null)
            return ApiResponse.Ok();

        if (!scope.Contains(branchId))
            return ApiResponse.Error("Access denied for requested branch");

        return ApiResponse.Ok();
    }

    private async Task<HashSet<string>> GetUserRolesAsync(Guid userId, CancellationToken cancellationToken)
    {
        var roles = await (from ur in _context.UserRoles
                           join r in _context.Roles on ur.RoleId equals r.Id
                           where ur.UserId == userId
                           select r.NormalizedName)
            .ToListAsync(cancellationToken);

        return roles.Where(r => !string.IsNullOrWhiteSpace(r)).Select(r => r!).ToHashSet();
    }
}
