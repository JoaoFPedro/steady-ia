using Steady.Domain.Coaching;

namespace Steady.Domain.Tests;

public sealed class CoachingLinkTests
{
    private static readonly Guid PersonalId = Guid.NewGuid();
    private static readonly Guid CorredorId = Guid.NewGuid();
    private static readonly DateTime Agora = new(2026, 8, 24, 12, 0, 0, DateTimeKind.Utc);

    [Fact]
    public void Solicitacao_comeca_pendente_sem_conceder_acesso()
    {
        var vinculo = CoachingLink.Request(PersonalId, CorredorId, Agora);

        Assert.Equal(CoachingLinkStatus.Pending, vinculo.Status);
        Assert.False(vinculo.GrantsAccess);
    }

    [Fact]
    public void Aceitar_solicitacao_concede_acesso()
    {
        var vinculo = CoachingLink.Request(PersonalId, CorredorId, Agora);

        vinculo.Accept(Agora.AddMinutes(1));

        Assert.Equal(CoachingLinkStatus.Active, vinculo.Status);
        Assert.True(vinculo.GrantsAccess);
    }

    [Fact]
    public void Encerrar_vinculo_revoga_acesso()
    {
        var vinculo = CoachingLink.Request(PersonalId, CorredorId, Agora);
        vinculo.Accept(Agora.AddMinutes(1));

        vinculo.End(Agora.AddMinutes(2));

        Assert.Equal(CoachingLinkStatus.Ended, vinculo.Status);
        Assert.False(vinculo.GrantsAccess);
    }

    [Fact]
    public void Conta_nao_pode_vincular_a_si_mesma()
    {
        Assert.Throws<ArgumentException>(() => CoachingLink.Request(PersonalId, PersonalId, Agora));
    }

    [Fact]
    public void Solicitacao_encerrada_nao_pode_ser_aceita()
    {
        var vinculo = CoachingLink.Request(PersonalId, CorredorId, Agora);
        vinculo.End(Agora.AddMinutes(1));

        Assert.Throws<InvalidOperationException>(() => vinculo.Accept(Agora.AddMinutes(2)));
    }
}

