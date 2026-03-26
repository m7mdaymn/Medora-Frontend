using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;
using EliteClinic.Domain.Entities;
using EliteClinic.Domain.Enums;
using EliteClinic.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace EliteClinic.Application.Features.Clinic.Services;

public class PublicService : IPublicService
{
    private readonly EliteClinicDbContext _context;

    public PublicService(EliteClinicDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<PublicClinicDto>> GetClinicProfileAsync(string tenantSlug)
    {
        var tenant = await _context.Tenants
            .FirstOrDefaultAsync(t => t.Slug == tenantSlug && !t.IsDeleted);

        if (tenant == null)
            return ApiResponse<PublicClinicDto>.Error("Clinic not found");

        var settings = await _context.ClinicSettings.IgnoreQueryFilters()
            .FirstOrDefaultAsync(cs => cs.TenantId == tenant.Id && !cs.IsDeleted);

        var dto = new PublicClinicDto
        {
            ClinicName = settings?.ClinicName ?? tenant.Name,
            Phone = settings?.Phone ?? tenant.ContactPhone,
            SupportWhatsAppNumber = settings?.SupportWhatsAppNumber,
            SupportPhoneNumber = settings?.SupportPhoneNumber,
            Address = settings?.Address ?? tenant.Address,
            City = settings?.City,
            LogoUrl = settings?.LogoUrl ?? tenant.LogoUrl,
            ImgUrl = settings?.ImgUrl,
            Description = settings?.Description,
            SocialLinks = ParseSocialLinks(settings?.SocialLinksJson),
            BookingEnabled = settings?.BookingEnabled ?? false,
            TenantSlug = tenant.Slug,
            IsActive = tenant.Status == TenantStatus.Active
        };

        return ApiResponse<PublicClinicDto>.Ok(dto, "Clinic profile retrieved");
    }

    public async Task<ApiResponse<List<PublicDoctorDto>>> GetDoctorsAsync(string tenantSlug)
    {
        var tenant = await _context.Tenants
            .FirstOrDefaultAsync(t => t.Slug == tenantSlug && !t.IsDeleted);

        if (tenant == null)
            return ApiResponse<List<PublicDoctorDto>>.Error("Clinic not found");

        var doctors = await _context.Doctors.IgnoreQueryFilters()
            .Include(d => d.Services)
            .Where(d => d.TenantId == tenant.Id && !d.IsDeleted && d.IsEnabled)
            .ToListAsync();

        var links = await _context.DoctorServiceLinks.IgnoreQueryFilters()
            .Include(l => l.ClinicService)
            .Where(l => l.TenantId == tenant.Id && !l.IsDeleted && l.IsActive && !l.ClinicService.IsDeleted && l.ClinicService.IsActive)
            .ToListAsync();

        var dtos = doctors.Select(d => new PublicDoctorDto
        {
            Id = d.Id,
            Name = d.Name,
            Specialty = d.Specialty,
            Bio = d.Bio,
            PhotoUrl = d.PhotoUrl,
            IsEnabled = d.IsEnabled,
            AvgVisitDurationMinutes = d.AvgVisitDurationMinutes,
            Services = BuildEffectiveServices(d, links)
        }).ToList();

        return ApiResponse<List<PublicDoctorDto>>.Ok(dtos, $"Retrieved {dtos.Count} doctor(s)");
    }

    public async Task<ApiResponse<List<PublicDoctorServiceDto>>> GetServicesAsync(string tenantSlug)
    {
        var tenant = await _context.Tenants
            .FirstOrDefaultAsync(t => t.Slug == tenantSlug && !t.IsDeleted);

        if (tenant == null)
            return ApiResponse<List<PublicDoctorServiceDto>>.Error("Clinic not found");

        var linkedServices = await _context.DoctorServiceLinks.IgnoreQueryFilters()
            .Include(l => l.ClinicService)
            .Where(l => l.TenantId == tenant.Id && !l.IsDeleted && l.IsActive && !l.ClinicService.IsDeleted && l.ClinicService.IsActive)
            .ToListAsync();

        var dtos = linkedServices.Select(s => new PublicDoctorServiceDto
        {
            Id = s.Id,
            ServiceName = s.ClinicService.Name,
            Price = s.OverridePrice ?? s.ClinicService.DefaultPrice,
            DurationMinutes = s.OverrideDurationMinutes ?? s.ClinicService.DefaultDurationMinutes
        }).ToList();

        if (!dtos.Any())
        {
            var legacyServices = await _context.DoctorServices.IgnoreQueryFilters()
                .Where(ds => ds.TenantId == tenant.Id && !ds.IsDeleted && ds.IsActive)
                .ToListAsync();

            dtos = legacyServices.Select(s => new PublicDoctorServiceDto
            {
                Id = s.Id,
                ServiceName = s.ServiceName,
                Price = s.Price,
                DurationMinutes = s.DurationMinutes
            }).ToList();
        }

        return ApiResponse<List<PublicDoctorServiceDto>>.Ok(dtos, $"Retrieved {dtos.Count} service(s)");
    }

    public async Task<ApiResponse<List<PublicWorkingHourDto>>> GetWorkingHoursAsync(string tenantSlug)
    {
        var tenant = await _context.Tenants
            .FirstOrDefaultAsync(t => t.Slug == tenantSlug && !t.IsDeleted);

        if (tenant == null)
            return ApiResponse<List<PublicWorkingHourDto>>.Error("Clinic not found");

        var settings = await _context.ClinicSettings.IgnoreQueryFilters()
            .Include(cs => cs.WorkingHours)
            .FirstOrDefaultAsync(cs => cs.TenantId == tenant.Id && !cs.IsDeleted);

        if (settings == null)
            return ApiResponse<List<PublicWorkingHourDto>>.Ok(new List<PublicWorkingHourDto>(), "No working hours configured");

        var dtos = settings.WorkingHours.Where(w => !w.IsDeleted).Select(w => new PublicWorkingHourDto
        {
            DayOfWeek = w.DayOfWeek.ToString(),
            StartTime = w.StartTime.ToString(@"hh\:mm"),
            EndTime = w.EndTime.ToString(@"hh\:mm"),
            IsActive = w.IsActive
        }).ToList();

        return ApiResponse<List<PublicWorkingHourDto>>.Ok(dtos, $"Retrieved {dtos.Count} working hour(s)");
    }

    public async Task<ApiResponse<List<PublicDoctorDto>>> GetAvailableDoctorsNowAsync(string tenantSlug)
    {
        var tenant = await _context.Tenants
            .FirstOrDefaultAsync(t => t.Slug == tenantSlug && !t.IsDeleted);

        if (tenant == null)
            return ApiResponse<List<PublicDoctorDto>>.Error("Clinic not found");

        var activeDoctorIds = await _context.QueueSessions.IgnoreQueryFilters()
            .Where(s => s.TenantId == tenant.Id && !s.IsDeleted && s.IsActive && s.DoctorId.HasValue)
            .Select(s => s.DoctorId!.Value)
            .Distinct()
            .ToListAsync();

        if (!activeDoctorIds.Any())
            return ApiResponse<List<PublicDoctorDto>>.Ok(new List<PublicDoctorDto>(), "No doctors currently on active shift");

        var doctors = await _context.Doctors.IgnoreQueryFilters()
            .Include(d => d.Services)
            .Where(d => d.TenantId == tenant.Id && !d.IsDeleted && d.IsEnabled && activeDoctorIds.Contains(d.Id))
            .ToListAsync();

        var links = await _context.DoctorServiceLinks.IgnoreQueryFilters()
            .Include(l => l.ClinicService)
            .Where(l => l.TenantId == tenant.Id && !l.IsDeleted && l.IsActive && !l.ClinicService.IsDeleted && l.ClinicService.IsActive)
            .ToListAsync();

        var dtos = doctors.Select(d => new PublicDoctorDto
        {
            Id = d.Id,
            Name = d.Name,
            Specialty = d.Specialty,
            Bio = d.Bio,
            PhotoUrl = d.PhotoUrl,
            IsEnabled = d.IsEnabled,
            AvgVisitDurationMinutes = d.AvgVisitDurationMinutes,
            Services = BuildEffectiveServices(d, links)
        }).ToList();

        return ApiResponse<List<PublicDoctorDto>>.Ok(dtos, $"Retrieved {dtos.Count} active doctor(s)");
    }

    private static List<PublicDoctorServiceDto> BuildEffectiveServices(Doctor doctor, List<DoctorServiceLink> links)
    {
        var linked = links
            .Where(l => l.DoctorId == doctor.Id)
            .Select(l => new PublicDoctorServiceDto
            {
                Id = l.Id,
                ServiceName = l.ClinicService.Name,
                Price = l.OverridePrice ?? l.ClinicService.DefaultPrice,
                DurationMinutes = l.OverrideDurationMinutes ?? l.ClinicService.DefaultDurationMinutes
            })
            .ToList();

        if (linked.Any())
            return linked;

        return doctor.Services
            .Where(s => s.IsActive && !s.IsDeleted)
            .Select(s => new PublicDoctorServiceDto
            {
                Id = s.Id,
                ServiceName = s.ServiceName,
                Price = s.Price,
                DurationMinutes = s.DurationMinutes
            }).ToList();
    }

    private static Dictionary<string, string> ParseSocialLinks(string? socialLinksJson)
    {
        if (string.IsNullOrWhiteSpace(socialLinksJson))
            return new Dictionary<string, string>();

        try
        {
            return JsonSerializer.Deserialize<Dictionary<string, string>>(socialLinksJson) ?? new Dictionary<string, string>();
        }
        catch
        {
            return new Dictionary<string, string>();
        }
    }
}
