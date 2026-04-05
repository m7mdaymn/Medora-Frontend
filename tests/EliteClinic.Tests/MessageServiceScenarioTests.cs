using EliteClinic.Application.Features.Clinic.Services;
using EliteClinic.Domain.Entities;
using EliteClinic.Domain.Enums;
using Xunit;

namespace EliteClinic.Tests;

public class MessageServiceScenarioTests
{
    [Fact]
    public async Task LogScenarioAsync_ShouldPersistRenderedMessageForOutbox()
    {
        var tenantId = Guid.NewGuid();
        var (ctx, conn) = DbContextFactory.Create(tenantId);

        ctx.ClinicSettings.Add(new ClinicSettings(tenantId, "عيادة الاختبار")
        {
            Phone = "01000000000"
        });

        ctx.MessageTemplates.Add(new MessageTemplate
        {
            TenantId = tenantId,
            TemplateKey = nameof(MessageScenario.QueueTicketIssued),
            Language = "ar",
            Channel = MessageChannel.WhatsApp,
            BodyTemplate = "{{patientName}} تذكرتك {{ticketNumber}} في {{clinicName}}",
            IsActive = true
        });
        await ctx.SaveChangesAsync();

        var service = new MessageService(ctx, new MessageTemplateRenderer(ctx));

        await service.LogScenarioAsync(
            tenantId,
            MessageScenario.QueueTicketIssued,
            recipientPhone: "+201012345678",
            variables: new Dictionary<string, string>
            {
                ["patientName"] = "Nour",
                ["ticketNumber"] = "15"
            });

        var log = ctx.MessageLogs.Single();
        Assert.Equal(nameof(MessageScenario.QueueTicketIssued), log.TemplateName);
        Assert.Equal(MessageStatus.Pending, log.Status);
        Assert.NotNull(log.RenderedBody);
        Assert.Contains("Nour", log.RenderedBody);
        Assert.Contains("15", log.RenderedBody);
        Assert.Contains("عيادة الاختبار", log.RenderedBody);

        await conn.DisposeAsync();
        await ctx.DisposeAsync();
    }
}
