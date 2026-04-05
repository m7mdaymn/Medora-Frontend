using EliteClinic.Application.Features.Clinic.Services;
using EliteClinic.Domain.Entities;
using EliteClinic.Domain.Enums;
using Xunit;

namespace EliteClinic.Tests;

public class MessageTemplateRendererTests
{
    [Fact]
    public async Task RenderAsync_ShouldReplaceKnownVariables_AndLeaveMissingAsEmpty()
    {
        var tenantId = Guid.NewGuid();
        var (ctx, conn) = DbContextFactory.Create(tenantId);

        ctx.MessageTemplates.Add(new MessageTemplate
        {
            TenantId = tenantId,
            TemplateKey = nameof(MessageScenario.BookingConfirmed),
            Language = "ar",
            Channel = MessageChannel.WhatsApp,
            BodyTemplate = "اهلا {{patientName}} موعدك {{bookingDate}} في {{clinicName}}",
            IsActive = true
        });
        await ctx.SaveChangesAsync();

        var renderer = new MessageTemplateRenderer(ctx);
        var result = await renderer.RenderAsync(
            tenantId,
            MessageScenario.BookingConfirmed,
            MessageChannel.WhatsApp,
            "ar",
            new Dictionary<string, string>
            {
                ["patientName"] = "Ali"
            });

        Assert.True(result.Success);
        Assert.NotNull(result.RenderedBody);
        Assert.Contains("Ali", result.RenderedBody);
        Assert.Contains("اهلا", result.RenderedBody);
        Assert.Contains("موعدك", result.RenderedBody);
        Assert.Contains("bookingDate", string.Join(',', result.MissingVariables), StringComparison.OrdinalIgnoreCase);

        await conn.DisposeAsync();
        await ctx.DisposeAsync();
    }
}
