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
    public Guid Id { get; }
    public string Name { get; }
    public int Sets { get; }
    public int Repetitions { get; }

    private ExercisePrescription(Guid id, string name, int sets, int repetitions)
    {
        Id = id;
        Name = name;
        Sets = sets;
        Repetitions = repetitions;
    }

    public static ExercisePrescription Create(Guid id, string name, int sets, int repetitions)
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

        return new ExercisePrescription(id, normalizedName, sets, repetitions);
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
    public string Description { get; }

    private RunningWorkout(string description) : base(WorkoutType.Run) => Description = description;

    public static RunningWorkout Create(string description)
    {
        var normalized = description?.Trim() ?? string.Empty;
        if (normalized.Length == 0)
            throw new ArgumentException("A descrição da corrida é obrigatória.", nameof(description));

        return new RunningWorkout(normalized);
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

