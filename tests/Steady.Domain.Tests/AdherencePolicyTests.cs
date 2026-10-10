using Steady.Domain.Adherence;
using Steady.Domain.Common;

namespace Steady.Domain.Tests;

public sealed class AdherencePolicyTests
{
    private static readonly AdherencePolicyVersion Policy = AdherencePolicyVersion.Version1();

    [Fact]
    public void Versao_e_imutavel_e_expoe_as_tolerancias_rastreaveis()
    {
        Assert.Equal(1, Policy.Version);
        Assert.Equal(0.10m, Policy.RunningDistancePercent);
        Assert.Equal(0.10m, Policy.RunningDurationPercent);
        Assert.Equal(2, Policy.PerceivedEffortPoints);
        Assert.Equal(1, Policy.SetsAbsolute);
        Assert.Equal(0.20m, Policy.RepetitionsPercent);
        Assert.Equal(0.10m, Policy.LoadPercent);
    }

    [Theory]
    [InlineData(8.9, "Divergent")]
    [InlineData(9.0, "Adherent")]
    [InlineData(10.0, "Adherent")]
    [InlineData(11.0, "Adherent")]
    [InlineData(11.1, "Divergent")]
    public void Distancia_em_torno_de_alvo_exato_respeita_dez_por_cento(
        double executed, string expected)
    {
        var result = Policy.CompareRunningDistance(NumericRange<double>.Create(10), executed);

        Assert.Equal(expected, result.Status.ToString());
    }

    [Theory]
    [InlineData(7.19, "Divergent")]
    [InlineData(7.2, "Adherent")]
    [InlineData(12.0, "Adherent")]
    [InlineData(13.2, "Adherent")]
    [InlineData(13.21, "Divergent")]
    public void Tolerancia_de_faixa_e_aplicada_nas_bordas(double executed, string expected)
    {
        var result = Policy.CompareRunningDistance(NumericRange<double>.Create(8, 12), executed);

        Assert.Equal(expected, result.Status.ToString());
    }

    [Fact]
    public void Campo_sem_prescricao_e_nao_comparavel()
    {
        var result = Policy.CompareRunningDistance(null, 10);

        Assert.Equal(FieldAdherenceStatus.NotComparable, result.Status);
        Assert.Null(result.PrescribedMin);
    }
}
