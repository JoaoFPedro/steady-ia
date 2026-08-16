using System.Net.Http.Json;

namespace Steady.Api.Tests.Infrastructure;

public static class HttpClientIdempotencyExtensions
{
    public const string HeaderName = "Idempotency-Key";

    /// <summary>Envia um POST com a chave de idempotência exigida pelos endpoints de registro (ADR-003).</summary>
    public static async Task<HttpResponseMessage> PostWithKeyAsync<T>(
        this HttpClient client,
        string url,
        T body,
        Guid idempotencyKey)
    {
        using var message = new HttpRequestMessage(HttpMethod.Post, url) { Content = JsonContent.Create(body) };
        message.Headers.Add(HeaderName, idempotencyKey.ToString());

        return await client.SendAsync(message);
    }

    /// <summary>POST de registro com uma chave nova a cada chamada — para testes que não exercitam reenvio.</summary>
    public static Task<HttpResponseMessage> PostRegistroAsync<T>(this HttpClient client, string url, T body) =>
        client.PostWithKeyAsync(url, body, Guid.NewGuid());
}
