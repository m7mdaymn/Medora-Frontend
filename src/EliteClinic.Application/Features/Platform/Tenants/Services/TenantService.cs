using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Platform.Tenants.DTOs;
using EliteClinic.Domain.Entities;
using EliteClinic.Domain.Enums;
using EliteClinic.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace EliteClinic.Application.Features.Platform.Tenants.Services;

public class TenantService : ITenantService
{
    private readonly EliteClinicDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;

    public TenantService(EliteClinicDbContext context, UserManager<ApplicationUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    public async Task<ApiResponse<TenantDetailDto>> CreateTenantAsync(CreateTenantRequest request)
    {
        // Validate slug uniqueness
        var slugExists = await _context.Tenants
            .AnyAsync(t => t.Slug.ToLower() == request.Slug.ToLower() && !t.IsDeleted);

        if (slugExists)
        {
            return ApiResponse<TenantDetailDto>.ValidationError(new List<object>
            {
                new { field = "Slug", message = "This slug is already taken" }
            }, "Slug already exists");
        }

        var tenant = new Tenant(request.Name, request.Slug.ToLower())
        {
            ContactPhone = request.ContactPhone,
            Address = request.Address,
            LogoUrl = request.LogoUrl,
            Status = TenantStatus.Active
        };

        _context.Tenants.Add(tenant);

        // Auto-create feature flags with defaults from TenantFeatureFlag entity
        var featureFlags = new TenantFeatureFlag
        {
            TenantId = tenant.Id,
            OnlineBooking = false,
            WhatsappAutomation = true,
            PwaNotifications = false,
            ExpensesModule = true,
            AdvancedMedicalTemplates = false,
            Ratings = false,
            Export = false
        };

        _context.TenantFeatureFlags.Add(featureFlags);

        // Auto-create ClinicSettings for the tenant
        var clinicSettings = new ClinicSettings
        {
            TenantId = tenant.Id,
            ClinicName = request.Name,
            Phone = request.ContactPhone,
            BookingEnabled = false,
            CancellationWindowHours = 2
        };
        _context.ClinicSettings.Add(clinicSettings);

        await _context.SaveChangesAsync();

        // Auto-create ClinicOwner user if owner credentials provided
        if (!string.IsNullOrWhiteSpace(request.OwnerUsername) && !string.IsNullOrWhiteSpace(request.OwnerPassword))
        {
            var ownerUser = new ApplicationUser
            {
                UserName = request.OwnerUsername,
                DisplayName = request.OwnerName ?? request.Name + " Owner",
                PhoneNumber = request.OwnerPhone,
                TenantId = tenant.Id,
                IsActive = true
            };

            var createResult = await _userManager.CreateAsync(ownerUser, request.OwnerPassword);
            if (!createResult.Succeeded)
            {
                // Rollback: delete tenant and related records
                _context.ClinicSettings.Remove(clinicSettings);
                _context.TenantFeatureFlags.Remove(featureFlags);
                _context.Tenants.Remove(tenant);
                await _context.SaveChangesAsync();
                return ApiResponse<TenantDetailDto>.Error(
                    "Failed to create owner: " + string.Join("; ", createResult.Errors.Select(e => e.Description)));
            }

            await _userManager.AddToRoleAsync(ownerUser, "ClinicOwner");
        }

        var dto = MapToDetailDto(tenant);
        return ApiResponse<TenantDetailDto>.Created(dto, "Tenant created successfully");
    }

    public async Task<ApiResponse<PagedResult<TenantDto>>> GetAllTenantsAsync(
        int pageNumber = 1, int pageSize = 10, string? searchTerm = null)
    {
        var query = _context.Tenants.Where(t => !t.IsDeleted).AsQueryable();

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var search = searchTerm.ToLower();
            query = query.Where(t =>
                t.Name.ToLower().Contains(search) ||
                t.Slug.ToLower().Contains(search) ||
                (t.ContactPhone != null && t.ContactPhone.Contains(search)));
        }

        var totalCount = await query.CountAsync();
        var tenants = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var dtos = tenants.Select(MapToDto).ToList();

        var result = new PagedResult<TenantDto>
        {
            Items = dtos,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };

        return ApiResponse<PagedResult<TenantDto>>.Ok(result, $"Retrieved {dtos.Count} tenant(s)");
    }

