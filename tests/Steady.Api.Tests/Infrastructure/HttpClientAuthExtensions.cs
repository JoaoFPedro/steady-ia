using System.Net.Http.Headers;

namespace Steady.Api.Tests.Infrastructure;

public static class HttpClientAuthExtensions
{
    /// <summary>Autentica o cliente como um corredor cujo "sub" do Google é <paramref name="googleSub"/>.</summary>
    public static HttpClient AsCorredor(this HttpClient client, string googleSub)
    {
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", googleSub);
        return client;
    }
}
