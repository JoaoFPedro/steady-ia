using Steady.Domain.Coaching;
using Steady.Domain.Planning;

namespace Steady.Domain.Tests;

public sealed class SteadyTrainingPlanTests
{
    private static PlanExercise Exercise(string name = "Agachamento livre", string series = "4x6-10") =>
        new(name, series);

    private static PlanWeekDay RestDay(string day, string focus) =>
        new(day, focus, HasRun: false, RunLabel: null, Intro: "Descanso.", RunNote: null,
            Exercises: [], Run: null);

    private static PlanWeekDay StrengthDay(string day, string focus) =>
        new(day, focus, HasRun: false, RunLabel: null, Intro: "Musculação.", RunNote: null,
            Exercises: [Exercise()], Run: null);

    private static PlanWeekDay CombinedDay(string day, string focus, string runLabel, string runNote) =>
        new(day, focus, HasRun: true, RunLabel: runLabel, Intro: "Musculação:", RunNote: runNote,
            Exercises: [Exercise()], Run: RunPrescription.Create(runNote));

    private static IReadOnlyList<PlanWeekDay> ValidWeekPlan() =>
    [
        StrengthDay("Segunda — Perna (pesada)", "Perna (pesada)"),
        CombinedDay("Terça — Peito e tríceps + corrida moderada", "Peito e tríceps", "Moderada", "Fartlek leve"),
        StrengthDay("Quarta — Ombro", "Ombro"),
        CombinedDay("Quinta — Costas e bíceps + corrida de qualidade", "Costas e bíceps", "Qualidade (forte)", "Intervalado"),
        StrengthDay("Sexta — Perna (leve)", "Perna (leve)"),
        CombinedDay("Sábado — Longão", "Longão", "Longão", "Ritmo confortável"),
        RestDay("Domingo — Descanso", "Descanso"),
    ];

    private static PlanStaticContent ValidContent() => new(
        Title: "Plano de Treino Concorrente — 1ª Maratona",
        Subtitle: "24 semanas",
        Principle: new PlanPrinciple("intro", ["ponto 1"]),
        Phases: [new PlanPhase("1. Base", "Sem. 1–8", "foco corrida", "foco força")],
        PhaseCycleNote: "3 semanas de progressão + 1 de recuo.",
        WeekOverview: [new PlanWeekdayFocus("Segunda", "Perna (pesada)", null)],
        WeekOverviewNote: "nota",
        TaperAdjustment: new PlanTaperAdjustment("Ajuste", "intro", ["item 1"]),
        LongRunProgression: [new PlanLongRunProgression("Base", "~14km → ~22km")],
        Mobility: [new PlanMobilityBlock("Aquecimento", [Exercise()])],
        GoldenRules: [new PlanGoldenRule("1", "Regra dos 10%.")],
        PaceNote: "nota de ritmo");

    [Fact]
    public void Plano_valido_preserva_versao_e_conteudo()
    {
        var plano = SteadyTrainingPlan.Create(1, ValidWeekPlan(), ValidContent());

        Assert.Equal(1, plano.Version);
        Assert.Equal(7, plano.WeekPlan.Count);
        Assert.Equal("Plano de Treino Concorrente — 1ª Maratona", plano.Content.Title);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void Versao_deve_ser_maior_que_zero(int version)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            SteadyTrainingPlan.Create(version, ValidWeekPlan(), ValidContent()));
    }

    [Fact]
    public void Plano_exige_exatamente_sete_dias()
    {
        var seisDias = ValidWeekPlan().Take(6).ToArray();

        Assert.Throws<ArgumentException>(() => SteadyTrainingPlan.Create(1, seisDias, ValidContent()));
    }

    [Fact]
    public void Dia_marcado_com_corrida_exige_prescricao()
    {
        var semPrescricao = ValidWeekPlan().ToArray();
        semPrescricao[1] = semPrescricao[1] with { Run = null };

        Assert.Throws<ArgumentException>(() => SteadyTrainingPlan.Create(1, semPrescricao, ValidContent()));
    }

    [Fact]
    public void Dia_sem_corrida_nao_pode_trazer_prescricao()
    {
        var comPrescricaoIndevida = ValidWeekPlan().ToArray();
        comPrescricaoIndevida[0] = comPrescricaoIndevida[0] with { Run = RunPrescription.Create("Leve") };

        Assert.Throws<ArgumentException>(() => SteadyTrainingPlan.Create(1, comPrescricaoIndevida, ValidContent()));
    }

    [Fact]
    public void Dia_de_corrida_do_plano_so_tem_descricao_sem_nenhum_numero()
    {
        var plano = SteadyTrainingPlan.Create(1, ValidWeekPlan(), ValidContent());
        var sabado = plano.WeekPlan.Single(dia => dia.Day.StartsWith("Sábado"));

        Assert.Equal("Ritmo confortável", sabado.Run!.Description);
        Assert.Null(sabado.Run.DistanceKm);
        Assert.Null(sabado.Run.DurationMinutes);
        Assert.Null(sabado.Run.PerceivedEffort);
    }
}
