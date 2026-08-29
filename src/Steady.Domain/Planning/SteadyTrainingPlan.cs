using Steady.Domain.Coaching;

namespace Steady.Domain.Planning;

public sealed record PlanPrinciple(string Intro, IReadOnlyList<string> Points);
public sealed record PlanPhase(string Name, string Weeks, string RunFocus, string StrengthFocus);
public sealed record PlanWeekdayFocus(string Day, string StrengthFocus, string? RunLabel);
public sealed record PlanExercise(string Name, string Series);
public sealed record PlanTaperAdjustment(string Title, string Intro, IReadOnlyList<string> Items);
public sealed record PlanLongRunProgression(string Phase, string Range);
public sealed record PlanMobilityBlock(string Title, IReadOnlyList<PlanExercise> Items);
public sealed record PlanGoldenRule(string Number, string Text);

/// <summary>
/// Um dia do split semanal (ADR-013). <see cref="Run"/> só existe quando
/// <see cref="HasRun"/> é verdadeiro — hoje sempre só com descrição, porque a
/// fonte só declara número por fase (<see cref="PlanLongRunProgression"/>),
/// nunca por dia; promover isso exigiria escolher uma fase, que é cálculo de
/// progressão e não pertence a esta story.
/// </summary>
public sealed record PlanWeekDay(
    string Day,
    string Focus,
    bool HasRun,
    string? RunLabel,
    string Intro,
    string? RunNote,
    IReadOnlyList<PlanExercise> Exercises,
    RunPrescription? Run);

/// <summary>
/// Conteúdo do plano que não carrega nenhuma regra de domínio — transcrição
/// literal do documento estático, agrupada à parte de <see cref="SteadyTrainingPlan.WeekPlan"/>
/// para não inflar o construtor com texto de exibição.
/// </summary>
public sealed record PlanStaticContent(
    string Title,
    string Subtitle,
    PlanPrinciple Principle,
    IReadOnlyList<PlanPhase> Phases,
    string PhaseCycleNote,
    IReadOnlyList<PlanWeekdayFocus> WeekOverview,
    string WeekOverviewNote,
    PlanTaperAdjustment TaperAdjustment,
    IReadOnlyList<PlanLongRunProgression> LongRunProgression,
    IReadOnlyList<PlanMobilityBlock> Mobility,
    IReadOnlyList<PlanGoldenRule> GoldenRules,
    string PaceNote);

/// <summary>
/// Plano do Steady persistido no servidor (ADR-013). Versionado e imutável:
/// uma publicação nova nunca reescreve uma versão existente nem realoca um
/// corredor já associado a ela.
/// </summary>
public sealed class SteadyTrainingPlan
{
    private const int ExpectedWeekDays = 7;

    public int Version { get; }
    public IReadOnlyList<PlanWeekDay> WeekPlan { get; }
    public PlanStaticContent Content { get; }

    private SteadyTrainingPlan(int version, IReadOnlyList<PlanWeekDay> weekPlan, PlanStaticContent content)
    {
        Version = version;
        WeekPlan = weekPlan;
        Content = content;
    }

    public static SteadyTrainingPlan Create(
        int version, IReadOnlyList<PlanWeekDay> weekPlan, PlanStaticContent content)
    {
        if (version <= 0)
            throw new ArgumentOutOfRangeException(nameof(version), version, "A versão deve ser maior que zero.");

        if (weekPlan is null || weekPlan.Count != ExpectedWeekDays)
            throw new ArgumentException("O plano exige os sete dias da semana.", nameof(weekPlan));

        foreach (var day in weekPlan)
        {
            if (day.HasRun && day.Run is null)
                throw new ArgumentException(
                    $"O dia '{day.Day}' marca corrida mas não traz prescrição.", nameof(weekPlan));

            if (!day.HasRun && day.Run is not null)
                throw new ArgumentException(
                    $"O dia '{day.Day}' não marca corrida mas traz prescrição.", nameof(weekPlan));
        }

        ArgumentNullException.ThrowIfNull(content);

        return new SteadyTrainingPlan(version, weekPlan, content);
    }
}
