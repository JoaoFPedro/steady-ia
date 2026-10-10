using Steady.Domain.Common;

namespace Steady.Domain.Adherence;

public enum WorkoutAdherenceStatus
{
    Adherent,
    Divergent,
    PrescriptionConflict,
    InsufficientData
}

public enum AuthorizedAction
{
    Maintain,
    ReduceLoad,
    PrioritizeRecovery
}

public sealed record RunningAdherencePrescription(
    NumericRange<double>? DistanceKm,
    NumericRange<int>? DurationMinutes,
    NumericRange<int>? PerceivedEffort)
{
    public static RunningAdherencePrescription Create(
        NumericRange<double>? distanceKm,
        NumericRange<int>? durationMinutes,
        NumericRange<int>? perceivedEffort) => new(distanceKm, durationMinutes, perceivedEffort);
}

public sealed record RunningAdherenceExecution(
    bool Completed,
    double DistanceKm,
    int DurationMinutes,
    int PerceivedEffort);

public sealed record RunningAdherenceResult(
    WorkoutAdherenceStatus Status,
    FieldComparison Completion,
    FieldComparison Distance,
    FieldComparison Duration,
    FieldComparison PerceivedEffort);

public sealed record ResolvedRunningPrescription(
    bool HasConflict,
    RunningAdherencePrescription? Prescription);

public sealed record StrengthExerciseAdherencePrescription(
    Guid ExerciseKey,
    string Name,
    int Sets,
    int Repetitions)
{
    public static StrengthExerciseAdherencePrescription Create(
        Guid exerciseKey, string name, int sets, int repetitions)
    {
        if (exerciseKey == Guid.Empty) throw new ArgumentException("A identidade do exercício é obrigatória.");
        return new StrengthExerciseAdherencePrescription(exerciseKey, name, sets, repetitions);
    }
}

public sealed record StrengthExerciseAdherenceExecution(
    Guid ExerciseKey,
    string Name,
    bool Completed,
    int Sets,
    int Repetitions,
    decimal? LoadKg)
{
    public static StrengthExerciseAdherenceExecution Skipped(
        Guid exerciseKey, string name, int sets, int repetitions) =>
        new(exerciseKey, name, false, sets, repetitions, null);

    public static StrengthExerciseAdherenceExecution Executed(
        Guid exerciseKey, string name, int sets, int repetitions, decimal loadKg) =>
        new(exerciseKey, name, true, sets, repetitions, loadKg);
}

public sealed record StrengthExerciseAdherenceResult(
    FieldComparison Completion,
    FieldComparison Sets,
    FieldComparison Repetitions,
    FieldComparison Load)
{
    public WorkoutAdherenceStatus Status =>
        new[] { Completion, Sets, Repetitions, Load }.Any(comparison =>
            comparison.Status == FieldAdherenceStatus.Divergent)
            ? WorkoutAdherenceStatus.Divergent
            : WorkoutAdherenceStatus.Adherent;
}

public static class WorkoutAdherenceComparer
{
    public static RunningAdherenceResult CompareRunning(
        RunningAdherencePrescription prescription,
        RunningAdherenceExecution execution,
        AdherencePolicyVersion policy)
    {
        var completion = new FieldComparison(
            execution.Completed ? FieldAdherenceStatus.Adherent : FieldAdherenceStatus.Divergent,
            1, null, execution.Completed ? 1 : 0, execution.Completed ? 0 : -1);
        var distance = policy.CompareRunningDistance(prescription.DistanceKm, execution.DistanceKm);
        var duration = policy.CompareRunningDuration(prescription.DurationMinutes, execution.DurationMinutes);
        var effort = policy.ComparePerceivedEffort(prescription.PerceivedEffort, execution.PerceivedEffort);
        var fields = new[] { completion, distance, duration, effort };
        var comparable = fields.Any(field => field.Status != FieldAdherenceStatus.NotComparable);
        var status = !comparable
            ? WorkoutAdherenceStatus.InsufficientData
            : fields.Any(field => field.Status == FieldAdherenceStatus.Divergent)
                ? WorkoutAdherenceStatus.Divergent
                : WorkoutAdherenceStatus.Adherent;

        return new RunningAdherenceResult(status, completion, distance, duration, effort);
    }

