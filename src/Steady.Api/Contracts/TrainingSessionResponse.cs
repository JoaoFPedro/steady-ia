namespace Steady.Api.Contracts;

/// <summary>
/// Uma linha do histórico de treino do corredor. Reúne três origens: corrida,
/// musculação avulsa e execução da ficha do personal. A execução da ficha não
/// registra duração nem grupo muscular — por isso `DurationMinutes` é
/// opcional, e `WorkoutType` diz de qual treino da ficha ela veio.
/// `Exercises` só vem no detalhe por id da execução da ficha (ADR-021); a
/// listagem, a corrida e a musculação avulsa não o trazem.
/// </summary>
public sealed record TrainingSessionResponse(
    Guid Id,
    string Type,
    DateOnly Date,
    int? DurationMinutes,
    double? DistanceKm,
    double? AveragePaceMinPerKm,
    int? PerceivedEffort,
    string? MuscleGroup,
    string? Intensity,
    string? WorkoutType = null,
    DateTime? RegisteredAt = null,
    IReadOnlyList<ExerciseExecutionResponse>? Exercises = null);
