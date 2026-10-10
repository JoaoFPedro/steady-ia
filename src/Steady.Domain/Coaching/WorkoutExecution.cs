namespace Steady.Domain.Coaching;

public sealed record ExerciseExecution
{
    public Guid ExerciseId { get; }
    public Guid ExerciseKey { get; }
    public string Name { get; }
    public int Sets { get; }
    public int Repetitions { get; }
    public decimal? LoadKg { get; }
    public string? Note { get; }
    public bool Skipped { get; }
    public int? DurationSeconds { get; }

    private ExerciseExecution(
        Guid exerciseId,
        string name,
        int sets,
        int repetitions,
        decimal? loadKg,
        string? note,
        bool skipped,
        Guid exerciseKey,
        int? durationSeconds)
    {
        ExerciseId = exerciseId;
        ExerciseKey = exerciseKey;
        Name = name;
        Sets = sets;
        Repetitions = repetitions;
        LoadKg = loadKg;
        Note = note;
        Skipped = skipped;
        DurationSeconds = durationSeconds;
    }

    public static ExerciseExecution Executed(
        Guid exerciseId,
        string name,
        int sets,
        int repetitions,
        decimal loadKg,
        string? note,
        Guid? exerciseKey = null,
        int? durationSeconds = null)
    {
        ValidateSnapshot(exerciseId, name, sets, repetitions, exerciseKey, durationSeconds);

        if (loadKg is <= 0 or > 999.99m || decimal.Round(loadKg, 2) != loadKg)
            throw new ArgumentOutOfRangeException(
                nameof(loadKg), loadKg, "A carga deve estar entre 0,01 e 999,99 kg, com até duas casas decimais.");

        return new ExerciseExecution(
            exerciseId, name.Trim(), sets, repetitions, loadKg, NormalizeNote(note), skipped: false,
            exerciseKey ?? exerciseId, durationSeconds);
    }

    public static ExerciseExecution SkippedExercise(
        Guid exerciseId,
        string name,
        int sets,
        int repetitions,
        string? note,
        Guid? exerciseKey = null,
        int? durationSeconds = null)
    {
        ValidateSnapshot(exerciseId, name, sets, repetitions, exerciseKey, durationSeconds);
        return new ExerciseExecution(
            exerciseId, name.Trim(), sets, repetitions, loadKg: null, NormalizeNote(note), skipped: true,
            exerciseKey ?? exerciseId, durationSeconds);
    }

    private static void ValidateSnapshot(
        Guid id, string name, int sets, int repetitions, Guid? exerciseKey, int? durationSeconds) =>
        _ = ExercisePrescription.Create(
            id, name, sets, repetitions, durationSeconds: durationSeconds, exerciseKey: exerciseKey);

    private static string? NormalizeNote(string? note)
    {
        var normalized = note?.Trim();
        if (normalized?.Length > 200)
            throw new ArgumentException("A nota aceita no máximo 200 caracteres.", nameof(note));

        return string.IsNullOrEmpty(normalized) ? null : normalized;
    }
}

public sealed class StrengthWorkoutExecution
{
    public Guid TrainingSheetId { get; }
    public WorkoutType WorkoutType { get; }
    public DateOnly Date { get; }
    public IReadOnlyList<ExerciseExecution> Exercises { get; }

    private StrengthWorkoutExecution(
        Guid trainingSheetId,
        WorkoutType workoutType,
        DateOnly date,
        IReadOnlyList<ExerciseExecution> exercises)
    {
        TrainingSheetId = trainingSheetId;
        WorkoutType = workoutType;
        Date = date;
        Exercises = exercises;
    }

    public static StrengthWorkoutExecution Create(
        Guid trainingSheetId,
        WorkoutType workoutType,
        DateOnly date,
        IReadOnlyList<ExerciseExecution>? exercises)
    {
        if (trainingSheetId == Guid.Empty)
            throw new ArgumentException("A ficha é obrigatória.", nameof(trainingSheetId));

        if (workoutType == WorkoutType.Run)
            throw new ArgumentException("Corrida usa o registro de corrida existente.", nameof(workoutType));

        if (exercises is null || exercises.Count == 0)
            throw new ArgumentException("A execução exige ao menos um exercício.", nameof(exercises));

        if (exercises.Select(exercise => exercise.ExerciseId).Distinct().Count() != exercises.Count)
            throw new ArgumentException("A execução não pode repetir exercício.", nameof(exercises));

        return new StrengthWorkoutExecution(trainingSheetId, workoutType, date, exercises.ToArray());
    }
}
