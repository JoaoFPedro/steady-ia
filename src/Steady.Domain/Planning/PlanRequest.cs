using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;

namespace Steady.Domain.Planning;

/// <summary>
/// O que o corredor respondeu ao montar um planejamento (STORY-010).
///
/// Guarda intenção e contexto — a prova-alvo e o perfil de quem vai treinar para
/// ela. **Não calcula plano nenhum**: gerar os exercícios a partir destes campos
/// segue fora de escopo (DISC-002), e este tipo é exatamente o insumo que essa
/// geração vai consumir quando chegar.
///
/// A data é <see cref="DateOnly"/> aqui e texto ISO na persistência (ADR-007):
/// o domínio raciocina sobre data, o banco guarda string.
/// </summary>
public sealed class PlanRequest
{
    private const string ReferenceDurationFormat = @"hh\:mm\:ss";

    public RaceDistance RaceDistance { get; }
    public DateOnly RaceDate { get; }
    public bool RaceIsFirstTime { get; }
    public double LongestRecentRunKm { get; }
    public int TrainingDaysPerWeek { get; }

    public int? CurrentWeeklyRunningDays { get; }
    public double? ReferenceDistanceKm { get; }
    /// <summary>Tempo de referência em <c>HH:MM:SS</c>, já validado.</summary>
    public string? ReferenceDuration { get; }
    public int? StrengthSessionMinutes { get; }
    public EquipmentAccess? EquipmentAccess { get; }

    /// <summary>Dores recorrentes, sem repetição. Vazia significa "nenhuma".</summary>
    public IReadOnlyList<PainArea> RecurringPainAreas { get; }
    public string? PriorInjuries { get; }

    private PlanRequest(
        RaceDistance raceDistance,
        DateOnly raceDate,
        bool raceIsFirstTime,
        double longestRecentRunKm,
        int trainingDaysPerWeek,
        int? currentWeeklyRunningDays,
        double? referenceDistanceKm,
        string? referenceDuration,
        int? strengthSessionMinutes,
        EquipmentAccess? equipmentAccess,
        IReadOnlyList<PainArea> recurringPainAreas,
        string? priorInjuries)
    {
        RaceDistance = raceDistance;
        RaceDate = raceDate;
        RaceIsFirstTime = raceIsFirstTime;
        LongestRecentRunKm = longestRecentRunKm;
        TrainingDaysPerWeek = trainingDaysPerWeek;
        CurrentWeeklyRunningDays = currentWeeklyRunningDays;
        ReferenceDistanceKm = referenceDistanceKm;
        ReferenceDuration = referenceDuration;
        StrengthSessionMinutes = strengthSessionMinutes;
        EquipmentAccess = equipmentAccess;
        RecurringPainAreas = recurringPainAreas;
        PriorInjuries = priorInjuries;
    }

    /// <param name="today">
    /// Injetado em vez de lido do relógio: a regra "a prova precisa ser futura" fica
    /// testável sem mockar tempo — mesma escolha da STORY-007.
    /// </param>
    public static PlanRequest Create(
        RaceDistance raceDistance,
        DateOnly raceDate,
        bool raceIsFirstTime,
        double longestRecentRunKm,
        int trainingDaysPerWeek,
        int? currentWeeklyRunningDays,
        double? referenceDistanceKm,
        string? referenceDuration,
        int? strengthSessionMinutes,
        EquipmentAccess? equipmentAccess,
        IReadOnlyList<PainArea>? recurringPainAreas,
        string? priorInjuries,
        DateOnly today)
    {
        if (raceDate <= today)
            throw new ArgumentOutOfRangeException(
                nameof(raceDate), raceDate,
                "A data da prova precisa ser futura — o plano é contado de trás para frente a partir dela.");

        if (longestRecentRunKm <= 0)
            throw new ArgumentOutOfRangeException(
                nameof(longestRecentRunKm), longestRecentRunKm,
                "A maior corrida recente deve ser maior que zero.");

        if (trainingDaysPerWeek is < 3 or > 6)
            throw new ArgumentOutOfRangeException(
                nameof(trainingDaysPerWeek), trainingDaysPerWeek,
                "Os dias de treino por semana devem estar entre 3 e 6.");

        if (currentWeeklyRunningDays is < 0 or > 7)
            throw new ArgumentOutOfRangeException(
                nameof(currentWeeklyRunningDays), currentWeeklyRunningDays,
                "As corridas por semana devem estar entre 0 e 7.");

        if (referenceDistanceKm is <= 0)
            throw new ArgumentOutOfRangeException(
                nameof(referenceDistanceKm), referenceDistanceKm,
                "A distância de referência deve ser maior que zero.");

        if (strengthSessionMinutes is < 20 or > 90)
            throw new ArgumentOutOfRangeException(
                nameof(strengthSessionMinutes), strengthSessionMinutes,
                "A sessão de força deve ter entre 20 e 90 minutos.");

        var duracao = Normalizar(referenceDuration);
        if (duracao is not null && !TimeSpan.TryParseExact(duracao, ReferenceDurationFormat, CultureInfo.InvariantCulture, out _))
            throw new ArgumentException(
                "A duração de referência deve estar no formato HH:MM:SS.", nameof(referenceDuration));

        return new PlanRequest(
            raceDistance,
            raceDate,
            raceIsFirstTime,
            longestRecentRunKm,
            trainingDaysPerWeek,
            currentWeeklyRunningDays,
            referenceDistanceKm,
            duracao,
            strengthSessionMinutes,
            equipmentAccess,
            NormalizarDores(recurringPainAreas),
            Normalizar(priorInjuries));
    }

    /// <summary>
    /// "Nenhuma" é a ausência das demais: sozinha vira lista vazia, acompanhada é
    /// contradição. Repetição é ruído da seleção múltipla, não erro do corredor.
    /// </summary>
    private static IReadOnlyList<PainArea> NormalizarDores(IReadOnlyList<PainArea>? areas)
    {
        if (areas is null || areas.Count == 0)
            return [];

        var distintas = areas.Distinct().ToArray();

        if (!distintas.Contains(PainArea.Nenhuma))
            return distintas;

        if (distintas.Length > 1)
            throw new ArgumentException(
                "\"Nenhuma\" não pode ser combinada com uma dor recorrente.", nameof(areas));

        return [];
    }

    private static string? Normalizar(string? texto)
    {
        var limpo = texto?.Trim();
        return string.IsNullOrEmpty(limpo) ? null : limpo;
    }
}
