using Xunit;

namespace Steady.Api.Tests.Infrastructure;

/// <summary>Compartilha um único container PostgreSQL (Testcontainers) entre todas as classes de teste.</summary>
[CollectionDefinition(Name)]
public sealed class ApiTestCollection : ICollectionFixture<CustomWebApplicationFactory>
{
    public const string Name = "Api Tests";
}
