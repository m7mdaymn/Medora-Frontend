using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using System.Text.Json;

namespace EliteClinic.Infrastructure.Data;

public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<EliteClinicDbContext>
{
    public EliteClinicDbContext CreateDbContext(string[] args)
    {
        var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            var basePath = Path.Combine(Directory.GetCurrentDirectory(), "..", "EliteClinic.Api");
            var appSettingsPath = Path.Combine(basePath, "appsettings.json");

            if (!File.Exists(appSettingsPath))
                throw new InvalidOperationException("appsettings.json not found for design-time DbContext creation.");

            var json = File.ReadAllText(appSettingsPath);
            using var doc = JsonDocument.Parse(json);
            connectionString = doc.RootElement
                .GetProperty("ConnectionStrings")
                .GetProperty("DefaultConnection")
                .GetString();
        }

        if (string.IsNullOrWhiteSpace(connectionString))
            throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

        var optionsBuilder = new DbContextOptionsBuilder<EliteClinicDbContext>();
        optionsBuilder.UseSqlServer(connectionString);

        return new EliteClinicDbContext(optionsBuilder.Options);
    }
}
