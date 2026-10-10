using Steady.Domain.Adherence;
using Steady.Domain.Coaching;
using Steady.Domain.Common;

namespace Steady.Domain.Tests;

public sealed class WorkoutAdherenceTests
{
    private static readonly AdherencePolicyVersion Policy = AdherencePolicyVersion.Version1();

    [Fact]
    public void Corrida_divergente_preserva_prescrito_executado_e_diferenca()
    {
        var prescription = RunningAdherencePrescription.Create(
            NumericRange<double>.Create(10),
            NumericRange<int>.Create(60),
            NumericRange<int>.Create(6));
        var execution = new RunningAdherenceExecution(Completed: true, 8, 55, 8);

        var result = WorkoutAdherenceComparer.CompareRunning(prescription, execution, Policy);

        Assert.Equal(WorkoutAdherenceStatus.Divergent, result.Status);
        Assert.Equal(FieldAdherenceStatus.Divergent, result.Distance.Status);
        Assert.Equal(10, result.Distance.PrescribedMin);
        Assert.Equal(8, result.Distance.Executed);
        Assert.Equal(-2, result.Distance.Difference);
        Assert.Equal(FieldAdherenceStatus.Adherent, result.Duration.Status);
        Assert.Equal(FieldAdherenceStatus.Adherent, result.PerceivedEffort.Status);
    }

    [Fact]
    public void Corridas_com_faixas_disjuntas_produzem_conflito_sem_acao()
    {
        var plan = RunningAdherencePrescription.Create(NumericRange<double>.Create(8, 10), null, null);
        var sheet = RunningAdherencePrescription.Create(NumericRange<double>.Create(12, 14), null, null);

        var result = WorkoutAdherenceComparer.ResolveRunningPrescription(plan, sheet);

        Assert.True(result.HasConflict);
        Assert.Null(result.Prescription);
    }

    [Fact]
    public void Descricao_livre_sem_numeros_nao_cria_conflito()
    {
        var plan = RunningAdherencePrescription.Create(null, null, null);
        var sheet = RunningAdherencePrescription.Create(null, null, null);

        var result = WorkoutAdherenceComparer.ResolveRunningPrescription(plan, sheet);

        Assert.False(result.HasConflict);
        Assert.NotNull(result.Prescription);
    }

    [Fact]
    public void Dor_no_encerramento_tem_precedencia_sobre_excesso_de_carga()
    {
        var action = SafetyPolicy.Authorize(
            WorkoutAdherenceStatus.Divergent,
            hasComparableField: true,
            painReportedAtCompletion: true,
            prescribedLoad: 300,
            executedLoad: 500,
            overloadAlreadyDetected: true);

        Assert.Equal(AuthorizedAction.PrioritizeRecovery, action);
    }

    [Theory]
    [InlineData(WorkoutAdherenceStatus.PrescriptionConflict)]
    [InlineData(WorkoutAdherenceStatus.InsufficientData)]
    public void Conflito_ou_dados_insuficientes_nao_produzem_acao(WorkoutAdherenceStatus status)
    {
        var action = SafetyPolicy.Authorize(
            status, true, false, prescribedLoad: 100, executedLoad: 200, overloadAlreadyDetected: false);

        Assert.Null(action);
    }

    [Fact]
    public void Excesso_de_dez_por_cento_reduz_carga()
    {
        var action = SafetyPolicy.Authorize(
            WorkoutAdherenceStatus.Divergent,
            true,
            false,
            prescribedLoad: 100,
            executedLoad: 110,
            overloadAlreadyDetected: false);

        Assert.Equal(AuthorizedAction.ReduceLoad, action);
    }

    [Fact]
    public void Divergencia_sem_excesso_mantem_proximo_treino()
    {
        var action = SafetyPolicy.Authorize(
            WorkoutAdherenceStatus.Divergent,
            true,
            false,
            prescribedLoad: 100,
            executedLoad: 80,
            overloadAlreadyDetected: false);

        Assert.Equal(AuthorizedAction.Maintain, action);
    }

    [Fact]
    public void Exercicio_pulado_e_divergente_e_carga_fica_nao_comparavel_sem_historico()
    {
        var key = Guid.NewGuid();
        var prescription = StrengthExerciseAdherencePrescription.Create(key, "Agachamento", 4, 6);
        var execution = StrengthExerciseAdherenceExecution.Skipped(key, "Agachamento", 4, 6);

        var result = WorkoutAdherenceComparer.CompareStrengthExercise(
            prescription, execution, historicalMedianLoad: null, Policy);

        Assert.Equal(FieldAdherenceStatus.Divergent, result.Completion.Status);
        Assert.Equal(FieldAdherenceStatus.NotComparable, result.Load.Status);
    }
}
