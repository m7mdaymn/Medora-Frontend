using EliteClinic.Domain.Entities;
using EliteClinic.Domain.Enums;
using EliteClinic.Infrastructure.Data;
using EliteClinic.Infrastructure.Services;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace EliteClinic.Tests;

internal static class DbContextFactory
{
    public static (EliteClinicDbContext Context, SqliteConnection Connection) Create(Guid tenantId)
    {
        var connection = new SqliteConnection("Data Source=:memory:");
        connection.Open();

        var options = new DbContextOptionsBuilder<EliteClinicDbContext>()
            .UseSqlite(connection)
            .EnableSensitiveDataLogging()
            .Options;

        var tenantContext = new TestTenantContext(tenantId);
        var context = new EliteClinicDbContext(options, tenantContext);
        context.Database.EnsureCreated();

        if (!context.Tenants.Any(t => t.Id == tenantId))
        {
            context.Tenants.Add(new Tenant
            {
                Id = tenantId,
                Name = "Test Tenant",
                Slug = $"test-{tenantId:N}",
                Status = TenantStatus.Active
            });
            context.SaveChanges();
        }

        return (context, connection);
    }

    private sealed class TestTenantContext : ITenantContext
    {
        public Guid TenantId { get; }
        public string? TenantSlug { get; } = "test-tenant";
        public TenantStatus TenantStatus { get; } = TenantStatus.Active;
        public bool IsTenantResolved { get; } = true;
        public string? UserId { get; }

        public TestTenantContext(Guid tenantId)
        {
            TenantId = tenantId;
            UserId = tenantId.ToString();
        }
    }
}