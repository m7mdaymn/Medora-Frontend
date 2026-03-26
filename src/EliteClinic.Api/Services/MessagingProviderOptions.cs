namespace EliteClinic.Api.Services;

public class MessagingProviderOptions
{
    public bool Whats360Enabled { get; set; }
    public string? Whats360BaseUrl { get; set; }
    public string? Whats360ApiKey { get; set; }
    public string? Whats360ClientId { get; set; }
    public string DefaultCountryCode { get; set; } = "20";
    public int MaxAttempts { get; set; } = 5;
}
