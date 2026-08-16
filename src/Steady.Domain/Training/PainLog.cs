using System;

namespace Steady.Domain.Training;

public sealed class PainLog
{
    public DateOnly Date { get; }
    public string Region { get; }

    private PainLog(DateOnly date, string region)
    {
        Date = date;
        Region = region;
    }

    public static PainLog Create(DateOnly date, string region)
    {
        if (string.IsNullOrWhiteSpace(region))
            throw new ArgumentException("A região do corpo é obrigatória para registrar dor.", nameof(region));

        return new PainLog(date, region);
    }
}
