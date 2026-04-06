using EliteClinic.Application.Features.Auth.DTOs;
using EliteClinic.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Microsoft.EntityFrameworkCore;
using EliteClinic.Infrastructure.Data;

namespace EliteClinic.Application.Features.Auth.Services;

public interface IAuthService
{
    Task<LoginResponse?> LoginAsync(string username, string password, string? tenantSlug = null);
    Task<PatientLoginResponse?> PatientLoginAsync(string username, string password, string tenantSlug);
    Task<LoginResponse?> RefreshTokenAsync(string refreshToken);
    Task<UserInfoDto?> GetCurrentUserAsync(ClaimsPrincipal claims, string? tenantSlug = null);
}

public class AuthService : IAuthService
{
    private const string NonPatientLoginError = "NON_PATIENT_LOGIN_FORBIDDEN";
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<ApplicationRole> _roleManager;
    private readonly IConfiguration _configuration;
    private readonly EliteClinicDbContext _dbContext;

    public AuthService(
        UserManager<ApplicationUser> userManager,
        RoleManager<ApplicationRole> roleManager,
        IConfiguration configuration,
        EliteClinicDbContext dbContext)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _configuration = configuration;
        _dbContext = dbContext;
    }

    public async Task<LoginResponse?> LoginAsync(string username, string password, string? tenantSlug = null)
    {
        var user = await _userManager.FindByNameAsync(username);
        if (user == null || !await _userManager.CheckPasswordAsync(user, password))
            return null;

        if (!user.IsActive)
            return null;

        var roles = await _userManager.GetRolesAsync(user);
        var role = roles.FirstOrDefault() ?? "Unknown";

        var isPlatformRole = string.Equals(role, "SuperAdmin", StringComparison.OrdinalIgnoreCase)
            || string.Equals(role, "Worker", StringComparison.OrdinalIgnoreCase);

        // Tenant-scoped validation for non-platform users
        if (!isPlatformRole)
        {
            if (string.IsNullOrWhiteSpace(tenantSlug))
                return null;

            var tenant = await _dbContext.Tenants.IgnoreQueryFilters()
                .FirstOrDefaultAsync(t => t.Slug == tenantSlug && !t.IsDeleted);
            if (tenant == null) return null;

            // Validate user belongs to this tenant
            if (!user.TenantId.HasValue || user.TenantId.Value != tenant.Id)
                return null;
        }

        var token = GenerateJwtToken(user, roles, tokenExpiry: 8 * 60, tenantSlug); // 8 hours for staff
        var refreshToken = GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
        user.LastLoginAt = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

        return new LoginResponse
        {
            Token = token,
            RefreshToken = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddHours(8),
            User = new UserInfoDto
            {
                Id = user.Id,
                Username = user.UserName ?? string.Empty,
                DisplayName = user.DisplayName ?? string.Empty,
                Role = roles.FirstOrDefault() ?? "Unknown",
                TenantId = user.TenantId,
                TenantSlug = tenantSlug,
                Permissions = GetPermissions(roles.FirstOrDefault())
            }
        };
    }

    public async Task<PatientLoginResponse?> PatientLoginAsync(string username, string password, string tenantSlug)
    {
        var user = await _userManager.FindByNameAsync(username);
        if (user == null || !await _userManager.CheckPasswordAsync(user, password))
            return null;

        if (!user.IsActive)
            return null;

        // Validate tenant
        var tenant = await _dbContext.Tenants.IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => t.Slug == tenantSlug && !t.IsDeleted);
        if (tenant == null) return null;

        // Validate user belongs to this tenant
        if (!user.TenantId.HasValue || user.TenantId.Value != tenant.Id)
            return null;

        var roles = await _userManager.GetRolesAsync(user);

        if (!roles.Contains("Patient"))
            throw new UnauthorizedAccessException(NonPatientLoginError);

        var token = GenerateJwtToken(user, roles, tokenExpiry: 365 * 24 * 60, tenantSlug); // 365 days for patient
        var refreshToken = GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(730); // 2 years
        user.LastLoginAt = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

        // Load real patient profiles
        var profiles = await _dbContext.Patients.IgnoreQueryFilters()
            .Where(p => p.UserId == user.Id && p.TenantId == tenant.Id && !p.IsDeleted)
            .Select(p => new PatientProfileDto
            {
                Id = p.Id,
                Name = p.Name,
                IsDefault = p.IsDefault
            })
            .ToListAsync();

        // Fallback if no Patient entity exists yet
        if (!profiles.Any())
        {
            profiles.Add(new PatientProfileDto
            {
                Id = user.Id,
                Name = user.DisplayName,
                IsDefault = true
            });
        }

        return new PatientLoginResponse
        {
            Token = token,
            RefreshToken = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(365),
            User = new PatientUserInfoDto
            {
                Id = user.Id,
                Username = user.UserName ?? string.Empty,
                DisplayName = user.DisplayName ?? string.Empty,
                Role = roles.FirstOrDefault() ?? "Unknown",
                TenantId = user.TenantId,
                Profiles = profiles
            }
        };
    }

    public async Task<LoginResponse?> RefreshTokenAsync(string refreshToken)
    {
        var user = await _userManager.Users.FirstOrDefaultAsync(u =>
            u.RefreshToken == refreshToken && u.RefreshTokenExpiry > DateTime.UtcNow);

        if (user == null)
            return null;

        var roles = await _userManager.GetRolesAsync(user);
        var resolvedTenantSlug = await ResolveTenantSlugAsync(user.TenantId);
        var newToken = GenerateJwtToken(user, roles, tokenExpiry: 8 * 60, resolvedTenantSlug);
        var newRefreshToken = GenerateRefreshToken();

        user.RefreshToken = newRefreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
        await _userManager.UpdateAsync(user);

        return new LoginResponse
        {
            Token = newToken,
            RefreshToken = newRefreshToken,
            ExpiresAt = DateTime.UtcNow.AddHours(8),
            User = new UserInfoDto
            {
                Id = user.Id,
                Username = user.UserName ?? string.Empty,
                DisplayName = user.DisplayName ?? string.Empty,
                Role = roles.FirstOrDefault() ?? "Unknown",
                TenantId = user.TenantId,
                TenantSlug = resolvedTenantSlug,
                Permissions = GetPermissions(roles.FirstOrDefault())
            }
        };
    }

    public async Task<UserInfoDto?> GetCurrentUserAsync(ClaimsPrincipal claims, string? tenantSlug = null)
    {
        var userIdClaim = claims.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            return null;

        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null || !user.IsActive)
            return null;

        var roles = await _userManager.GetRolesAsync(user);

        var isPlatformUser = roles.Contains("SuperAdmin") || roles.Contains("Worker");

        // Tenant users must always resolve to the same tenant in X-Tenant.
        if (!isPlatformUser)
        {
            if (string.IsNullOrWhiteSpace(tenantSlug))
                return null;

            var tenant = await _dbContext.Tenants
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Slug == tenantSlug && !t.IsDeleted);

            if (tenant == null || !user.TenantId.HasValue || user.TenantId.Value != tenant.Id)
                return null;
        }

        var resolved = tenantSlug;
        if (string.IsNullOrWhiteSpace(resolved) && user.TenantId.HasValue)
            resolved = await ResolveTenantSlugAsync(user.TenantId);

        return new UserInfoDto
        {
            Id = user.Id,
            Username = user.UserName ?? string.Empty,
            DisplayName = user.DisplayName ?? string.Empty,
            Role = roles.FirstOrDefault() ?? "Unknown",
            TenantId = user.TenantId,
            TenantSlug = resolved,
            Permissions = GetPermissions(roles.FirstOrDefault())
        };
    }

    private string GenerateJwtToken(ApplicationUser user, IList<string> roles, int tokenExpiry, string? tenantSlug = null)
    {
        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
            _configuration["JwtSettings:SecretKey"] ?? "your-secret-key-that-is-very-long-and-secure"));

        var signingCredentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.UserName ?? string.Empty),
            new("displayName", user.DisplayName ?? string.Empty),
        };

        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        if (user.TenantId.HasValue)
        {
            claims.Add(new Claim("tenantId", user.TenantId.Value.ToString()));
        }

        if (!string.IsNullOrWhiteSpace(tenantSlug))
        {
            claims.Add(new Claim("tenantSlug", tenantSlug));
        }

        var token = new JwtSecurityToken(
            issuer: _configuration["JwtSettings:Issuer"] ?? "EliteClinic",
            audience: _configuration["JwtSettings:Audience"] ?? "EliteClinicUsers",
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(tokenExpiry),
            signingCredentials: signingCredentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private async Task<string?> ResolveTenantSlugAsync(Guid? tenantId)
    {
        if (!tenantId.HasValue)
            return null;

        return await _dbContext.Tenants.IgnoreQueryFilters()
            .Where(t => t.Id == tenantId.Value && !t.IsDeleted)
            .Select(t => t.Slug)
            .FirstOrDefaultAsync();
    }

    private string GenerateRefreshToken()
    {
        var randomNumber = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    private List<string> GetPermissions(string? role)
    {
        return role switch
        {
            "SuperAdmin" => new List<string>
            {
                "platform.view", "tenant.create", "tenant.manage", "subscription.manage",
                "feature_flags.manage", "audit.view", "analytics.view"
            },
            "Worker" => new List<string>
            {
                "platform.view", "tenant.manage", "subscription.manage",
                "feature_flags.manage", "analytics.view"
            },
            "ClinicOwner" => new List<string>
            {
                "clinic.manage", "doctor.manage", "staff.manage", "patient.view", "patient.manage",
                "queue.manage", "visit.view", "finance.view", "report.export", "service.manage", "branch.manage"
            },
            "BranchManager" => new List<string>
            {
                "branch.manage", "branch.view", "staff.view"
            },
            "ClinicManager" => new List<string>
            {
                "clinic.manage", "doctor.manage", "staff.manage", "queue.manage",
                "patient.register", "patient.view", "payment.record", "expense.add",
                "finance.today", "service.manage"
            },
            "Receptionist" => new List<string>
            {
                "patient.create", "patient.edit", "patient.delete", "patient.view",
                "queue.manage", "queue.issue_ticket", "payment.record",
                "booking.manage", "invoice.view", "doctor.view", "expense.view"
            },
            "Nurse" => new List<string>
            {
                "patient.view", "queue.view", "queue.issue_ticket",
                "visit.vitals", "visit.view"
            },
            "Doctor" => new List<string>
            {
                "queue.my", "visit.create", "prescription.create", "lab.request",
                "imaging.request", "invoice.modify"
            },
            "Patient" => new List<string>
            {
                "queue.view", "booking.create", "profile.view"
            },
            "Contractor" => new List<string>
            {
                "partner.order.view", "partner.order.accept", "partner.order.schedule",
                "partner.order.arrived", "partner.order.result", "partner.service.manage"
            },
            _ => new List<string>()
        };
    }
}
