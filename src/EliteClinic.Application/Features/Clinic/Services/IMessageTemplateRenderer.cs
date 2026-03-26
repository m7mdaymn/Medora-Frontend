using EliteClinic.Domain.Enums;

namespace EliteClinic.Application.Features.Clinic.Services;

public interface IMessageTemplateRenderer
{
    Task<MessageRenderResult> RenderAsync(Guid tenantId, MessageScenario scenario, MessageChannel channel, string language, Dictionary<string, string>? variables = null, CancellationToken cancellationToken = default);
}

public class MessageRenderResult
{
    public bool Success { get; set; }
    public string? RenderedBody { get; set; }
    public string? Error { get; set; }
    public List<string> MissingVariables { get; set; } = new();
}
