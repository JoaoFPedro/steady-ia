using System;

namespace Steady.Domain.Training;

public sealed class StrengthSession
{
    public DateOnly Date { get; }
    public MuscleGroup MuscleGroup { get; }
    public Intensity Intensity { get; }
    public int DurationMinutes { get; }

    /// <summary>Carga de treino (session-RPE — Foster, 2001): duração × intensidade (Leve=3, Moderado=6, Pesado=9).</summary>
    public double Load => DurationMinutes * IntensityWeight(Intensity);

    private static int IntensityWeight(Intensity intensity) => intensity switch
    {
        Intensity.Leve => 3,
        Intensity.Moderado => 6,
        Intensity.Pesado => 9,
        _ => throw new ArgumentOutOfRangeException(nameof(intensity), intensity, "Intensidade desconhecida.")
    };

    private StrengthSession(DateOnly date, MuscleGroup muscleGroup, Intensity intensity, int durationMinutes)
    {
        Date = date;
        MuscleGroup = muscleGroup;
        Intensity = intensity;
        DurationMinutes = durationMinutes;
    }

    public static StrengthSession Create(DateOnly date, MuscleGroup? muscleGroup, Intensity? intensity, int durationMinutes)
    {
        if (muscleGroup is null)
            throw new ArgumentException("O grupo muscular é obrigatório para registrar uma sessão de musculação.", nameof(muscleGroup));

        if (intensity is null)
            throw new ArgumentException("A intensidade é obrigatória para registrar uma sessão de musculação.", nameof(intensity));

        if (durationMinutes <= 0)
            throw new ArgumentOutOfRangeException(nameof(durationMinutes), durationMinutes, "A duração deve ser maior que zero.");

        return new StrengthSession(date, muscleGroup.Value, intensity.Value, durationMinutes);
    }
}
