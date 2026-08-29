using Steady.Api.Contracts;
using Steady.Domain.Common;
using Steady.Domain.Coaching;
using Steady.Domain.Planning;

namespace Steady.Api.Endpoints;

/// <summary>Conversão pura do domínio do plano para o contrato HTTP (mesmo papel que <see cref="TrainingSheetMapping"/>).</summary>
internal static class TrainingPlanMapping
{
    public static SteadyTrainingPlanResponse Respond(SteadyTrainingPlan plan)
    {
        var content = plan.Content;
        return new SteadyTrainingPlanResponse(
            plan.Version,
            content.Title,
            content.Subtitle,
            new PlanPrincipleResponse(content.Principle.Intro, content.Principle.Points),
            content.Phases.Select(phase =>
                new PlanPhaseResponse(phase.Name, phase.Weeks, phase.RunFocus, phase.StrengthFocus)).ToArray(),
            content.PhaseCycleNote,
            content.WeekOverview.Select(item =>
                new PlanWeekdayFocusResponse(item.Day, item.StrengthFocus, item.RunLabel)).ToArray(),
            content.WeekOverviewNote,
            plan.WeekPlan.Select(Respond).ToArray(),
            new PlanTaperAdjustmentResponse(
                content.TaperAdjustment.Title, content.TaperAdjustment.Intro, content.TaperAdjustment.Items),
            content.LongRunProgression.Select(item =>
                new PlanLongRunProgressionResponse(item.Phase, item.Range)).ToArray(),
            content.Mobility.Select(block =>
                new PlanMobilityBlockResponse(block.Title, block.Items.Select(Respond).ToArray())).ToArray(),
            content.GoldenRules.Select(rule => new PlanGoldenRuleResponse(rule.Number, rule.Text)).ToArray(),
            content.PaceNote);
    }

    private static PlanWeekDayResponse Respond(PlanWeekDay day) => new(
        day.Day,
        day.Focus,
        day.HasRun,
        day.RunLabel,
        day.Intro,
        day.RunNote,
        day.Exercises.Select(Respond).ToArray(),
        day.Run is null ? null : Respond(day.Run));

    private static PlanExerciseResponse Respond(PlanExercise exercise) => new(exercise.Name, exercise.Series);

    private static RunPrescriptionResponse Respond(RunPrescription prescription) => new(
        prescription.Description,
        Respond(prescription.DistanceKm),
        Respond(prescription.DurationMinutes),
        Respond(prescription.PerceivedEffort));

    private static NumericRangeResponse? Respond(NumericRange<double>? range) =>
        range is { } value ? new NumericRangeResponse(value.Min, value.Max) : null;

    private static IntRangeResponse? Respond(NumericRange<int>? range) =>
        range is { } value ? new IntRangeResponse(value.Min, value.Max) : null;
}
