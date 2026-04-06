using EliteClinic.Application.Common.Models;
using EliteClinic.Infrastructure.Data;
using EliteClinic.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace EliteClinic.Application.Features.Clinic.Services;

public class BranchAccessService : IBranchAccessService
{
    private readonly EliteClinicDbContext _context;
    private readonly ITenantContext _tenantContext;

    public BranchAccessService(EliteClinicDbContext context, ITenantContext tenantContext)
    {
        _context = context;
        _tenantContext = tenantContext;
    }

    public async Task<HashSet<Guid>?> GetScopedBranchIdsAsync(Guid tenantId, Guid callerUserId, CancellationToken cancellationToken = default)
    {
        var roles = await GetUserRolesAsync(callerUserId, cancellationToken);
        if (roles.Contains("SUPERADMIN") || roles.Contains("CLINICOWNER") || roles.Contains("CLINICMANAGER"))
        {
            var selectedBranchId = GetSelectedBranchId(tenantId);
            if (selectedBranchId.HasValue)
                return new HashSet<Guid> { selectedBranchId.Value };

            return null;
        }

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

            var doctorScope = scheduleBranches
                .Concat(activeSessionBranches)
                .Concat(visitBranches)
                .ToHashSet();

            return ApplySelectedBranchFilter(tenantId, doctorScope);
        }

        var employeeId = await _context.Employees
            .Where(e => e.TenantId == tenantId && !e.IsDeleted && e.UserId == callerUserId && e.IsEnabled)
            .Select(e => (Guid?)e.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (employeeId.HasValue)
        {
            var assignedBranches = await _context.EmployeeBranchAssignments
                .Where(a => a.TenantId == tenantId
                    && !a.IsDeleted
                    && a.EmployeeId == employeeId.Value
                    && a.Branch.IsActive
                    && !a.Branch.IsDeleted)
                .Select(a => a.BranchId)
                .Distinct()
                .ToListAsync(cancellationToken);

            if (assignedBranches.Count > 0)
                return ApplySelectedBranchFilter(tenantId, assignedBranches.ToHashSet());
        }

        var activeBranches = await _context.Branches
            .Where(b => b.TenantId == tenantId && !b.IsDeleted && b.IsActive)
            .Select(b => b.Id)
            .ToListAsync(cancellationToken);

        return ApplySelectedBranchFilter(tenantId, activeBranches.ToHashSet());
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

    private Guid? GetSelectedBranchId(Guid tenantId)
    {
        if (!_tenantContext.IsTenantResolved)
            return null;

        if (_tenantContext.TenantId != tenantId)
            return null;

        return _tenantContext.SelectedBranchId;
    }

    private HashSet<Guid> ApplySelectedBranchFilter(Guid tenantId, HashSet<Guid> scope)
    {
        var selectedBranchId = GetSelectedBranchId(tenantId);
        if (!selectedBranchId.HasValue)
            return scope;

        if (scope.Contains(selectedBranchId.Value))
            return new HashSet<Guid> { selectedBranchId.Value };

        return new HashSet<Guid>();
    }
}