    public async Task<ApiResponse<TenantDetailDto>> GetTenantByIdAsync(Guid id)
    {
        var tenant = await _context.Tenants
            .FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted);

        if (tenant == null)
        {
            return ApiResponse<TenantDetailDto>.Error("Tenant not found");
        }

        var dto = MapToDetailDto(tenant);
        return ApiResponse<TenantDetailDto>.Ok(dto);
    }

    public async Task<ApiResponse<TenantDetailDto>> UpdateTenantAsync(Guid id, UpdateTenantRequest request)
    {
        var tenant = await _context.Tenants
            .FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted);

        if (tenant == null)
        {
            return ApiResponse<TenantDetailDto>.Error("Tenant not found");
        }

        tenant.Name = request.Name;
        tenant.ContactPhone = request.ContactPhone;
        tenant.Address = request.Address;
        tenant.LogoUrl = request.LogoUrl;

        await _context.SaveChangesAsync();

        var dto = MapToDetailDto(tenant);
        return ApiResponse<TenantDetailDto>.Ok(dto, "Tenant updated successfully");
    }

    public async Task<ApiResponse<TenantDetailDto>> ActivateTenantAsync(Guid id)
    {
        return await UpdateTenantStatusAsync(id, TenantStatus.Active, "Tenant activated successfully");
    }

    public async Task<ApiResponse<TenantDetailDto>> SuspendTenantAsync(Guid id)
    {
        return await UpdateTenantStatusAsync(id, TenantStatus.Suspended, "Tenant suspended successfully");
    }

    public async Task<ApiResponse<TenantDetailDto>> BlockTenantAsync(Guid id)
    {
        return await UpdateTenantStatusAsync(id, TenantStatus.Blocked, "Tenant blocked successfully");
    }

    public async Task<ApiResponse<bool>> DeleteTenantAsync(Guid id)
    {
        var tenant = await _context.Tenants
            .FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted);

        if (tenant == null)
        {
            return ApiResponse<bool>.Error("Tenant not found");
        }

        tenant.IsDeleted = true;
        tenant.DeletedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return ApiResponse<bool>.Ok(true, "Tenant deleted successfully");
    }

    private async Task<ApiResponse<TenantDetailDto>> UpdateTenantStatusAsync(Guid id, TenantStatus status, string successMessage)
    {
        var tenant = await _context.Tenants
            .FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted);

        if (tenant == null)
        {
            return ApiResponse<TenantDetailDto>.Error("Tenant not found");
        }

        tenant.Status = status;
        await _context.SaveChangesAsync();

        var dto = MapToDetailDto(tenant);
        return ApiResponse<TenantDetailDto>.Ok(dto, successMessage);
    }

    private TenantDto MapToDto(Tenant tenant) => new()
    {
        Id = tenant.Id,
        Name = tenant.Name,
        Slug = tenant.Slug,
        Status = tenant.Status,
        ContactPhone = tenant.ContactPhone,
        CreatedAt = tenant.CreatedAt
    };

    private TenantDetailDto MapToDetailDto(Tenant tenant) => new()
    {
        Id = tenant.Id,
        Name = tenant.Name,
        Slug = tenant.Slug,
        Status = tenant.Status,
        ContactPhone = tenant.ContactPhone,
        Address = tenant.Address,
        LogoUrl = tenant.LogoUrl,
        CreatedAt = tenant.CreatedAt,
        UpdatedAt = tenant.UpdatedAt
    };
}
