using Steady.Domain.Planning;
using Steady.Infrastructure.Repositories;

namespace Steady.Api.Tests;

public sealed class SteadyTrainingPlanDocumentsTests
{
    [Fact]
    public void Serializa_e_desserializa_a_versao_1_sem_perder_nenhum_campo()
    {
        var original = SteadyTrainingPlanSeed.Version1();

        var restored = SteadyTrainingPlanDocuments.Deserialize(
            original.Version, SteadyTrainingPlanDocuments.Serialize(original));

        Assert.Equal(original.Version, restored.Version);
        Assert.Equal(original.Content.Title, restored.Content.Title);
        Assert.Equal(original.Content.Subtitle, restored.Content.Subtitle);
        Assert.Equal(original.Content.Principle.Intro, restored.Content.Principle.Intro);
        Assert.Equal(original.Content.Principle.Points, restored.Content.Principle.Points);
        Assert.Equal(original.Content.Phases, restored.Content.Phases);
        Assert.Equal(original.Content.WeekOverview, restored.Content.WeekOverview);
        Assert.Equal(original.Content.TaperAdjustment.Title, restored.Content.TaperAdjustment.Title);
        Assert.Equal(original.Content.TaperAdjustment.Intro, restored.Content.TaperAdjustment.Intro);
        Assert.Equal(original.Content.TaperAdjustment.Items, restored.Content.TaperAdjustment.Items);
        Assert.Equal(original.Content.LongRunProgression, restored.Content.LongRunProgression);
        Assert.Equal(original.Content.GoldenRules, restored.Content.GoldenRules);
        Assert.Equal(original.Content.Mobility.Count, restored.Content.Mobility.Count);
        for (var i = 0; i < original.Content.Mobility.Count; i++)
        {
            Assert.Equal(original.Content.Mobility[i].Title, restored.Content.Mobility[i].Title);
            Assert.Equal(original.Content.Mobility[i].Items, restored.Content.Mobility[i].Items);
        }
        Assert.Equal(original.WeekPlan.Count, restored.WeekPlan.Count);
        for (var i = 0; i < original.WeekPlan.Count; i++)
        {
            Assert.Equal(original.WeekPlan[i].Day, restored.WeekPlan[i].Day);
            Assert.Equal(original.WeekPlan[i].HasRun, restored.WeekPlan[i].HasRun);
            Assert.Equal(original.WeekPlan[i].Exercises, restored.WeekPlan[i].Exercises);
            Assert.Equal(original.WeekPlan[i].Run?.Description, restored.WeekPlan[i].Run?.Description);
            Assert.Equal(original.WeekPlan[i].Run?.DistanceKm, restored.WeekPlan[i].Run?.DistanceKm);
        }
    }

    [Fact]
    public void Campo_numerico_ausente_permanece_ausente_apos_ida_e_volta()
    {
        var restored = SteadyTrainingPlanDocuments.Deserialize(
            1, SteadyTrainingPlanDocuments.Serialize(SteadyTrainingPlanSeed.Version1()));

        var terca = restored.WeekPlan[1];
        Assert.NotNull(terca.Run);
        Assert.Null(terca.Run!.DistanceKm);
        Assert.Null(terca.Run.DurationMinutes);
        Assert.Null(terca.Run.PerceivedEffort);
    }

    [Fact]
    public void Faixa_numerica_sobrevive_a_ida_e_volta_quando_presente()
    {
        var plano = SteadyTrainingPlan.Create(
            2,
            SteadyTrainingPlanSeed.Version1().WeekPlan
                .Select((dia, index) => index == 1
                    ? dia with { Run = Steady.Domain.Coaching.RunPrescription.Create(
                        "Moderada com números", distanceKmMin: 8, distanceKmMax: 10) }
                    : dia)
                .ToArray(),
            SteadyTrainingPlanSeed.Version1().Content);

        var restored = SteadyTrainingPlanDocuments.Deserialize(2, SteadyTrainingPlanDocuments.Serialize(plano));

        Assert.Equal(8, restored.WeekPlan[1].Run!.DistanceKm!.Value.Min);
        Assert.Equal(10, restored.WeekPlan[1].Run!.DistanceKm!.Value.Max);
    }
}
