using Steady.Domain.Common;

namespace Steady.Domain.Adherence;

public enum FieldAdherenceStatus
{
    Adherent,
    Divergent,
    NotComparable
}

public sealed record FieldComparison(
    FieldAdherenceStatus Status,
    double? PrescribedMin,
    double? PrescribedMax,
    double? Executed,
    double? Difference)
{
    public static FieldComparison NotComparable(double? executed = null) =>
        new(FieldAdherenceStatus.NotComparable, null, null, executed, null);
}

public sealed class AdherencePolicyVersion
{
    public int Version { get; }
    public decimal RunningDistancePercent { get; }
    public decimal RunningDurationPercent { get; }
    public int PerceivedEffortPoints { get; }
    public int SetsAbsolute { get; }
    public decimal RepetitionsPercent { get; }
    public decimal LoadPercent { get; }

    private AdherencePolicyVersion(
        int version,
        decimal runningDistancePercent,
        decimal runningDurationPercent,
        int perceivedEffortPoints,
        int setsAbsolute,
        decimal repetitionsPercent,
        decimal loadPercent)
    {
        if (version <= 0) throw new ArgumentOutOfRangeException(nameof(version));

        Version = version;
        RunningDistancePercent = ValidatePercent(runningDistancePercent, nameof(runningDistancePercent));
        RunningDurationPercent = ValidatePercent(runningDurationPercent, nameof(runningDurationPercent));
        PerceivedEffortPoints = perceivedEffortPoints > 0
            ? perceivedEffortPoints
            : throw new ArgumentOutOfRangeException(nameof(perceivedEffortPoints));
        SetsAbsolute = setsAbsolute > 0 ? setsAbsolute : throw new ArgumentOutOfRangeException(nameof(setsAbsolute));
        RepetitionsPercent = ValidatePercent(repetitionsPercent, nameof(repetitionsPercent));
        LoadPercent = ValidatePercent(loadPercent, nameof(loadPercent));
    }

    public static AdherencePolicyVersion Create(
        int version,
        decimal runningDistancePercent,
        decimal runningDurationPercent,
        int perceivedEffortPoints,
        int setsAbsolute,
        decimal repetitionsPercent,
        decimal loadPercent) =>
        new(version, runningDistancePercent, runningDurationPercent, perceivedEffortPoints,
            setsAbsolute, repetitionsPercent, loadPercent);

    public static AdherencePolicyVersion Version1() =>
        new(1, 0.10m, 0.10m, 2, 1, 0.20m, 0.10m);

    public FieldComparison CompareRunningDistance(NumericRange<double>? prescribed, double executed) =>
        CompareRange(prescribed, executed, (double)RunningDistancePercent);

    public FieldComparison CompareRunningDuration(NumericRange<int>? prescribed, int executed) =>
        prescribed is null
            ? FieldComparison.NotComparable(executed)
            : CompareBounds(prescribed.Value.Min, prescribed.Value.Max, executed, (double)RunningDurationPercent);

    public FieldComparison ComparePerceivedEffort(NumericRange<int>? prescribed, int executed) =>
        prescribed is null
            ? FieldComparison.NotComparable(executed)
            : CompareBounds(prescribed.Value.Min, prescribed.Value.Max, executed, PerceivedEffortPoints, percent: false);

    public FieldComparison CompareSets(int prescribed, int executed) =>
        CompareBounds(prescribed, null, executed, SetsAbsolute, percent: false);

    public FieldComparison CompareRepetitions(int prescribed, int executed) =>
        CompareBounds(prescribed, null, executed, (double)RepetitionsPercent);

    public FieldComparison CompareLoad(decimal? historicalMedian, decimal? executed)
    {
        if (historicalMedian is null || executed is null)
            return FieldComparison.NotComparable(executed is null ? null : (double)executed.Value);

        return CompareBounds(
            (double)historicalMedian.Value, null, (double)executed.Value, (double)LoadPercent);
    }

    private static FieldComparison CompareRange(
        NumericRange<double>? prescribed, double executed, double tolerance) =>
        prescribed is null
            ? FieldComparison.NotComparable(executed)
            : CompareBounds(prescribed.Value.Min, prescribed.Value.Max, executed, tolerance);

    private static FieldComparison CompareBounds(
        double min, double? max, double executed, double tolerance, bool percent = true)
    {
        var upper = max ?? min;
        var lowerLimit = percent ? min * (1 - tolerance) : min - tolerance;
        var upperLimit = percent ? upper * (1 + tolerance) : upper + tolerance;
        var status = executed >= lowerLimit - 0.0000001 && executed <= upperLimit + 0.0000001
            ? FieldAdherenceStatus.Adherent
            : FieldAdherenceStatus.Divergent;
        var difference = executed < min ? executed - min : executed > upper ? executed - upper : 0;

        return new FieldComparison(status, min, max, executed, difference);
    }

    private static decimal ValidatePercent(decimal value, string name) =>
        value is > 0 and < 1 ? value : throw new ArgumentOutOfRangeException(name);
}
