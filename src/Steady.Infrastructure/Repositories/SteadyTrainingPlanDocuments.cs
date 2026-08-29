using System.Text.Json;
using Steady.Domain.Coaching;
using Steady.Domain.Common;
using Steady.Domain.Planning;

namespace Steady.Infrastructure.Repositories;

/// <summary>
/// Serialização do plano do Steady (ADR-013) — mesmo papel que
/// <see cref="TrainingSheetDocuments"/> exerce para a ficha do personal.
/// </summary>
public static class SteadyTrainingPlanDocuments
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private sealed record NumericRangeDocument<T>(T Min, T? Max) where T : struct;

    private sealed record RunPrescriptionDocument(
        string Description,
        NumericRangeDocument<double>? DistanceKm,
        NumericRangeDocument<int>? DurationMinutes,
        NumericRangeDocument<int>? PerceivedEffort);

    private sealed record ExerciseDocument(string Name, string Series);
    private sealed record PrincipleDocument(string Intro, IReadOnlyList<string> Points);
    private sealed record PhaseDocument(string Name, string Weeks, string RunFocus, string StrengthFocus);
    private sealed record WeekdayFocusDocument(string Day, string StrengthFocus, string? RunLabel);
    private sealed record WeekDayDocument(
        string Day,
        string Focus,
        bool HasRun,
        string? RunLabel,
        string Intro,
        string? RunNote,
        IReadOnlyList<ExerciseDocument> Exercises,
        RunPrescriptionDocument? Run);
    private sealed record TaperAdjustmentDocument(string Title, string Intro, IReadOnlyList<string> Items);
    private sealed record LongRunProgressionDocument(string Phase, string Range);
    private sealed record MobilityBlockDocument(string Title, IReadOnlyList<ExerciseDocument> Items);
    private sealed record GoldenRuleDocument(string Number, string Text);

    private sealed record PlanDocument(
        string Title,
        string Subtitle,
        PrincipleDocument Principle,
        IReadOnlyList<PhaseDocument> Phases,
        string PhaseCycleNote,
        IReadOnlyList<WeekdayFocusDocument> WeekOverview,
        string WeekOverviewNote,
        IReadOnlyList<WeekDayDocument> WeekPlan,
        TaperAdjustmentDocument TaperAdjustment,
        IReadOnlyList<LongRunProgressionDocument> LongRunProgression,
        IReadOnlyList<MobilityBlockDocument> Mobility,
        IReadOnlyList<GoldenRuleDocument> GoldenRules,
        string PaceNote);

    public static string Serialize(SteadyTrainingPlan plan)
    {
        var content = plan.Content;
        var document = new PlanDocument(
            content.Title,
            content.Subtitle,
            new PrincipleDocument(content.Principle.Intro, content.Principle.Points),
            content.Phases.Select(phase =>
                new PhaseDocument(phase.Name, phase.Weeks, phase.RunFocus, phase.StrengthFocus)).ToArray(),
            content.PhaseCycleNote,
            content.WeekOverview.Select(item =>
                new WeekdayFocusDocument(item.Day, item.StrengthFocus, item.RunLabel)).ToArray(),
            content.WeekOverviewNote,
            plan.WeekPlan.Select(ToDocument).ToArray(),
            new TaperAdjustmentDocument(
                content.TaperAdjustment.Title, content.TaperAdjustment.Intro, content.TaperAdjustment.Items),
            content.LongRunProgression.Select(item =>
                new LongRunProgressionDocument(item.Phase, item.Range)).ToArray(),
            content.Mobility.Select(block =>
                new MobilityBlockDocument(block.Title, block.Items.Select(ToDocument).ToArray())).ToArray(),
            content.GoldenRules.Select(rule => new GoldenRuleDocument(rule.Number, rule.Text)).ToArray(),
            content.PaceNote);

        return JsonSerializer.Serialize(document, JsonOptions);
    }

    public static SteadyTrainingPlan Deserialize(int version, string json)
    {
        var document = JsonSerializer.Deserialize<PlanDocument>(json, JsonOptions)
            ?? throw new InvalidOperationException("Documento de plano inválido.");

        var content = new PlanStaticContent(
            document.Title,
            document.Subtitle,
            new PlanPrinciple(document.Principle.Intro, document.Principle.Points),
            document.Phases.Select(phase =>
                new PlanPhase(phase.Name, phase.Weeks, phase.RunFocus, phase.StrengthFocus)).ToArray(),
            document.PhaseCycleNote,
            document.WeekOverview.Select(item =>
                new PlanWeekdayFocus(item.Day, item.StrengthFocus, item.RunLabel)).ToArray(),
            document.WeekOverviewNote,
            new PlanTaperAdjustment(
                document.TaperAdjustment.Title, document.TaperAdjustment.Intro, document.TaperAdjustment.Items),
            document.LongRunProgression.Select(item =>
                new PlanLongRunProgression(item.Phase, item.Range)).ToArray(),
            document.Mobility.Select(block =>
                new PlanMobilityBlock(block.Title, block.Items.Select(FromDocument).ToArray())).ToArray(),
            document.GoldenRules.Select(rule => new PlanGoldenRule(rule.Number, rule.Text)).ToArray(),
            document.PaceNote);

        var weekPlan = document.WeekPlan.Select(FromDocument).ToArray();

        return SteadyTrainingPlan.Create(version, weekPlan, content);
    }

    private static WeekDayDocument ToDocument(PlanWeekDay day) => new(
        day.Day,
        day.Focus,
        day.HasRun,
        day.RunLabel,
        day.Intro,
        day.RunNote,
        day.Exercises.Select(ToDocument).ToArray(),
        day.Run is null ? null : ToDocument(day.Run));

    private static PlanWeekDay FromDocument(WeekDayDocument document) => new(
        document.Day,
        document.Focus,
        document.HasRun,
        document.RunLabel,
        document.Intro,
        document.RunNote,
        document.Exercises.Select(FromDocument).ToArray(),
        document.Run is null ? null : FromDocument(document.Run));

    private static ExerciseDocument ToDocument(PlanExercise exercise) => new(exercise.Name, exercise.Series);
    private static PlanExercise FromDocument(ExerciseDocument document) => new(document.Name, document.Series);

    private static RunPrescriptionDocument ToDocument(RunPrescription prescription) => new(
        prescription.Description,
        ToDocument(prescription.DistanceKm),
        ToDocument(prescription.DurationMinutes),
        ToDocument(prescription.PerceivedEffort));

    private static RunPrescription FromDocument(RunPrescriptionDocument document) => RunPrescription.Create(
        document.Description,
        document.DistanceKm?.Min, document.DistanceKm?.Max,
        document.DurationMinutes?.Min, document.DurationMinutes?.Max,
        document.PerceivedEffort?.Min, document.PerceivedEffort?.Max);

    private static NumericRangeDocument<T>? ToDocument<T>(NumericRange<T>? range)
        where T : struct, IComparable<T> =>
        range is { } value ? new NumericRangeDocument<T>(value.Min, value.Max) : null;
}
