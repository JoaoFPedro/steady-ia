namespace Steady.Api.Contracts;

public sealed record PlanExerciseResponse(string Name, string Series);
public sealed record PlanPrincipleResponse(string Intro, IReadOnlyList<string> Points);
public sealed record PlanPhaseResponse(string Name, string Weeks, string RunFocus, string StrengthFocus);
public sealed record PlanWeekdayFocusResponse(string Day, string StrengthFocus, string? RunLabel);
public sealed record PlanTaperAdjustmentResponse(string Title, string Intro, IReadOnlyList<string> Items);
public sealed record PlanLongRunProgressionResponse(string Phase, string Range);
public sealed record PlanMobilityBlockResponse(string Title, IReadOnlyList<PlanExerciseResponse> Items);
public sealed record PlanGoldenRuleResponse(string Number, string Text);

public sealed record PlanWeekDayResponse(
    string Day,
    string Focus,
    bool HasRun,
    string? RunLabel,
    string Intro,
    string? RunNote,
    IReadOnlyList<PlanExerciseResponse> Exercises,
    RunPrescriptionResponse? Run);

public sealed record SteadyTrainingPlanResponse(
    int Version,
    string Title,
    string Subtitle,
    PlanPrincipleResponse Principle,
    IReadOnlyList<PlanPhaseResponse> Phases,
    string PhaseCycleNote,
    IReadOnlyList<PlanWeekdayFocusResponse> WeekOverview,
    string WeekOverviewNote,
    IReadOnlyList<PlanWeekDayResponse> WeekPlan,
    PlanTaperAdjustmentResponse TaperAdjustment,
    IReadOnlyList<PlanLongRunProgressionResponse> LongRunProgression,
    IReadOnlyList<PlanMobilityBlockResponse> Mobility,
    IReadOnlyList<PlanGoldenRuleResponse> GoldenRules,
    string PaceNote);
