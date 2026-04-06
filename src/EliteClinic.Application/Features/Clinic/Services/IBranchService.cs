using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;

namespace EliteClinic.Application.Features.Clinic.Services;

public interface IBranchService
{
    Task<ApiResponse<List<BranchDto>>> GetBranchesAsync(Guid tenantId, bool includeInactive = false);
    Task<ApiResponse<BranchDto>> CreateBranchAsync(Guid tenantId, CreateBranchRequest request);
    Task<ApiResponse<BranchDto>> UpdateBranchAsync(Guid tenantId, Guid branchId, UpdateBranchRequest request);
    Task<ApiResponse<BranchDto>> SetBranchStatusAsync(Guid tenantId, Guid branchId, bool isActive);
}