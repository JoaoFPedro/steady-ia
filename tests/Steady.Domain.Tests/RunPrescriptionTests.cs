using Steady.Domain.Coaching;

namespace Steady.Domain.Tests;

public sealed class RunPrescriptionTests
{
    [Fact]
    public void Descricao_sozinha_e_valida_sem_nenhum_numero()
    {
        var prescricao = RunPrescription.Create("Fartlek leve");

        Assert.Equal("Fartlek leve", prescricao.Description);
        Assert.Null(prescricao.DistanceKm);
        Assert.Null(prescricao.DurationMinutes);
        Assert.Null(prescricao.PerceivedEffort);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Descricao_e_obrigatoria(string description)
    {
        Assert.Throws<ArgumentException>(() => RunPrescription.Create(description));
    }

    [Fact]
    public void Distancia_como_alvo_exato_nao_tem_maximo()
    {
        var prescricao = RunPrescription.Create("Longão", distanceKmMin: 21);

        Assert.NotNull(prescricao.DistanceKm);
        Assert.Equal(21, prescricao.DistanceKm!.Value.Min);
        Assert.Null(prescricao.DistanceKm!.Value.Max);
    }

    [Fact]
    public void Distancia_como_faixa_guarda_minimo_e_maximo()
    {
        var prescricao = RunPrescription.Create("Moderada", distanceKmMin: 8, distanceKmMax: 10);

        Assert.Equal(8, prescricao.DistanceKm!.Value.Min);
        Assert.Equal(10, prescricao.DistanceKm!.Value.Max);
    }

    [Fact]
    public void Campos_numericos_sao_independentes_entre_si()
    {
        var prescricao = RunPrescription.Create("Qualidade", perceivedEffortMin: 7, perceivedEffortMax: 8);

        Assert.Null(prescricao.DistanceKm);
        Assert.Null(prescricao.DurationMinutes);
        Assert.NotNull(prescricao.PerceivedEffort);
    }

    [Fact]
    public void Faixa_invertida_de_distancia_e_recusada()
    {
        Assert.Throws<ArgumentException>(() =>
            RunPrescription.Create("Longão", distanceKmMin: 12, distanceKmMax: 8));
    }

    [Fact]
    public void Faixa_com_maximo_igual_ao_minimo_e_recusada()
    {
        Assert.Throws<ArgumentException>(() =>
            RunPrescription.Create("Longão", distanceKmMin: 10, distanceKmMax: 10));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-5)]
    public void Distancia_zero_ou_negativa_e_recusada(double distance)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            RunPrescription.Create("Longão", distanceKmMin: distance));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-10)]
    public void Duracao_zero_ou_negativa_e_recusada(int duration)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            RunPrescription.Create("Longão", durationMinutesMin: duration));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(11)]
    public void Esforco_fora_da_escala_1_a_10_e_recusado(int effort)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            RunPrescription.Create("Longão", perceivedEffortMin: effort));
    }

    [Fact]
    public void Maximo_sem_minimo_e_invalido()
    {
        Assert.Throws<ArgumentException>(() =>
            RunPrescription.Create("Longão", distanceKmMax: 10));
    }
}
