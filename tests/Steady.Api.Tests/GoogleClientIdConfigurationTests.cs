using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Steady.Api.Tests;

/// <summary>
/// Falha fechada na configuração do Google (ADR-002).
///
/// Sem o client ID, a validação do token do Google não verifica a audiência e a
/// API passa a aceitar token emitido para qualquer outro aplicativo. Como isso é
/// invisível em runtime — tudo "funciona" —, a única proteção é a API se recusar
/// a subir.
/// </summary>
public sealed class GoogleClientIdConfigurationTests
{
    [Fact]
    public void SemClientIdConfigurado_ApiNaoSobe()
    {
        using var factory = new WebApplicationFactory<Program>();

        var subir = () => factory.CreateClient();

        subir.Should()
            .Throw<InvalidOperationException>()
            .WithMessage("*Google*ClientId*");
    }
}
