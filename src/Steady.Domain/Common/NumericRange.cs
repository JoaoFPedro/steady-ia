namespace Steady.Domain.Common;

/// <summary>
/// Faixa numérica imutável: mínimo obrigatório, máximo opcional. Máximo ausente
/// significa alvo exato — prescrição de treino é naturalmente intervalar
/// ("8 a 10 km"), e forçar um ponto único produziria divergência artificial na
/// comparação (ADR-012 da STORY-014).
/// </summary>
public readonly record struct NumericRange<T> where T : struct, IComparable<T>
{
    public T Min { get; }
    public T? Max { get; }

    private NumericRange(T min, T? max)
    {
        Min = min;
        Max = max;
    }

    public static NumericRange<T> Create(T min, T? max)
    {
        if (max is { } maxValue && maxValue.CompareTo(min) <= 0)
            throw new ArgumentException("O máximo deve ser maior que o mínimo.", nameof(max));

        return new NumericRange<T>(min, max);
    }
}
