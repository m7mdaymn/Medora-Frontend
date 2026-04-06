using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;
using EliteClinic.Domain.Entities;
using EliteClinic.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EliteClinic.Application.Features.Clinic.Services;

public class BranchService : IBranchService
{
    private readonly EliteClinicDbContext _context;

    public BranchService(EliteClinicDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<List<BranchDto>>> GetBranchesAsync(Guid tenantId, bool includeInactive = false)
    {
        var query = _context.Branches
            .Where(b => b.TenantId == tenantId && !b.IsDeleted)
            .AsQueryable();

        if (!includeInactive)
            query = query.Where(b => b.IsActive);

        var branches = await query
            .OrderBy(b => b.Name)
            .Select(b => new BranchDto
            {
                Id = b.Id,
                Name = b.Name,
                Code = b.Code,
                Address = b.Address,
                Phone = b.Phone,
                IsActive = b.IsActive,
                AssignedStaffCount = _context.EmployeeBranchAssignments
                    .Count(a => a.TenantId == tenantId && !a.IsDeleted && a.BranchId == b.Id)
            })
            .ToListAsync();

        return ApiResponse<List<BranchDto>>.Ok(branches, $"Retrieved {branches.Count} branch(es)");
    }

    public async Task<ApiResponse<BranchDto>> CreateBranchAsync(Guid tenantId, CreateBranchRequest request)
    {
        var normalizedName = request.Name.Trim().ToLower();
        var exists = await _context.Branches
            .AnyAsync(b => b.TenantId == tenantId
                && !b.IsDeleted
                && b.Name.ToLower() == normalizedName);

        if (exists)
            return ApiResponse<BranchDto>.Error("Branch name already exists");

        var branch = new Branch
        {
            TenantId = tenantId,
            Name = request.Name.Trim(),
            Code = request.Code?.Trim(),
            Address = request.Address?.Trim(),
            Phone = request.Phone?.Trim(),
            IsActive = true
        };

        _context.Branches.Add(branch);
        await _context.SaveChangesAsync();

        return ApiResponse<BranchDto>.Created(Map(branch, assignedStaffCount: 0), "Branch created successfully");
    }

    public async Task<ApiResponse<BranchDto>> UpdateBranchAsync(Guid tenantId, Guid branchId, UpdateBranchRequest request)
    {
        var branch = await _context.Branches
            .FirstOrDefaultAsync(b => b.TenantId == tenantId && !b.IsDeleted && b.Id == branchId);

        if (branch == null)
            return ApiResponse<BranchDto>.Error("Branch not found");

        var normalizedName = request.Name.Trim().ToLower();
        var duplicate = await _context.Branches
            .AnyAsync(b => b.TenantId == tenantId
                && !b.IsDeleted
                && b.Id != branchId
                && b.Name.ToLower() == normalizedName);

        if (duplicate)
            return ApiResponse<BranchDto>.Error("Branch name already exists");

        branch.Name = request.Name.Trim();
        branch.Code = request.Code?.Trim();
        branch.Address = request.Address?.Trim();
        branch.Phone = request.Phone?.Trim();
        branch.IsActive = request.IsActive;

        await _context.SaveChangesAsync();

        var assignedStaffCount = await _context.EmployeeBranchAssignments
            .CountAsync(a => a.TenantId == tenantId && !a.IsDeleted && a.BranchId == branchId);

        return ApiResponse<BranchDto>.Ok(Map(branch, assignedStaffCount), "Branch updated successfully");
    }

    public async Task<ApiResponse<BranchDto>> SetBranchStatusAsync(Guid tenantId, Guid branchId, bool isActive)
    {
        var branch = await _context.Branches
            .FirstOrDefaultAsync(b => b.TenantId == tenantId && !b.IsDeleted && b.Id == branchId);

        if (branch == null)
            return ApiResponse<BranchDto>.Error("Branch not found");

        branch.IsActive = isActive;
        await _context.SaveChangesAsync();

        var assignedStaffCount = await _context.EmployeeBranchAssignments
            .CountAsync(a => a.TenantId == tenantId && !a.IsDeleted && a.BranchId == branchId);

        return ApiResponse<BranchDto>.Ok(
            Map(branch, assignedStaffCount),
            isActive ? "Branch activated successfully" : "Branch deactivated successfully");
    }

    private static BranchDto Map(Branch branch, int assignedStaffCount)
    {
        return new BranchDto
        {
            Id = branch.Id,
            Name = branch.Name,
            Code = branch.Code,
            Address = branch.Address,
            Phone = branch.Phone,
            IsActive = branch.IsActive,
            AssignedStaffCount = assignedStaffCount
        };
    }
}