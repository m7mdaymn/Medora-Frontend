using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;
using EliteClinic.Domain.Entities;
using EliteClinic.Domain.Enums;
using EliteClinic.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace EliteClinic.Application.Features.Clinic.Services;

public class StaffService : IStaffService
{
    private readonly EliteClinicDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;

    public StaffService(EliteClinicDbContext context, UserManager<ApplicationUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    public async Task<ApiResponse<StaffDto>> CreateStaffAsync(Guid tenantId, CreateStaffRequest request)
    {
        if (request.WorkerMode == WorkerMode.PayrollOnly)
            return ApiResponse<StaffDto>.Error("Use payroll-only worker creation flow for WorkerMode=PayrollOnly");

        // Check username uniqueness
        var existingUser = await _userManager.FindByNameAsync(request.Username);
        if (existingUser != null)
        {
            return ApiResponse<StaffDto>.ValidationError(
                new List<object> { new { field = "Username", message = "Username already taken" } });
        }

        // Create ApplicationUser
        var user = new ApplicationUser(request.Username, request.Name)
        {
            TenantId = tenantId,
            IsActive = true
        };

        var createResult = await _userManager.CreateAsync(user, request.Password);
        if (!createResult.Succeeded)
        {
            var errors = createResult.Errors.Select(e => (object)new { field = "Password", message = e.Description }).ToList();
            return ApiResponse<StaffDto>.ValidationError(errors, "Failed to create user account");
        }

        // Determine role (default to ClinicManager)
        var validRoles = new[] { "ClinicManager", "BranchManager", "Receptionist", "Nurse", "Worker" };
        var role = !string.IsNullOrWhiteSpace(request.Role) && validRoles.Contains(request.Role, StringComparer.OrdinalIgnoreCase)
            ? request.Role
            : "ClinicManager";

        await _userManager.AddToRoleAsync(user, role);

        // Create Employee entity
        var employee = new Employee
        {
            TenantId = tenantId,
            UserId = user.Id,
            Name = request.Name,
            Phone = request.Phone,
            Role = role,
            WorkerMode = WorkerMode.LoginBased,
            Salary = request.Salary,
            HireDate = request.HireDate,
            Notes = request.Notes,
            IsEnabled = true
        };

        _context.Employees.Add(employee);
        await _context.SaveChangesAsync();

        var branchIds = await ResolveBranchIdsWithFallbackAsync(tenantId, request.BranchIds);
        await ReplaceBranchAssignmentsAsync(tenantId, employee.Id, branchIds);

        var createdEmployee = await _context.Employees
            .Include(e => e.User)
            .Include(e => e.BranchAssignments)
                .ThenInclude(a => a.Branch)
            .FirstAsync(e => e.Id == employee.Id);

        return ApiResponse<StaffDto>.Created(MapToDto(createdEmployee, user), "Staff member created successfully");
    }

    public async Task<ApiResponse<StaffDto>> CreatePayrollOnlyWorkerAsync(Guid tenantId, CreatePayrollOnlyWorkerRequest request)
    {
        var role = !string.IsNullOrWhiteSpace(request.Role)
            ? request.Role
            : "PayrollOnly";

        var employee = new Employee
        {
            TenantId = tenantId,
            UserId = null,
            Name = request.Name,
            Phone = request.Phone,
            Role = role,
            WorkerMode = WorkerMode.PayrollOnly,
            Salary = request.Salary,
            HireDate = request.HireDate,
            Notes = request.Notes,
            IsEnabled = true
        };

        _context.Employees.Add(employee);
        await _context.SaveChangesAsync();

        var branchIds = await ResolveBranchIdsWithFallbackAsync(tenantId, request.BranchIds);
        await ReplaceBranchAssignmentsAsync(tenantId, employee.Id, branchIds);

        var createdEmployee = await _context.Employees
            .Include(e => e.BranchAssignments)
                .ThenInclude(a => a.Branch)
            .FirstAsync(e => e.Id == employee.Id);

        var syntheticUser = new ApplicationUser
        {
            Id = Guid.Empty,
            UserName = string.Empty,
            DisplayName = employee.Name
        };

        return ApiResponse<StaffDto>.Created(MapToDto(createdEmployee, syntheticUser), "Payroll-only worker created successfully");
    }

    public async Task<ApiResponse<PagedResult<StaffDto>>> GetAllStaffAsync(Guid tenantId, int pageNumber = 1, int pageSize = 10)
    {
        var query = _context.Employees
            .Include(e => e.User)
            .Include(e => e.BranchAssignments)
                .ThenInclude(a => a.Branch)
            .Where(e => e.TenantId == tenantId)
            .AsQueryable();

        var totalCount = await query.CountAsync();
        var staff = await query
            .OrderByDescending(e => e.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var dtos = staff.Select(e => MapToDto(e, e.User)).ToList();

        var result = new PagedResult<StaffDto>
        {
            Items = dtos,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };

        return ApiResponse<PagedResult<StaffDto>>.Ok(result, $"Retrieved {dtos.Count} staff member(s)");
    }

    public async Task<ApiResponse<StaffDto>> GetStaffByIdAsync(Guid tenantId, Guid id)
    {
        var employee = await _context.Employees
            .Include(e => e.User)
            .Include(e => e.BranchAssignments)
                .ThenInclude(a => a.Branch)
            .FirstOrDefaultAsync(e => e.Id == id && e.TenantId == tenantId);

        if (employee == null)
            return ApiResponse<StaffDto>.Error("Staff member not found");

        return ApiResponse<StaffDto>.Ok(MapToDto(employee, employee.User), "Staff member retrieved successfully");
    }

    public async Task<ApiResponse<StaffDto>> UpdateStaffAsync(Guid tenantId, Guid id, UpdateStaffRequest request)
    {
        var employee = await _context.Employees
            .Include(e => e.User)
            .Include(e => e.BranchAssignments)
                .ThenInclude(a => a.Branch)
            .FirstOrDefaultAsync(e => e.Id == id && e.TenantId == tenantId);

        if (employee == null)
            return ApiResponse<StaffDto>.Error("Staff member not found");

        employee.Name = request.Name;
        employee.Phone = request.Phone;
        employee.WorkerMode = request.WorkerMode;
        employee.Salary = request.Salary;
        employee.HireDate = request.HireDate;
        employee.Notes = request.Notes;

        if (request.BranchIds != null)
        {
            var branchIds = await ResolveBranchIdsWithFallbackAsync(tenantId, request.BranchIds);
            await ReplaceBranchAssignmentsAsync(tenantId, employee.Id, branchIds);
        }

        // Update ApplicationUser display name
        if (employee.User != null)
        {
            employee.User.DisplayName = request.Name;
            await _userManager.UpdateAsync(employee.User);
        }

        await _context.SaveChangesAsync();

        return ApiResponse<StaffDto>.Ok(MapToDto(employee, employee.User), "Staff member updated successfully");
    }

    public async Task<ApiResponse<StaffDto>> PatchStaffAsync(Guid tenantId, Guid id, PatchStaffRequest request)
    {
        var employee = await _context.Employees
            .Include(e => e.User)
            .Include(e => e.BranchAssignments)
                .ThenInclude(a => a.Branch)
            .FirstOrDefaultAsync(e => e.Id == id && e.TenantId == tenantId);

        if (employee == null)
            return ApiResponse<StaffDto>.Error("Staff member not found");

        if (request.Name != null)
        {
            employee.Name = request.Name;
            if (employee.User != null)
                employee.User.DisplayName = request.Name;
        }
        if (request.Phone != null) employee.Phone = request.Phone;
        if (request.WorkerMode.HasValue) employee.WorkerMode = request.WorkerMode.Value;
        if (request.Salary.HasValue) employee.Salary = request.Salary;
        if (request.HireDate.HasValue) employee.HireDate = request.HireDate;
        if (request.Notes != null) employee.Notes = request.Notes;

        if (request.BranchIds != null)
        {
            var branchIds = await ResolveBranchIdsWithFallbackAsync(tenantId, request.BranchIds);
            await ReplaceBranchAssignmentsAsync(tenantId, employee.Id, branchIds);
        }

        if (request.Name != null && employee.User != null)
            await _userManager.UpdateAsync(employee.User);

        await _context.SaveChangesAsync();

        return ApiResponse<StaffDto>.Ok(MapToDto(employee, employee.User), "Staff member patched successfully");
    }

    public async Task<ApiResponse<StaffDto>> EnableStaffAsync(Guid tenantId, Guid id)
    {
        var employee = await _context.Employees
            .Include(e => e.User)
            .Include(e => e.BranchAssignments)
                .ThenInclude(a => a.Branch)
            .FirstOrDefaultAsync(e => e.Id == id && e.TenantId == tenantId);

        if (employee == null)
            return ApiResponse<StaffDto>.Error("Staff member not found");

        employee.IsEnabled = true;
        if (employee.User != null)
        {
            employee.User.IsActive = true;
            await _userManager.UpdateAsync(employee.User);
        }
        await _context.SaveChangesAsync();

        return ApiResponse<StaffDto>.Ok(MapToDto(employee, employee.User), "Staff member enabled successfully");
    }

    public async Task<ApiResponse<StaffDto>> DisableStaffAsync(Guid tenantId, Guid id)
    {
        var employee = await _context.Employees
            .Include(e => e.User)
            .Include(e => e.BranchAssignments)
                .ThenInclude(a => a.Branch)
            .FirstOrDefaultAsync(e => e.Id == id && e.TenantId == tenantId);

        if (employee == null)
            return ApiResponse<StaffDto>.Error("Staff member not found");

        // Protect: cannot disable a ClinicOwner through staff endpoints
        if (employee.User != null)
        {
            var roles = await _userManager.GetRolesAsync(employee.User);
            if (roles.Contains("ClinicOwner"))
                return ApiResponse<StaffDto>.Error("Cannot disable the clinic owner");
        }

        employee.IsEnabled = false;
        if (employee.User != null)
        {
            employee.User.IsActive = false;
            await _userManager.UpdateAsync(employee.User);
        }
        await _context.SaveChangesAsync();

        return ApiResponse<StaffDto>.Ok(MapToDto(employee, employee.User), "Staff member disabled successfully");
    }

    private async Task<List<Guid>> ResolveBranchIdsWithFallbackAsync(Guid tenantId, List<Guid>? requestedBranchIds)
    {
        var requested = (requestedBranchIds ?? new List<Guid>())
            .Where(id => id != Guid.Empty)
            .Distinct()
            .ToList();

        if (requested.Count == 0)
        {
            return await _context.Branches
                .Where(b => b.TenantId == tenantId && !b.IsDeleted && b.IsActive)
                .OrderBy(b => b.Name)
                .Select(b => b.Id)
                .ToListAsync();
        }

        var validIds = await _context.Branches
            .Where(b => b.TenantId == tenantId && !b.IsDeleted && b.IsActive && requested.Contains(b.Id))
            .Select(b => b.Id)
            .ToListAsync();

        return validIds;
    }

    private async Task ReplaceBranchAssignmentsAsync(Guid tenantId, Guid employeeId, List<Guid> branchIds)
    {
        var existing = await _context.EmployeeBranchAssignments
            .Where(a => a.TenantId == tenantId && !a.IsDeleted && a.EmployeeId == employeeId)
            .ToListAsync();

        foreach (var item in existing)
        {
            item.IsDeleted = true;
            item.DeletedAt = DateTime.UtcNow;
        }

        var assignments = branchIds
            .Distinct()
            .Select((branchId, index) => new EmployeeBranchAssignment
            {
                TenantId = tenantId,
                EmployeeId = employeeId,
                BranchId = branchId,
                IsPrimary = index == 0
            })
            .ToList();

        if (assignments.Count > 0)
            _context.EmployeeBranchAssignments.AddRange(assignments);

        await _context.SaveChangesAsync();
    }

    private static StaffDto MapToDto(Employee employee, ApplicationUser? user)
    {
        return new StaffDto
        {
            Id = employee.Id,
            UserId = employee.UserId ?? Guid.Empty,
            Name = employee.Name,
            Phone = employee.Phone,
            Role = employee.Role,
            Username = user?.UserName ?? string.Empty,
            Salary = employee.Salary,
            WorkerMode = employee.WorkerMode,
            HireDate = employee.HireDate,
            Notes = employee.Notes,
            IsEnabled = employee.IsEnabled,
            AssignedBranchIds = employee.BranchAssignments
                .Where(a => !a.IsDeleted)
                .OrderByDescending(a => a.IsPrimary)
                .ThenBy(a => a.Branch.Name)
                .Select(a => a.BranchId)
                .ToList(),
            AssignedBranches = employee.BranchAssignments
                .Where(a => !a.IsDeleted)
                .OrderByDescending(a => a.IsPrimary)
                .ThenBy(a => a.Branch.Name)
                .Select(a => new StaffBranchDto
                {
                    Id = a.BranchId,
                    Name = a.Branch.Name,
                    IsPrimary = a.IsPrimary
                })
                .ToList(),
            CreatedAt = employee.CreatedAt
        };
    }
}
