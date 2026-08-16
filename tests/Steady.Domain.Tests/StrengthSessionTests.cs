using System;
using Steady.Domain.Training;
using Xunit;

namespace Steady.Domain.Tests;

public class StrengthSessionTests
{
    [Fact]
    public void Corredor_registra_sessao_de_musculacao_valida()
    {
        var date = new DateOnly(2026, 8, 3);

        var session = StrengthSession.Create(
            date: date,
            muscleGroup: MuscleGroup.PernaFrontal,
            intensity: Intensity.Pesado,
            durationMinutes: 60);

        Assert.Equal(date, session.Date);
        Assert.Equal(MuscleGroup.PernaFrontal, session.MuscleGroup);
        Assert.Equal(Intensity.Pesado, session.Intensity);
        Assert.Equal(60, session.DurationMinutes);
    }

    [Fact]
    public void Rejeita_sessao_sem_grupo_muscular()
    {
        var exception = Assert.Throws<ArgumentException>(() =>
            StrengthSession.Create(
                date: new DateOnly(2026, 8, 3),
                muscleGroup: null,
                intensity: Intensity.Pesado,
                durationMinutes: 60));

        Assert.Contains("grupo muscular", exception.Message);
    }

    [Fact]
    public void Rejeita_sessao_sem_intensidade()
    {
        var exception = Assert.Throws<ArgumentException>(() =>
            StrengthSession.Create(
                date: new DateOnly(2026, 8, 3),
                muscleGroup: MuscleGroup.Ombro,
                intensity: null,
                durationMinutes: 60));

        Assert.Contains("intensidade", exception.Message);
    }

    [Fact]
    public void Rejeita_duracao_zero_ou_negativa()
    {
        var exception = Assert.Throws<ArgumentOutOfRangeException>(() =>
            StrengthSession.Create(
                date: new DateOnly(2026, 8, 3),
                muscleGroup: MuscleGroup.Ombro,
                intensity: Intensity.Moderado,
                durationMinutes: 0));

        Assert.Contains("duração deve ser maior que zero", exception.Message);
    }
}