    public static ResolvedRunningPrescription ResolveRunningPrescription(
        RunningAdherencePrescription plan,
        RunningAdherencePrescription sheet)
    {
        if (Disjoint(plan.DistanceKm, sheet.DistanceKm) ||
            Disjoint(plan.DurationMinutes, sheet.DurationMinutes) ||
            Disjoint(plan.PerceivedEffort, sheet.PerceivedEffort))
            return new ResolvedRunningPrescription(true, null);

        return new ResolvedRunningPrescription(false, Merge(plan, sheet));
    }

    public static StrengthExerciseAdherenceResult CompareStrengthExercise(
        StrengthExerciseAdherencePrescription prescription,
        StrengthExerciseAdherenceExecution execution,
        decimal? historicalMedianLoad,
        AdherencePolicyVersion policy)
    {
        if (prescription.ExerciseKey != execution.ExerciseKey)
            throw new ArgumentException("A execução não pertence ao exercício prescrito.");

        var completion = new FieldComparison(
            execution.Completed ? FieldAdherenceStatus.Adherent : FieldAdherenceStatus.Divergent,
            1, null, execution.Completed ? 1 : 0, execution.Completed ? 0 : -1);

        return new StrengthExerciseAdherenceResult(
            completion,
            policy.CompareSets(prescription.Sets, execution.Sets),
            policy.CompareRepetitions(prescription.Repetitions, execution.Repetitions),
            policy.CompareLoad(historicalMedianLoad, execution.LoadKg));
    }

    private static RunningAdherencePrescription Merge(
        RunningAdherencePrescription plan, RunningAdherencePrescription sheet) =>
        new(
            Intersect(plan.DistanceKm, sheet.DistanceKm),
            Intersect(plan.DurationMinutes, sheet.DurationMinutes),
            Intersect(plan.PerceivedEffort, sheet.PerceivedEffort));

    private static NumericRange<T>? Intersect<T>(NumericRange<T>? left, NumericRange<T>? right)
        where T : struct, IComparable<T>
    {
        if (left is null) return right;
        if (right is null) return left;
        var min = left.Value.Min.CompareTo(right.Value.Min) >= 0 ? left.Value.Min : right.Value.Min;
        var leftMax = left.Value.Max ?? left.Value.Min;
        var rightMax = right.Value.Max ?? right.Value.Min;
        var max = leftMax.CompareTo(rightMax) <= 0 ? leftMax : rightMax;
        return min.CompareTo(max) == 0 ? NumericRange<T>.Create(min) : NumericRange<T>.Create(min, max);
    }

    private static bool Disjoint<T>(NumericRange<T>? left, NumericRange<T>? right)
        where T : struct, IComparable<T>
    {
        if (left is null || right is null) return false;
        var leftMax = left.Value.Max ?? left.Value.Min;
        var rightMax = right.Value.Max ?? right.Value.Min;
        return leftMax.CompareTo(right.Value.Min) < 0 || rightMax.CompareTo(left.Value.Min) < 0;
    }
}

public static class SafetyPolicy
{
    public static AuthorizedAction? Authorize(
        WorkoutAdherenceStatus status,
        bool hasComparableField,
        bool painReportedAtCompletion,
        double? prescribedLoad,
        double? executedLoad,
        bool overloadAlreadyDetected)
    {
        if (painReportedAtCompletion) return AuthorizedAction.PrioritizeRecovery;
        if (status is WorkoutAdherenceStatus.PrescriptionConflict or WorkoutAdherenceStatus.InsufficientData)
            return null;
        if (!hasComparableField) return null;
        if (overloadAlreadyDetected) return AuthorizedAction.ReduceLoad;
        if (prescribedLoad is > 0 && executedLoad + 0.0000001 >= prescribedLoad * 1.10)
            return AuthorizedAction.ReduceLoad;
        return AuthorizedAction.Maintain;
    }
}
