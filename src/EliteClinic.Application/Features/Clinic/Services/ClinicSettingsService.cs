using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;
using EliteClinic.Domain.Entities;
using EliteClinic.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace EliteClinic.Application.Features.Clinic.Services;

public class ClinicSettingsService : IClinicSettingsService
{
    private readonly EliteClinicDbContext _context;

    public ClinicSettingsService(EliteClinicDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<ClinicSettingsDto>> GetSettingsAsync(Guid tenantId)
    {
        // Global query filter already constrains by TenantId (via CurrentTenantId)
        // No need for explicit s.TenantId == tenantId (it would create a redundant double filter)
        var settings = await _context.ClinicSettings
            .Include(s => s.WorkingHours.Where(w => !w.IsDeleted))
            .FirstOrDefaultAsync();

        if (settings == null)
        {
            return ApiResponse<ClinicSettingsDto>.Error("Clinic settings not found");
        }

        return ApiResponse<ClinicSettingsDto>.Ok(MapToDto(settings), "Clinic settings retrieved successfully");
    }

    public async Task<ApiResponse<ClinicSettingsDto>> UpdateSettingsAsync(Guid tenantId, UpdateClinicSettingsRequest request)
    {
        // Global query filter already constrains by TenantId
        var settings = await _context.ClinicSettings
            .Include(s => s.WorkingHours.Where(w => !w.IsDeleted))
            .FirstOrDefaultAsync();

        if (settings == null)
        {
            return ApiResponse<ClinicSettingsDto>.Error("Clinic settings not found");
        }

        settings.ClinicName = request.ClinicName;
        settings.Phone = request.Phone;
        settings.WhatsAppSenderNumber = request.WhatsAppSenderNumber;
        settings.SupportWhatsAppNumber = request.SupportWhatsAppNumber;
        settings.SupportPhoneNumber = request.SupportPhoneNumber;
        settings.Address = request.Address;
        settings.City = request.City;
        settings.LogoUrl = request.LogoUrl;
        settings.Description = request.Description;
        settings.SocialLinksJson = SerializeSocialLinks(request.SocialLinks);
        settings.BookingEnabled = request.BookingEnabled;
        settings.CancellationWindowHours = request.CancellationWindowHours;
        settings.RetainCreditOnNoShow = request.RetainCreditOnNoShow;
        settings.SelfServicePaymentPolicy = request.SelfServicePaymentPolicy;
        settings.SelfServiceRequestExpiryHours = request.SelfServiceRequestExpiryHours;

        // Replace working hours if provided
        if (request.WorkingHours != null)
        {
            // Soft-delete existing
            foreach (var existing in settings.WorkingHours)
            {
                existing.IsDeleted = true;
                existing.DeletedAt = DateTime.UtcNow;
            }

            // Add new — use _context.WorkingHours.Add() to force Added state
            // (BaseEntity sets Id = Guid.NewGuid() in constructor, so adding to a
            //  tracked collection makes EF think the entity already exists → UPDATE instead of INSERT)
            foreach (var wh in request.WorkingHours)
            {
                if (!TimeSpan.TryParse(wh.StartTime, out var startTime) ||
                    !TimeSpan.TryParse(wh.EndTime, out var endTime))
                {
                    return ApiResponse<ClinicSettingsDto>.ValidationError(
                        new List<object> { new { field = "WorkingHours", message = $"Invalid time format for {wh.DayOfWeek}. Use HH:mm format." } });
                }

                _context.WorkingHours.Add(new WorkingHour
                {
                    TenantId = tenantId,
                    ClinicSettingsId = settings.Id,
                    DayOfWeek = wh.DayOfWeek,
                    StartTime = startTime,
                    EndTime = endTime,
                    IsActive = wh.IsActive
                });
            }
        }

        await _context.SaveChangesAsync();

        // Reload to get fresh data (global query filter handles TenantId)
        var updated = await _context.ClinicSettings
            .Include(s => s.WorkingHours.Where(w => !w.IsDeleted))
            .FirstAsync();

        return ApiResponse<ClinicSettingsDto>.Ok(MapToDto(updated), "Clinic settings updated successfully");
    }

    public async Task<ApiResponse<ClinicSettingsDto>> PatchSettingsAsync(Guid tenantId, PatchClinicSettingsRequest request)
    {
        var settings = await _context.ClinicSettings
            .Include(s => s.WorkingHours.Where(w => !w.IsDeleted))
            .FirstOrDefaultAsync();

        if (settings == null)
            return ApiResponse<ClinicSettingsDto>.Error("Clinic settings not found");

        if (request.ClinicName != null) settings.ClinicName = request.ClinicName;
        if (request.Phone != null) settings.Phone = request.Phone;
        if (request.WhatsAppSenderNumber != null) settings.WhatsAppSenderNumber = request.WhatsAppSenderNumber;
        if (request.SupportWhatsAppNumber != null) settings.SupportWhatsAppNumber = request.SupportWhatsAppNumber;
        if (request.SupportPhoneNumber != null) settings.SupportPhoneNumber = request.SupportPhoneNumber;
        if (request.Address != null) settings.Address = request.Address;
        if (request.City != null) settings.City = request.City;
        if (request.LogoUrl != null) settings.LogoUrl = request.LogoUrl;
        if (request.Description != null) settings.Description = request.Description;
        if (request.SocialLinks != null) settings.SocialLinksJson = SerializeSocialLinks(request.SocialLinks);
        if (request.BookingEnabled.HasValue) settings.BookingEnabled = request.BookingEnabled.Value;
        if (request.RetainCreditOnNoShow.HasValue) settings.RetainCreditOnNoShow = request.RetainCreditOnNoShow.Value;
        if (request.CancellationWindowHours.HasValue) settings.CancellationWindowHours = request.CancellationWindowHours.Value;
        if (request.SelfServicePaymentPolicy.HasValue) settings.SelfServicePaymentPolicy = request.SelfServicePaymentPolicy.Value;
        if (request.SelfServiceRequestExpiryHours.HasValue) settings.SelfServiceRequestExpiryHours = request.SelfServiceRequestExpiryHours.Value;

        // Replace working hours if provided
        if (request.WorkingHours != null)
        {
            foreach (var existing in settings.WorkingHours)
            {
                existing.IsDeleted = true;
                existing.DeletedAt = DateTime.UtcNow;
            }

            foreach (var wh in request.WorkingHours)
            {
                if (!TimeSpan.TryParse(wh.StartTime, out var startTime) ||
                    !TimeSpan.TryParse(wh.EndTime, out var endTime))
                {
                    return ApiResponse<ClinicSettingsDto>.ValidationError(
                        new List<object> { new { field = "WorkingHours", message = $"Invalid time format for {wh.DayOfWeek}. Use HH:mm format." } });
                }

                _context.WorkingHours.Add(new WorkingHour
                {
                    TenantId = settings.TenantId,
                    ClinicSettingsId = settings.Id,
                    DayOfWeek = wh.DayOfWeek,
                    StartTime = startTime,
                    EndTime = endTime,
                    IsActive = wh.IsActive
                });
            }
        }

        await _context.SaveChangesAsync();

        var patched = await _context.ClinicSettings
            .Include(s => s.WorkingHours.Where(w => !w.IsDeleted))
            .FirstAsync();

        return ApiResponse<ClinicSettingsDto>.Ok(MapToDto(patched), "Clinic settings patched successfully");
    }

    public async Task<ApiResponse<ClinicPaymentOptionsDto>> GetPaymentOptionsAsync(Guid tenantId, bool activeOnly = false)
    {
        var settings = await _context.ClinicSettings.FirstOrDefaultAsync();
        if (settings == null)
            return ApiResponse<ClinicPaymentOptionsDto>.Error("Clinic settings not found");

        var methodsQuery = _context.ClinicPaymentMethods
            .Where(m => m.TenantId == tenantId && !m.IsDeleted);

        if (activeOnly)
            methodsQuery = methodsQuery.Where(m => m.IsActive);

        var methods = await methodsQuery
            .OrderBy(m => m.DisplayOrder)
            .ThenBy(m => m.CreatedAt)
            .ToListAsync();

        return ApiResponse<ClinicPaymentOptionsDto>.Ok(new ClinicPaymentOptionsDto
        {
            SelfServicePaymentPolicy = settings.SelfServicePaymentPolicy,
            SelfServiceRequestExpiryHours = settings.SelfServiceRequestExpiryHours,
            Methods = methods.Select(MapPaymentMethod).ToList()
        }, "Payment options retrieved successfully");
    }

    public async Task<ApiResponse<List<ClinicPaymentMethodDto>>> ReplacePaymentMethodsAsync(Guid tenantId, UpdateClinicPaymentMethodsRequest request)
    {
        if (request.Methods == null || request.Methods.Count == 0)
            return ApiResponse<List<ClinicPaymentMethodDto>>.Error("At least one payment method is required");

        var existing = await _context.ClinicPaymentMethods
            .Where(m => m.TenantId == tenantId && !m.IsDeleted)
            .ToListAsync();

        foreach (var item in existing)
        {
            item.IsDeleted = true;
            item.DeletedAt = DateTime.UtcNow;
        }

        var entities = request.Methods.Select(m => new ClinicPaymentMethod
        {
            TenantId = tenantId,
            MethodName = m.MethodName,
            ProviderName = m.ProviderName,
            AccountName = m.AccountName,
            AccountNumber = m.AccountNumber,
            Iban = m.Iban,
            WalletNumber = m.WalletNumber,
            Instructions = m.Instructions,
            IsActive = m.IsActive,
            DisplayOrder = m.DisplayOrder
        }).ToList();

        _context.ClinicPaymentMethods.AddRange(entities);
        await _context.SaveChangesAsync();

        var response = entities
            .OrderBy(m => m.DisplayOrder)
            .ThenBy(m => m.CreatedAt)
            .Select(MapPaymentMethod)
            .ToList();

        return ApiResponse<List<ClinicPaymentMethodDto>>.Ok(response, "Payment methods replaced successfully");
    }

    private static ClinicSettingsDto MapToDto(ClinicSettings settings)
    {
        return new ClinicSettingsDto
        {
            Id = settings.Id,
            TenantId = settings.TenantId,
            ClinicName = settings.ClinicName,
            Phone = settings.Phone,
            WhatsAppSenderNumber = settings.WhatsAppSenderNumber,
            SupportWhatsAppNumber = settings.SupportWhatsAppNumber,
            SupportPhoneNumber = settings.SupportPhoneNumber,
            Address = settings.Address,
            City = settings.City,
            LogoUrl = settings.LogoUrl,
            ImgUrl = settings.ImgUrl,
            Description = settings.Description,
            SocialLinks = ParseSocialLinks(settings.SocialLinksJson),
            BookingEnabled = settings.BookingEnabled,
            CancellationWindowHours = settings.CancellationWindowHours,
            RetainCreditOnNoShow = settings.RetainCreditOnNoShow,
            SelfServicePaymentPolicy = settings.SelfServicePaymentPolicy,
            SelfServiceRequestExpiryHours = settings.SelfServiceRequestExpiryHours,
            WorkingHours = settings.WorkingHours
                .Where(w => !w.IsDeleted)
                .Select(w => new WorkingHourDto
                {
                    Id = w.Id,
                    DayOfWeek = w.DayOfWeek,
                    StartTime = w.StartTime.ToString(@"hh\:mm"),
                    EndTime = w.EndTime.ToString(@"hh\:mm"),
                    IsActive = w.IsActive
                }).ToList()
        };
    }

    private static string? SerializeSocialLinks(Dictionary<string, string>? socialLinks)
    {
        if (socialLinks == null || socialLinks.Count == 0)
            return null;

        return JsonSerializer.Serialize(socialLinks);
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

    private static ClinicPaymentMethodDto MapPaymentMethod(ClinicPaymentMethod method)
    {
        return new ClinicPaymentMethodDto
        {
            Id = method.Id,
            MethodName = method.MethodName,
            ProviderName = method.ProviderName,
            AccountName = method.AccountName,
            AccountNumber = method.AccountNumber,
            Iban = method.Iban,
            WalletNumber = method.WalletNumber,
            Instructions = method.Instructions,
            IsActive = method.IsActive,
            DisplayOrder = method.DisplayOrder
        };
    }
}
