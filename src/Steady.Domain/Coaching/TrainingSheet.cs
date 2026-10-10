using Steady.Domain.Common;

namespace Steady.Domain.Coaching;

public enum WorkoutType
{
    Push,
    Pull,
    Lower,
    Run
}

public sealed record ExercisePrescription
{
    private const int ObservationMaxLength = 200;

    public Guid Id { get; }
    public Guid ExerciseKey { get; }
    public string Name { get; }
    public int Sets { get; }
    public int Repetitions { get; }

    /// <summary>
    /// Tempo prescrito da série, em segundos (STORY-017). Opcional e
    /// independente: acompanha séries e repetições, nunca as substitui.
    /// Ausente é ausência, nunca zero (ADR-012).
    /// </summary>
    public int? DurationSeconds { get; }

    /// <summary>
    /// Observação do personal sobre a execução do exercício (STORY-017).
    /// Instrução, não medida — não se confunde com
    /// <see cref="ExerciseExecution.Note"/>, que é do corredor.
    /// </summary>
    public string? Observation { get; }

    private ExercisePrescription(
        Guid id,
        string name,
        int sets,
        int repetitions,
        int? durationSeconds,
        string? observation,
        Guid exerciseKey)
    {
        Id = id;
        ExerciseKey = exerciseKey;
        Name = name;
        Sets = sets;
        Repetitions = repetitions;
        DurationSeconds = durationSeconds;
        Observation = observation;
    }

    public static ExercisePrescription Create(
        Guid id,
        string name,
        int sets,
        int repetitions,
        int? durationSeconds = null,
        string? observation = null,
        Guid? exerciseKey = null)
    {
        var normalizedName = name?.Trim() ?? string.Empty;

        if (id == Guid.Empty)
            throw new ArgumentException("O identificador do exercício é obrigatório.", nameof(id));

        if (normalizedName.Length is < 2 or > 100)
            throw new ArgumentException("O nome do exercício deve ter entre 2 e 100 caracteres.", nameof(name));

        if (sets is < 1 or > 20)
            throw new ArgumentOutOfRangeException(nameof(sets), sets, "As séries devem estar entre 1 e 20.");

        if (repetitions is < 1 or > 100)
            throw new ArgumentOutOfRangeException(
                nameof(repetitions), repetitions, "As repetições devem estar entre 1 e 100.");

        if (durationSeconds is <= 0)
            throw new ArgumentOutOfRangeException(
                nameof(durationSeconds), durationSeconds, "O tempo deve ser maior que zero.");

        if (exerciseKey == Guid.Empty)
            throw new ArgumentException("A identidade histórica do exercício é obrigatória.", nameof(exerciseKey));

        return new ExercisePrescription(
            id, normalizedName, sets, repetitions, durationSeconds,
            NormalizeObservation(observation), exerciseKey ?? id);
    }

    private static string? NormalizeObservation(string? observation)
    {
        var normalized = observation?.Trim();
        if (normalized?.Length > ObservationMaxLength)
            throw new ArgumentException(
                $"A observação aceita no máximo {ObservationMaxLength} caracteres.", nameof(observation));

        return string.IsNullOrEmpty(normalized) ? null : normalized;
    }
}

/// <summary>
/// Prescrição de corrida de um dia (ADR-012). A descrição livre é obrigatória
/// e continua sendo a instrução que o corredor lê primeiro; os três campos
/// numéricos são opcionais e independentes entre si — o que o personal deixar
/// em branco fica ausente, nunca inferido da descrição.
/// </summary>
public sealed record RunPrescription
{
    public string Description { get; }
    public NumericRange<double>? DistanceKm { get; }
    public NumericRange<int>? DurationMinutes { get; }
    public NumericRange<int>? PerceivedEffort { get; }

    private RunPrescription(
        string description,
        NumericRange<double>? distanceKm,
        NumericRange<int>? durationMinutes,
        NumericRange<int>? perceivedEffort)
    {
        Description = description;
        DistanceKm = distanceKm;
        DurationMinutes = durationMinutes;
        PerceivedEffort = perceivedEffort;
    }

