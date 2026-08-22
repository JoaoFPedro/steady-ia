using Steady.Domain.Planning;

namespace Steady.Infrastructure.Persistence;

/// <summary>
/// Pedido de plano de treino como ele vive no banco (ADR-007, STORY-010).
///
/// <see cref="RaceDate"/> é <c>string</c> e não <c>DateOnly</c> de propósito: o
/// domínio raciocina sobre data, a persistência guarda texto ISO — decisão de
/// produto registrada no ADR-007. ISO é o que mantém `order by` honesto.
/// </summary>
public sealed class PlanRequestEntity : IIdempotentRecord
{
    public Guid Id { get; set; }
    public Guid CorredorId { get; set; }
    public Guid IdempotencyKey { get; set; }
    public DateTime CreatedAt { get; set; }

    public RaceDistance RaceDistance { get; set; }
    /// <summary>Data da prova em <c>AAAA-MM-DD</c>.</summary>
    public required string RaceDate { get; set; }
    public bool RaceIsFirstTime { get; set; }

    public double LongestRecentRunKm { get; set; }
    public int TrainingDaysPerWeek { get; set; }

    public int? CurrentWeeklyRunningDays { get; set; }
    public double? ReferenceDistanceKm { get; set; }
    public string? ReferenceDuration { get; set; }
    public int? StrengthSessionMinutes { get; set; }
    public EquipmentAccess? EquipmentAccess { get; set; }

    public required IReadOnlyList<PainArea> RecurringPainAreas { get; set; }
    public string? PriorInjuries { get; set; }
}
