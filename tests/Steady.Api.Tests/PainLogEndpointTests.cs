using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Steady.Api.Contracts;
using Steady.Api.Tests.Infrastructure;

namespace Steady.Api.Tests;

[Collection(ApiTestCollection.Name)]
public sealed class PainLogEndpointTests(CustomWebApplicationFactory factory)
{
    [Fact]
    public async Task RegistrarDor_Valida_Persiste()
    {
        var client = factory.CreateClient().AsCorredor($"sub-{Guid.NewGuid()}");
        var request = new PainLogRequest(
            Date: DateOnly.FromDateTime(DateTime.UtcNow).AddDays(-2),
            Region: "Canela");

        var response = await client.PostRegistroAsync("/api/pain-logs", request);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var created = await response.Content.ReadFromJsonAsync<PainLogResponse>();
        created.Should().NotBeNull();
        created!.Id.Should().NotBeEmpty();
        created.Region.Should().Be("Canela");
    }
}
