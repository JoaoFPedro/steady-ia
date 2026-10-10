using Steady.Domain.Adherence;

namespace Steady.Domain.Tests;

public sealed class WorkoutReviewTests
{
    [Fact]
    public void Contexto_da_IA_tem_lista_positiva_de_campos_sem_identidade_ou_texto_livre()
    {
        Assert.Equal(
            ["Action", "Facts", "Modality", "PainReported"],
            typeof(ExplanationContext).GetProperties().Select(property => property.Name).Order());
        Assert.Equal(
            ["Difference", "Executed", "Field", "PrescribedMax", "PrescribedMin", "Status"],
            typeof(ExplanationFact).GetProperties().Select(property => property.Name).Order());
    }

    private static WorkoutReview Review(AuthorizedAction? action = AuthorizedAction.ReduceLoad) =>
        WorkoutReview.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            WorkoutExecutionKind.Running,
            new DateOnly(2026, 8, 30),
            WorkoutAdherenceStatus.Divergent,
            action,
            policyVersion: 1,
            planVersion: 1,
            trainingSheetId: null,
            comparisonJson: "{\"distance\":\"Divergent\"}",
            DateTime.UtcNow);

    [Fact]
    public void Revisao_preserva_snapshot_e_versoes_aplicadas()
    {
        var review = Review();

        Assert.Equal(1, review.PolicyVersion);
        Assert.Equal(1, review.PlanVersion);
        Assert.Contains("distance", review.ComparisonJson);
        Assert.Equal(ExplanationStatus.Pending, review.ExplanationStatus);
        Assert.Equal(CoherenceStatus.Unknown, review.Coherence.Status);
    }

    [Fact]
    public void Entendi_registra_data_sem_alterar_snapshot()
    {
        var review = Review();
        var snapshot = review.ComparisonJson;
        var understoodAt = DateTime.UtcNow;

        review.MarkUnderstood(understoodAt);

        Assert.Equal(understoodAt, review.UnderstoodAt);
        Assert.Equal(snapshot, review.ComparisonJson);
    }

    [Fact]
    public void Coerencia_pode_ser_recalculada_sem_alterar_recomendacao()
    {
        var review = Review();
        var firstExecution = Guid.NewGuid();
        var lateExecution = Guid.NewGuid();

        review.UpdateCoherence(CoherenceStatus.Coherent, firstExecution, 1, DateTime.UtcNow);
        review.UpdateCoherence(CoherenceStatus.NotCoherent, lateExecution, 1, DateTime.UtcNow.AddMinutes(1));

        Assert.Equal(CoherenceStatus.NotCoherent, review.Coherence.Status);
        Assert.Equal(lateExecution, review.Coherence.NextExecutionId);
        Assert.Equal(AuthorizedAction.ReduceLoad, review.Action);
    }

    [Fact]
    public void Explicacao_com_acao_diferente_e_rejeitada()
    {
        var review = Review(AuthorizedAction.ReduceLoad);
        var explanation = new StructuredExplanation(
            ["Distância abaixo da faixa."],
            ["O próximo treino pode exigir ajuste."],
            AuthorizedAction.Maintain,
            null);

        var result = review.TrySetExplanation(explanation, [8, 10]);

        Assert.False(result.Accepted);
        Assert.Equal(ExplanationStatus.Unavailable, review.ExplanationStatus);
        Assert.Equal(ExplanationRejectionReason.ActionMismatch, result.Reason);
    }

    [Theory]
    [InlineData("Isso causou uma lesão no joelho.")]
    [InlineData("Você está com tendinite.")]
    public void Diagnostico_ou_causalidade_sao_rejeitados(string unsafeText)
    {
        var review = Review();
        var explanation = new StructuredExplanation(
            [unsafeText], ["Priorize recuperação."], AuthorizedAction.ReduceLoad, null);

        var result = review.TrySetExplanation(explanation, []);

        Assert.False(result.Accepted);
        Assert.Equal(ExplanationRejectionReason.UnsafeClaim, result.Reason);
    }

    [Fact]
    public void Numero_que_nao_existe_nos_fatos_e_rejeitado()
    {
        var review = Review();
        var explanation = new StructuredExplanation(
            ["A diferença foi de 17 km."], ["Reduza a carga."], AuthorizedAction.ReduceLoad, null);

        var result = review.TrySetExplanation(explanation, [8, 10]);

        Assert.False(result.Accepted);
        Assert.Equal(ExplanationRejectionReason.UnknownNumber, result.Reason);
    }

    [Fact]
    public void Falha_do_provedor_deixa_explicacao_indisponivel_sem_apagar_acao()
    {
        var review = Review();

        review.MarkExplanationUnavailable();

        Assert.Equal(ExplanationStatus.Unavailable, review.ExplanationStatus);
        Assert.Equal(AuthorizedAction.ReduceLoad, review.Action);
    }
}
