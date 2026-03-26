using EliteClinic.Domain.Entities;
using EliteClinic.Domain.Enums;
using EliteClinic.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;

namespace EliteClinic.Application.Features.Clinic.Services;

public class MessageTemplateRenderer : IMessageTemplateRenderer
{
    private static readonly Regex PlaceholderRegex = new("\\{\\{(?<key>[a-zA-Z0-9_]+)\\}\\}", RegexOptions.Compiled);

    private readonly EliteClinicDbContext _context;

    public MessageTemplateRenderer(EliteClinicDbContext context)
    {
        _context = context;
    }

    public async Task<MessageRenderResult> RenderAsync(
        Guid tenantId,
        MessageScenario scenario,
        MessageChannel channel,
        string language,
        Dictionary<string, string>? variables = null,
        CancellationToken cancellationToken = default)
    {
        var templateKey = scenario.ToString();
        var normalizedLanguage = string.IsNullOrWhiteSpace(language) ? "ar" : language.Trim().ToLowerInvariant();

        var template = await _context.MessageTemplates
            .FirstOrDefaultAsync(t => t.TenantId == tenantId
                && !t.IsDeleted
                && t.IsActive
                && t.Channel == channel
                && t.TemplateKey == templateKey
                && t.Language == normalizedLanguage,
                cancellationToken);

        template ??= await _context.MessageTemplates
            .FirstOrDefaultAsync(t => t.TenantId == tenantId
                && !t.IsDeleted
                && t.IsActive
                && t.Channel == channel
                && t.TemplateKey == templateKey
                && t.Language == "ar",
                cancellationToken);

        if (template is null)
        {
            return new MessageRenderResult
            {
                Success = false,
                Error = $"No active template found for scenario '{templateKey}' and channel '{channel}'"
            };
        }

        return RenderFromTemplate(template.BodyTemplate, variables);
    }

    public static MessageRenderResult RenderFromTemplate(string template, Dictionary<string, string>? variables)
    {
        if (string.IsNullOrWhiteSpace(template))
        {
            return new MessageRenderResult
            {
                Success = false,
                Error = "Template body is empty"
            };
        }

        var values = variables ?? new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        var missing = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        var rendered = PlaceholderRegex.Replace(template, m =>
        {
            var key = m.Groups["key"].Value;
            if (values.TryGetValue(key, out var val) && !string.IsNullOrWhiteSpace(val))
                return val;

            missing.Add(key);
            return string.Empty;
        });

        return new MessageRenderResult
        {
            Success = true,
            RenderedBody = rendered,
            MissingVariables = missing.ToList()
        };
    }
}