    public static RunPrescription Create(
        string description,
        double? distanceKmMin = null,
        double? distanceKmMax = null,
        int? durationMinutesMin = null,
        int? durationMinutesMax = null,
        int? perceivedEffortMin = null,
        int? perceivedEffortMax = null)
    {
        var normalizedDescription = description?.Trim() ?? string.Empty;
        if (normalizedDescription.Length == 0)
            throw new ArgumentException("A descrição da corrida é obrigatória.", nameof(description));

        return new RunPrescription(
            normalizedDescription,
            BuildRange(distanceKmMin, distanceKmMax, min => min <= 0
                ? throw new ArgumentOutOfRangeException(
                    nameof(distanceKmMin), min, "A distância deve ser maior que zero.")
                : min),
            BuildRange(durationMinutesMin, durationMinutesMax, min => min <= 0
                ? throw new ArgumentOutOfRangeException(
                    nameof(durationMinutesMin), min, "A duração deve ser maior que zero.")
                : min),
            BuildRange(perceivedEffortMin, perceivedEffortMax, min => min is < 1 or > 10
                ? throw new ArgumentOutOfRangeException(
                    nameof(perceivedEffortMin), min, "A percepção de esforço deve estar entre 1 e 10.")
                : min));
    }

    private static NumericRange<T>? BuildRange<T>(T? min, T? max, Func<T, T> validateMin)
        where T : struct, IComparable<T>
    {
        if (min is null)
        {
            if (max is not null)
                throw new ArgumentException("O máximo exige um mínimo correspondente.", nameof(max));

            return null;
        }

        return NumericRange<T>.Create(validateMin(min.Value), max);
    }
}

public abstract class WorkoutPrescription
{
    public WorkoutType Type { get; }

    protected WorkoutPrescription(WorkoutType type) => Type = type;
}

public sealed class StrengthWorkout : WorkoutPrescription
{
    public IReadOnlyList<ExercisePrescription> Exercises { get; }

    private StrengthWorkout(WorkoutType type, IReadOnlyList<ExercisePrescription> exercises)
        : base(type) => Exercises = exercises;

    public static StrengthWorkout Create(
        WorkoutType type, IReadOnlyList<ExercisePrescription>? exercises)
    {
        if (type == WorkoutType.Run)
            throw new ArgumentException("Corrida não contém exercícios de musculação.", nameof(type));

        if (exercises is null || exercises.Count == 0)
            throw new ArgumentException("O treino de musculação exige ao menos um exercício.", nameof(exercises));

        if (exercises.Select(exercise => exercise.Id).Distinct().Count() != exercises.Count)
            throw new ArgumentException("A ficha não pode repetir o mesmo exercício.", nameof(exercises));

        return new StrengthWorkout(type, exercises.ToArray());
    }
}

public sealed class RunningWorkout : WorkoutPrescription
{
    public RunPrescription Tuesday { get; }
    public RunPrescription Thursday { get; }
    public RunPrescription Saturday { get; }

    private RunningWorkout(
        RunPrescription tuesday,
        RunPrescription thursday,
        RunPrescription saturday) : base(WorkoutType.Run)
    {
        Tuesday = tuesday;
        Thursday = thursday;
        Saturday = saturday;
    }

    public static RunningWorkout Create(
        RunPrescription tuesday,
        RunPrescription thursday,
        RunPrescription saturday)
    {
        ArgumentNullException.ThrowIfNull(tuesday);
        ArgumentNullException.ThrowIfNull(thursday);
        ArgumentNullException.ThrowIfNull(saturday);

        return new RunningWorkout(tuesday, thursday, saturday);
    }
}

public sealed class TrainingSheet
{
    public Guid Id { get; }
    public IReadOnlyList<WorkoutPrescription> Workouts { get; }

    private TrainingSheet(Guid id, IReadOnlyList<WorkoutPrescription> workouts)
    {
        Id = id;
        Workouts = workouts;
    }

    public static TrainingSheet Create(
        Guid id,
        StrengthWorkout push,
        StrengthWorkout pull,
        StrengthWorkout lower,
        RunningWorkout run)
    {
        if (id == Guid.Empty)
            throw new ArgumentException("O identificador da ficha é obrigatório.", nameof(id));

        if (push.Type != WorkoutType.Push || pull.Type != WorkoutType.Pull || lower.Type != WorkoutType.Lower)
            throw new ArgumentException("A ficha exige Empurrada, Puxada e Inferiores nos tipos corretos.");

        return new TrainingSheet(id, [push, pull, lower, run]);
    }

    public WorkoutPrescription Workout(WorkoutType type) =>
        Workouts.Single(workout => workout.Type == type);

    public ExercisePrescription Exercise(WorkoutType type, Guid exerciseId)
    {
        if (Workout(type) is not StrengthWorkout strength)
            throw new ArgumentException("Corrida não possui exercício de musculação.", nameof(type));

        return strength.Exercises.Single(exercise => exercise.Id == exerciseId);
    }
}
