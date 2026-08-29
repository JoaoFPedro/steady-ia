namespace Steady.Api.Contracts;

public sealed record CurrentAccountResponse(Guid Id, IReadOnlyList<string> Roles);

/// <summary>`Name` é cache do provedor e pode faltar — o app cai no e-mail (STORY-019).</summary>
public sealed record RunnerSearchResponse(
    Guid CorredorId, string Email, bool Available, string? Name);
public sealed record CreateCoachingLinkBody(Guid CorredorId);
public sealed record CoachingLinkResponse(
    Guid Id,
    Guid PersonalId,
    Guid CorredorId,
    string Status,
    DateTime RequestedAt);
public sealed record LinkedRunnerResponse(
    Guid LinkId, Guid CorredorId, string Email, string? Name);

/// <summary>
/// `DurationSeconds` (segundos) e `Observation` são opcionais (STORY-017):
/// ausentes significam não prescritos, nunca zero nem texto vazio (ADR-012).
/// </summary>
public sealed record ExercisePrescriptionBody(
    string Name,
    int Sets,
    int Repetitions,
    int? DurationSeconds = null,
    string? Observation = null);

/// <summary>Faixa opcional: mínimo obrigatório, máximo ausente = alvo exato (ADR-012).</summary>
public sealed record NumericRangeBody(double Min, double? Max);
public sealed record IntRangeBody(int Min, int? Max);
public sealed record RunPrescriptionBody(
    string Description,
    NumericRangeBody? DistanceKm,
    IntRangeBody? DurationMinutes,
    IntRangeBody? PerceivedEffort);
public sealed record PublishTrainingSheetBody(
    IReadOnlyList<ExercisePrescriptionBody>? Push,
    IReadOnlyList<ExercisePrescriptionBody>? Pull,
    IReadOnlyList<ExercisePrescriptionBody>? Lower,
    RunPrescriptionBody? TuesdayRun,
    RunPrescriptionBody? ThursdayRun,
    RunPrescriptionBody? SaturdayRun);

public sealed record ExercisePrescriptionResponse(
    Guid Id,
    string Name,
    int Sets,
    int Repetitions,
    decimal? SuggestedLoadKg,
    int? DurationSeconds,
    string? Observation);
public sealed record NumericRangeResponse(double Min, double? Max);
public sealed record IntRangeResponse(int Min, int? Max);
public sealed record RunPrescriptionResponse(
    string Description,
    NumericRangeResponse? DistanceKm,
    IntRangeResponse? DurationMinutes,
    IntRangeResponse? PerceivedEffort);
public sealed record WorkoutPrescriptionResponse(
    string Type,
    IReadOnlyList<ExercisePrescriptionResponse> Exercises,
    RunningPrescriptionsResponse? RunDescriptions);
public sealed record RunningPrescriptionsResponse(
    RunPrescriptionResponse Tuesday,
    RunPrescriptionResponse Thursday,
    RunPrescriptionResponse Saturday);
public sealed record TrainingSheetResponse(
    Guid Id,
    Guid CorredorId,
    DateTime CreatedAt,
    IReadOnlyList<WorkoutPrescriptionResponse> Workouts);

public sealed record ExerciseExecutionBody(
    Guid ExerciseId,
    decimal? LoadKg,
    string? Note,
    bool Skipped);
public sealed record StrengthWorkoutExecutionBody(
    Guid TrainingSheetId,
    string WorkoutType,
    string Date,
    IReadOnlyList<ExerciseExecutionBody>? Exercises);
public sealed record CombinedWorkoutExecutionBody(
    StrengthWorkoutExecutionBody Strength,
    RunningSessionRequest Running);
public sealed record ExerciseExecutionResponse(
    Guid ExerciseId,
    string Name,
    int Sets,
    int Repetitions,
    decimal? LoadKg,
    string? Note,
    bool Skipped);
public sealed record StrengthWorkoutExecutionResponse(
    Guid Id,
    Guid TrainingSheetId,
    string WorkoutType,
    string Date,
    IReadOnlyList<ExerciseExecutionResponse> Exercises,
    DateTime CreatedAt);
public sealed record RunningHistoryResponse(
    Guid Id,
    DateOnly Date,
    double DistanceKm,
    int DurationMinutes,
    double AveragePaceMinPerKm,
    int PerceivedEffort);
public sealed record CoachingHistoryResponse(
    IReadOnlyList<StrengthWorkoutExecutionResponse> StrengthExecutions,
    IReadOnlyList<RunningHistoryResponse> RunningSessions);
