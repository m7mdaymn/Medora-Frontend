using EliteClinic.Domain.Enums;

namespace EliteClinic.Domain.Entities;

public class MessageTemplate : TenantBaseEntity
{
    public string TemplateKey { get; set; } = string.Empty;
    public string Language { get; set; } = "ar";
    public MessageChannel Channel { get; set; }
    public string? TitleTemplate { get; set; }
    public string BodyTemplate { get; set; } = string.Empty;
    public bool IsActive { get; set; }

    public MessageTemplate()
    {
        IsActive = true;
    }
}
