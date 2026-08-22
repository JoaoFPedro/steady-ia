using System.Net.Http.Headers;

namespace Steady.Api.Tests.Infrastructure;

public static class HttpClientAuthExtensions
{
    /// <summary>Autentica como um corredor cujo "sub" é <paramref name="googleSub"/>, com e-mail derivado dele.</summary>
    public static HttpClient AsCorredor(this HttpClient client, string googleSub) =>
        client.WithToken(FakeGoogleTokenValidator.TokenFor(googleSub));

    /// <summary>Autentica como <paramref name="googleSub"/> com um e-mail específico no token.</summary>
    public static HttpClient AsCorredorComEmail(this HttpClient client, string googleSub, string email) =>
        client.WithToken(FakeGoogleTokenValidator.TokenFor(googleSub, email));

    /// <summary>Autentica como <paramref name="googleSub"/> com um token <b>sem</b> claim de e-mail.</summary>
    public static HttpClient AsCorredorSemEmail(this HttpClient client, string googleSub) =>
        client.WithToken(FakeGoogleTokenValidator.TokenFor(googleSub, null));

    /// <summary>Envia o token cru — usado pelos testes de token inválido.</summary>
    public static HttpClient WithToken(this HttpClient client, string idToken)
    {
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", idToken);
        return client;
    }
}
