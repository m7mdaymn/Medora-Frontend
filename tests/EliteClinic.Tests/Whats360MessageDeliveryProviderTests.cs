using EliteClinic.Api.Services;
using EliteClinic.Domain.Entities;
using EliteClinic.Domain.Enums;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using System.Net;
using System.Net.Http;
using System.Text;
using Xunit;

namespace EliteClinic.Tests;

public class Whats360MessageDeliveryProviderTests
{
    [Fact]
    public async Task DeliverAsync_ShouldCallWhats360AndReturnAccepted()
    {
        var handler = new FakeHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent("{\"success\":true}", Encoding.UTF8, "application/json")
        });
        var httpClient = new HttpClient(handler);

        var options = Options.Create(new MessagingProviderOptions
        {
            Whats360Enabled = true,
            Whats360BaseUrl = "https://api.whats360.test",
            Whats360ApiKey = "secret",
            Whats360ClientId = "clinic-1",
            DefaultCountryCode = "20"
        });

        var provider = new Whats360MessageDeliveryProvider(httpClient, options, NullLogger<Whats360MessageDeliveryProvider>.Instance);

        var result = await provider.DeliverAsync(new MessageLog
        {
            Channel = MessageChannel.WhatsApp,
            RecipientPhone = "01012345678",
            RenderedBody = "مرحبا"
        });

        Assert.True(result.Success);
        Assert.False(result.Delivered);
        Assert.Equal("WHATS360_ACCEPTED", result.ProviderStatus);
        Assert.Contains("success", result.ProviderRawResponse ?? string.Empty, StringComparison.OrdinalIgnoreCase);
        Assert.NotNull(handler.LastRequest);
        Assert.Equal("Bearer", handler.LastRequest!.Headers.Authorization?.Scheme);
    }

    private sealed class FakeHttpMessageHandler : HttpMessageHandler
    {
        private readonly Func<HttpRequestMessage, HttpResponseMessage> _responder;
        public HttpRequestMessage? LastRequest { get; private set; }

        public FakeHttpMessageHandler(Func<HttpRequestMessage, HttpResponseMessage> responder)
        {
            _responder = responder;
        }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            LastRequest = request;
            return Task.FromResult(_responder(request));
        }
    }
}
