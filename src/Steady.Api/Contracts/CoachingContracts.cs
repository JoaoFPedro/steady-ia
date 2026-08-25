namespace Steady.Api.Contracts;

public sealed record CurrentAccountResponse(Guid Id, IReadOnlyList<string> Roles);

public sealed record RunnerSearchResponse(Guid CorredorId, string Email, bool Available);
public sealed record CreateCoachingLinkBody(Guid CorredorId);
public sealed record CoachingLinkResponse(
    Guid Id,
    Guid PersonalId,
    Guid CorredorId,
    string Status,
    DateTime RequestedAt);
public sealed record LinkedRunnerResponse(Guid LinkId, Guid CorredorId, string Email);

public sealed record ExercisePrescriptionBody(string Name, int Sets, int Repetitions);
public sealed record PublishTrainingSheetBody(
    IReadOnlyList<ExercisePrescriptionBody>? Push,
    IReadOnlyList<ExercisePrescriptionBody>? Pull,
    IReadOnlyList<ExercisePrescriptionBody>? Lower,
    string? RunDescription);

public sealed record ExercisePrescriptionResponse(
    Guid Id,
    string Name,
    int Sets,
    int Repetitions,
    decimal? SuggestedLoadKg);
public sealed record WorkoutPrescriptionResponse(
    string Type,
    IReadOnlyList<ExercisePrescriptionResponse> Exercises,
    string? Description);
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
