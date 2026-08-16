using System;

namespace Steady.Domain.Training;

public sealed class RunningSession
{
    public DateOnly Date { get; }
    public double DistanceKm { get; }
    public int DurationMinutes { get; }
    public double AveragePaceMinPerKm { get; }
    public int PerceivedEffort { get; }

    /// <summary>Carga de treino (session-RPE — Foster, 2001): duração × esforço percebido.</summary>
    public double Load => DurationMinutes * PerceivedEffort;

    private RunningSession(DateOnly date, double distanceKm, int durationMinutes, double averagePaceMinPerKm, int perceivedEffort)
    {
        Date = date;
        DistanceKm = distanceKm;
        DurationMinutes = durationMinutes;
        AveragePaceMinPerKm = averagePaceMinPerKm;
        PerceivedEffort = perceivedEffort;
    }

    public static RunningSession Create(DateOnly date, double distanceKm, int durationMinutes, double averagePaceMinPerKm, int perceivedEffort)
    {
        if (distanceKm <= 0)
            throw new ArgumentOutOfRangeException(nameof(distanceKm), distanceKm, "A distância deve ser maior que zero.");

        if (durationMinutes <= 0)
            throw new ArgumentOutOfRangeException(nameof(durationMinutes), durationMinutes, "A duração deve ser maior que zero.");

        if (perceivedEffort is < 1 or > 10)
            throw new ArgumentOutOfRangeException(nameof(perceivedEffort), perceivedEffort, "A percepção de esforço deve estar entre 1 e 10.");

        return new RunningSession(date, distanceKm, durationMinutes, averagePaceMinPerKm, perceivedEffort);
    }
}
