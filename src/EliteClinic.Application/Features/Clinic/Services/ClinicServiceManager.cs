using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;
using EliteClinic.Domain.Entities;
using EliteClinic.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EliteClinic.Application.Features.Clinic.Services;

public class ClinicServiceManager : IClinicServiceManager
{
    private readonly EliteClinicDbContext _context;

    public ClinicServiceManager(EliteClinicDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<ClinicServiceDto>> CreateAsync(Guid tenantId, CreateClinicServiceRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return ApiResponse<ClinicServiceDto>.Error("Service name is required");

        if (request.DefaultPrice < 0)
            return ApiResponse<ClinicServiceDto>.Error("Default price cannot be negative");

        // Check for duplicate name in tenant
        var exists = await _context.ClinicServicesCatalog
            .AnyAsync(s => s.Name.ToLower() == request.Name.Trim().ToLower());

        if (exists)
            return ApiResponse<ClinicServiceDto>.Error($"A service with name '{request.Name}' already exists");

        var entity = new ClinicService
        {
            TenantId = tenantId,
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            DefaultPrice = request.DefaultPrice,
            DefaultDurationMinutes = request.DefaultDurationMinutes,
            IsActive = true
        };

        _context.ClinicServicesCatalog.Add(entity);
        await _context.SaveChangesAsync();

        return ApiResponse<ClinicServiceDto>.Created(MapToDto(entity), "Clinic service created successfully");
    }

    public async Task<ApiResponse<ClinicServiceDto>> GetByIdAsync(Guid tenantId, Guid id)
    {
        var entity = await _context.ClinicServicesCatalog.FindAsync(id);

        if (entity == null)
            return ApiResponse<ClinicServiceDto>.Error("Clinic service not found");

        return ApiResponse<ClinicServiceDto>.Ok(MapToDto(entity), "Clinic service retrieved successfully");
    }

    public async Task<ApiResponse<PagedResult<ClinicServiceDto>>> GetAllAsync(Guid tenantId, int pageNumber = 1, int pageSize = 20, bool? activeOnly = null)
    {
        var query = _context.ClinicServicesCatalog.AsQueryable();

        if (activeOnly == true)
            query = query.Where(s => s.IsActive);

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderBy(s => s.Name)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(s => MapToDto(s))
            .ToListAsync();

        var result = new PagedResult<ClinicServiceDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };

        return ApiResponse<PagedResult<ClinicServiceDto>>.Ok(result, "Clinic services retrieved successfully");
    }

    public async Task<ApiResponse<ClinicServiceDto>> UpdateAsync(Guid tenantId, Guid id, UpdateClinicServiceRequest request)
    {
        var entity = await _context.ClinicServicesCatalog.FindAsync(id);

        if (entity == null)
            return ApiResponse<ClinicServiceDto>.Error("Clinic service not found");

        // Check for duplicate name if name is being changed
        if (request.Name != null && request.Name.Trim().ToLower() != entity.Name.ToLower())
        {
            var exists = await _context.ClinicServicesCatalog
                .AnyAsync(s => s.Id != id && s.Name.ToLower() == request.Name.Trim().ToLower());

            if (exists)
                return ApiResponse<ClinicServiceDto>.Error($"A service with name '{request.Name}' already exists");
        }

        // PATCH semantics: only update provided fields
        if (request.Name != null) entity.Name = request.Name.Trim();
        if (request.Description != null) entity.Description = request.Description.Trim();
        if (request.DefaultPrice.HasValue) entity.DefaultPrice = request.DefaultPrice.Value;
        if (request.DefaultDurationMinutes.HasValue) entity.DefaultDurationMinutes = request.DefaultDurationMinutes.Value;
        if (request.IsActive.HasValue) entity.IsActive = request.IsActive.Value;

        await _context.SaveChangesAsync();

        return ApiResponse<ClinicServiceDto>.Ok(MapToDto(entity), "Clinic service updated successfully");
    }

    public async Task<ApiResponse<bool>> DeleteAsync(Guid tenantId, Guid id)
    {
        var entity = await _context.ClinicServicesCatalog.FindAsync(id);

        if (entity == null)
            return ApiResponse<bool>.Error("Clinic service not found");

        // Check if linked to any doctor services
        var hasLinks = await _context.DoctorServiceLinks.AnyAsync(l => l.ClinicServiceId == id);
        if (hasLinks)
            return ApiResponse<bool>.Error("Cannot delete service that is linked to doctors. Deactivate it instead.");

        _context.ClinicServicesCatalog.Remove(entity);
        await _context.SaveChangesAsync();

        return ApiResponse<bool>.Ok(true, "Clinic service deleted successfully");
    }

    private static ClinicServiceDto MapToDto(ClinicService entity) => new()
    {
        Id = entity.Id,
        Name = entity.Name,
        Description = entity.Description,
        DefaultPrice = entity.DefaultPrice,
        DefaultDurationMinutes = entity.DefaultDurationMinutes,
        IsActive = entity.IsActive,
        CreatedAt = entity.CreatedAt
    };
}
