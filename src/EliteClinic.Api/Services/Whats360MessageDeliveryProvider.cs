using EliteClinic.Application.Features.Clinic.Services;
using EliteClinic.Domain.Entities;
using EliteClinic.Domain.Enums;
using Microsoft.Extensions.Options;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace EliteClinic.Api.Services;

public class Whats360MessageDeliveryProvider : IMessageDeliveryProvider
{
    private static readonly Regex NonDigitRegex = new("[^0-9]", RegexOptions.Compiled);

    private readonly HttpClient _httpClient;
    private readonly MessagingProviderOptions _options;
    private readonly ILogger<Whats360MessageDeliveryProvider> _logger;

    public Whats360MessageDeliveryProvider(HttpClient httpClient, IOptions<MessagingProviderOptions> options, ILogger<Whats360MessageDeliveryProvider> logger)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<MessageDeliveryResult> DeliverAsync(MessageLog message, CancellationToken cancellationToken = default)
    {
        if (message.Channel == MessageChannel.PWA)
        {
            return new MessageDeliveryResult
            {
                Success = true,
                Delivered = true,
                ProviderStatus = "PWA_DELIVERED_LOCAL"
            };
        }

        if (!_options.Whats360Enabled)
        {
            return new MessageDeliveryResult
            {
                Success = false,
                IsPermanentFailure = true,
                ProviderStatus = "WHATS360_DISABLED",
                Error = "Whats360 provider is disabled"
            };
        }

        if (string.IsNullOrWhiteSpace(_options.Whats360BaseUrl)
            || string.IsNullOrWhiteSpace(_options.Whats360ApiKey)
            || string.IsNullOrWhiteSpace(_options.Whats360ClientId))
        {
            return new MessageDeliveryResult
            {
                Success = false,
                IsPermanentFailure = true,
                ProviderStatus = "WHATS360_NOT_CONFIGURED",
                Error = "Whats360 provider is missing required configuration"
            };
        }

        if (string.IsNullOrWhiteSpace(message.RecipientPhone) || string.IsNullOrWhiteSpace(message.RenderedBody))
        {
            return new MessageDeliveryResult
            {
                Success = false,
                IsPermanentFailure = true,
                ProviderStatus = "INVALID_MESSAGE",
                Error = "WhatsApp message requires recipient phone and rendered body"
            };
        }

        var normalizedPhone = NormalizePhone(message.RecipientPhone, _options.DefaultCountryCode);
        if (string.IsNullOrWhiteSpace(normalizedPhone))
        {
            return new MessageDeliveryResult
            {
                Success = false,
                IsPermanentFailure = true,
                ProviderStatus = "INVALID_PHONE",
                Error = "Could not normalize recipient phone"
            };
        }

        var endpoint = $"{_options.Whats360BaseUrl.TrimEnd('/')}/send_message";
        var payload = JsonSerializer.Serialize(new
        {
            client_id = _options.Whats360ClientId,
            mobile = normalizedPhone,
            text = message.RenderedBody
        });

        using var request = new HttpRequestMessage(HttpMethod.Post, endpoint)
        {
            Content = new StringContent(payload, Encoding.UTF8, "application/json")
        };

        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.Whats360ApiKey);

        try
        {
            using var response = await _httpClient.SendAsync(request, cancellationToken);
            var raw = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                return new MessageDeliveryResult
                {
                    Success = false,
                    IsPermanentFailure = IsPermanentStatusCode((int)response.StatusCode),
                    ProviderStatus = $"HTTP_{(int)response.StatusCode}",
                    ProviderRawResponse = raw,
                    Error = $"Whats360 request failed with status {(int)response.StatusCode}"
                };
            }

            var accepted = ParseSuccess(raw);
            return new MessageDeliveryResult
            {
                Success = accepted,
                Delivered = false,
                IsPermanentFailure = false,
                ProviderStatus = accepted ? "WHATS360_ACCEPTED" : "WHATS360_REJECTED",
                ProviderRawResponse = raw,
                Error = accepted ? null : "Whats360 rejected message"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Whats360 dispatch failed for MessageLogId {MessageLogId}", message.Id);
            return new MessageDeliveryResult
            {
                Success = false,
                IsPermanentFailure = false,
                ProviderStatus = "TRANSPORT_ERROR",
                Error = ex.Message
            };
        }
    }

    private static string NormalizePhone(string phone, string countryCode)
    {
        var digits = NonDigitRegex.Replace(phone, string.Empty);
        if (string.IsNullOrWhiteSpace(digits))
            return string.Empty;

        if (digits.StartsWith("00", StringComparison.Ordinal))
            digits = digits[2..];

        var normalizedCountryCode = NonDigitRegex.Replace(countryCode, string.Empty);
        if (string.IsNullOrWhiteSpace(normalizedCountryCode))
            normalizedCountryCode = "20";

        if (digits.StartsWith(normalizedCountryCode, StringComparison.Ordinal))
            return digits;

        if (digits.StartsWith("0", StringComparison.Ordinal))
            return normalizedCountryCode + digits[1..];

        return normalizedCountryCode + digits;
    }

    private static bool ParseSuccess(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return false;

        try
        {
            using var doc = JsonDocument.Parse(raw);
            if (doc.RootElement.TryGetProperty("success", out var successProperty))
            {
                if (successProperty.ValueKind == JsonValueKind.True)
                    return true;
                if (successProperty.ValueKind == JsonValueKind.False)
                    return false;
                if (successProperty.ValueKind == JsonValueKind.String
                    && bool.TryParse(successProperty.GetString(), out var successFromText))
                    return successFromText;
            }

            if (doc.RootElement.TryGetProperty("status", out var statusProperty)
                && statusProperty.ValueKind == JsonValueKind.String)
            {
                var value = statusProperty.GetString();
                return string.Equals(value, "success", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(value, "accepted", StringComparison.OrdinalIgnoreCase);
            }
        }
        catch
        {
            // If provider returns plain text, infer acceptance from conventional values.
            return string.Equals(raw.Trim(), "ok", StringComparison.OrdinalIgnoreCase)
                || string.Equals(raw.Trim(), "success", StringComparison.OrdinalIgnoreCase);
        }

        return false;
    }

    private static bool IsPermanentStatusCode(int statusCode)
        => statusCode == 400 || statusCode == 401 || statusCode == 403 || statusCode == 404;
}
