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

    public async Task<ApiResponse<PublicLandingDto>> GetLandingAsync(string tenantSlug)
    {
        var tenant = await _context.Tenants
            .FirstOrDefaultAsync(t => t.Slug == tenantSlug && !t.IsDeleted);

        if (tenant == null)
            return ApiResponse<PublicLandingDto>.Error("Clinic not found");

        var settings = await _context.ClinicSettings.IgnoreQueryFilters()
            .FirstOrDefaultAsync(cs => cs.TenantId == tenant.Id && !cs.IsDeleted);

        var galleryImageUrls = settings == null
            ? new List<string>()
            : await _context.MediaFiles.IgnoreQueryFilters()
                .Where(m => m.TenantId == tenant.Id
                    && !m.IsDeleted
                    && m.IsActive
                    && m.Category == "ClinicGallery"
                    && m.EntityType == "ClinicSettings"
                    && m.EntityId == settings.Id)
                .OrderByDescending(m => m.CreatedAt)
                .Select(m => m.PublicUrl)
                .ToListAsync();

        var clinic = new PublicClinicDto
        {
            ClinicName = settings?.ClinicName ?? tenant.Name,
            Phone = settings?.Phone ?? tenant.ContactPhone,
            SupportWhatsAppNumber = settings?.SupportWhatsAppNumber,
            SupportPhoneNumber = settings?.SupportPhoneNumber,
            Address = settings?.Address ?? tenant.Address,
            City = settings?.City,
            LogoUrl = settings?.LogoUrl ?? tenant.LogoUrl,
            ImgUrl = settings?.ImgUrl,
            GalleryImageUrls = galleryImageUrls,
            Description = settings?.Description,
            SocialLinks = ParseSocialLinks(settings?.SocialLinksJson),
            BookingEnabled = settings?.BookingEnabled ?? false,
            TenantSlug = tenant.Slug,
            IsActive = tenant.Status == TenantStatus.Active
        };

        var linkedServices = await _context.DoctorServiceLinks.IgnoreQueryFilters()
            .Include(l => l.ClinicService)
            .Where(l => l.TenantId == tenant.Id && !l.IsDeleted && l.IsActive && !l.ClinicService.IsDeleted && l.ClinicService.IsActive)
            .ToListAsync();

        var featuredServices = linkedServices
            .Select(s => new PublicDoctorServiceDto
            {
                Id = s.Id,
                ServiceName = s.ClinicService.Name,
                Price = s.OverridePrice ?? s.ClinicService.DefaultPrice,
                DurationMinutes = s.OverrideDurationMinutes ?? s.ClinicService.DefaultDurationMinutes
            })
            .DistinctBy(s => s.ServiceName)
            .Take(12)
            .ToList();

        if (!featuredServices.Any())
        {
            featuredServices = await _context.DoctorServices.IgnoreQueryFilters()
                .Where(ds => ds.TenantId == tenant.Id && !ds.IsDeleted && ds.IsActive)
                .OrderBy(ds => ds.ServiceName)
                .Take(12)
                .Select(s => new PublicDoctorServiceDto
                {
                    Id = s.Id,
                    ServiceName = s.ServiceName,
                    Price = s.Price,
                    DurationMinutes = s.DurationMinutes
                })
                .ToListAsync();
        }

        var featuredProducts = await _context.InventoryItems.IgnoreQueryFilters()
            .Include(i => i.Images.Where(img => !img.IsDeleted))
            .Where(i => i.TenantId == tenant.Id
                && !i.IsDeleted
                && i.Active
                && i.SellablePublicly
                && !i.InternalOnly
                && i.ShowInLanding)
            .OrderBy(i => i.Name)
            .Take(20)
            .ToListAsync();

        var branches = await _context.Branches.IgnoreQueryFilters()
            .Where(b => b.TenantId == tenant.Id && !b.IsDeleted && b.IsActive)
            .OrderBy(b => b.Name)
            .Select(b => new PublicBranchDto
            {
                Id = b.Id,
                Name = b.Name,
                Address = b.Address,
                Phone = b.Phone
            })
            .ToListAsync();

        var paymentMethods = await _context.ClinicPaymentMethods.IgnoreQueryFilters()
            .Include(m => m.Branch)
            .Where(m => m.TenantId == tenant.Id && !m.IsDeleted && m.IsActive)
            .OrderBy(m => m.DisplayOrder)
            .ThenBy(m => m.CreatedAt)
            .Select(m => new ClinicPaymentMethodDto
            {
                Id = m.Id,
                BranchId = m.BranchId,
                BranchName = m.Branch != null ? m.Branch.Name : null,
                MethodName = m.MethodName,
                ProviderName = m.ProviderName,
                AccountName = m.AccountName,
                AccountNumber = m.AccountNumber,
                Iban = m.Iban,
                WalletNumber = m.WalletNumber,
                Instructions = m.Instructions,
                IsActive = m.IsActive,
                DisplayOrder = m.DisplayOrder
            })
            .ToListAsync();

        var availableDoctorsResponse = await GetAvailableDoctorsNowAsync(tenantSlug);

        var payload = new PublicLandingDto
        {
            Clinic = clinic,
            FeaturedServices = featuredServices,
            FeaturedProducts = featuredProducts.Select(MapToPublicMarketplaceItem).ToList(),
            DoctorsAvailableNow = availableDoctorsResponse.Success
                ? availableDoctorsResponse.Data ?? new List<PublicDoctorDto>()
                : new List<PublicDoctorDto>(),
            Branches = branches,
            PaymentMethods = paymentMethods
        };

        return ApiResponse<PublicLandingDto>.Ok(payload, "Landing payload retrieved");
    }

    public async Task<ApiResponse<PublicClinicDto>> GetClinicProfileAsync(string tenantSlug)
    {
        var tenant = await _context.Tenants
            .FirstOrDefaultAsync(t => t.Slug == tenantSlug && !t.IsDeleted);

        if (tenant == null)
            return ApiResponse<PublicClinicDto>.Error("Clinic not found");

        var settings = await _context.ClinicSettings.IgnoreQueryFilters()
            .FirstOrDefaultAsync(cs => cs.TenantId == tenant.Id && !cs.IsDeleted);

        var galleryImageUrls = settings == null
            ? new List<string>()
            : await _context.MediaFiles.IgnoreQueryFilters()
                .Where(m => m.TenantId == tenant.Id
                    && !m.IsDeleted
                    && m.IsActive
                    && m.Category == "ClinicGallery"
                    && m.EntityType == "ClinicSettings"
                    && m.EntityId == settings.Id)
                .OrderByDescending(m => m.CreatedAt)
                .Select(m => m.PublicUrl)
                .ToListAsync();

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
            GalleryImageUrls = galleryImageUrls,
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

    public async Task<ApiResponse<ClinicPaymentOptionsDto>> GetPaymentOptionsAsync(string tenantSlug, Guid? branchId = null)
    {
        var tenant = await _context.Tenants
            .FirstOrDefaultAsync(t => t.Slug == tenantSlug && !t.IsDeleted);

        if (tenant == null)
            return ApiResponse<ClinicPaymentOptionsDto>.Error("Clinic not found");

        var settings = await _context.ClinicSettings.IgnoreQueryFilters()
            .FirstOrDefaultAsync(cs => cs.TenantId == tenant.Id && !cs.IsDeleted);

        var methodsQuery = _context.ClinicPaymentMethods.IgnoreQueryFilters()
            .Include(m => m.Branch)
            .Where(m => m.TenantId == tenant.Id && !m.IsDeleted && m.IsActive)
            .AsQueryable();

        if (branchId.HasValue)
            methodsQuery = methodsQuery.Where(m => m.BranchId == null || m.BranchId == branchId.Value);

        var methods = await methodsQuery
            .OrderBy(m => m.DisplayOrder)
            .ThenBy(m => m.CreatedAt)
            .Select(m => new ClinicPaymentMethodDto
            {
                Id = m.Id,
                BranchId = m.BranchId,
                BranchName = m.Branch != null ? m.Branch.Name : null,
                MethodName = m.MethodName,
                ProviderName = m.ProviderName,
                AccountName = m.AccountName,
                AccountNumber = m.AccountNumber,
                Iban = m.Iban,
                WalletNumber = m.WalletNumber,
                Instructions = m.Instructions,
                IsActive = m.IsActive,
                DisplayOrder = m.DisplayOrder
            })
            .ToListAsync();

        return ApiResponse<ClinicPaymentOptionsDto>.Ok(new ClinicPaymentOptionsDto
        {
            SelfServicePaymentPolicy = settings?.SelfServicePaymentPolicy ?? PatientSelfServicePaymentPolicy.FullOnly,
            SelfServiceRequestExpiryHours = settings?.SelfServiceRequestExpiryHours ?? 24,
            Methods = methods
        }, "Payment options retrieved");
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

    private static PublicMarketplaceItemDto MapToPublicMarketplaceItem(InventoryItem item)
    {
        return new PublicMarketplaceItemDto
        {
            Id = item.Id,
            BranchId = item.BranchId,
            Name = item.Name,
            Description = item.Description,
            SkuCode = item.SkuCode,
            ItemType = item.ItemType,
            Unit = item.Unit,
            SalePrice = item.SalePrice,
            QuantityOnHand = item.QuantityOnHand,
            ShowInLanding = item.ShowInLanding,
            Images = item.Images
                .Where(img => !img.IsDeleted)
                .OrderBy(img => img.DisplayOrder)
                .Select(img => new InventoryItemImageDto
                {
                    Id = img.Id,
                    ImageUrl = img.ImageUrl,
                    DisplayOrder = img.DisplayOrder
                })
                .ToList()
        };
    }
}
