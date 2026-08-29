using Steady.Domain.Coaching;
using Steady.Domain.Planning;
using Steady.Infrastructure.Repositories;

namespace Steady.Api.Tests;

/// <summary>
/// Verifica, campo a campo, que <see cref="SteadyTrainingPlanSeed.Version1"/>
/// reproduz <c>src/steady-app/src/planning/trainingPlanDocument.ts</c> sem
/// nenhum valor inventado (ADR-013). Os literais abaixo foram transcritos
/// diretamente do arquivo-fonte — uma segunda leitura, independente da que
/// gerou o seed, é a prova de fidelidade que o cenário
/// "Seed reproduz o documento estático campo a campo" exige.
/// </summary>
public sealed class SteadyTrainingPlanSeedTests
{
    private readonly SteadyTrainingPlan _plan = SteadyTrainingPlanSeed.Version1();

    [Fact]
    public void Versao_1_tem_titulo_subtitulo_e_nota_de_ritmo_identicos_a_fonte()
    {
        Assert.Equal(1, _plan.Version);
        Assert.Equal("Plano de Treino Concorrente — 1ª Maratona", _plan.Content.Title);
        Assert.Equal(
            "24 semanas · Split fixo seg-sex + corrida · Base: meia maratona (21km) já corrida",
            _plan.Content.Subtitle);
        Assert.Equal(
            "Os ritmos de corrida estão descritos por esforço percebido de propósito. Para converter em " +
            "paces exatos (min/km), use o tempo recente da meia maratona do cliente como referência.",
            _plan.Content.PaceNote);
    }

    [Fact]
    public void Principio_tem_a_introducao_e_os_tres_pontos_da_fonte()
    {
        var principle = _plan.Content.Principle;

        Assert.Equal(
            "Musculação e corrida não competem pelo mesmo recurso o tempo todo — elas competem por " +
            "recuperação, mas se complementam em capacidade. A lógica deste plano:",
            principle.Intro);
        Assert.Equal(3, principle.Points.Count);
        Assert.Equal(
            "A corrida constrói a capacidade aeróbica e a resistência específica ao gesto.",
            principle.Points[0]);
        Assert.Contains("cadeia posterior", principle.Points[1]);
        Assert.Contains("causa raiz da maioria das dores de corredor", principle.Points[2]);
    }

    [Fact]
    public void As_quatro_fases_batem_com_nome_semanas_e_focos_da_fonte()
    {
        Assert.Equal(4, _plan.Content.Phases.Count);

        var base_ = _plan.Content.Phases[0];
        Assert.Equal("1. Base", base_.Name);
        Assert.Equal("Sem. 1–8", base_.Weeks);
        Assert.Contains("~14 para ~22km", base_.RunFocus);

        var construcao = _plan.Content.Phases[1];
        Assert.Equal("2. Construção", construcao.Name);
        Assert.Contains("~29km", construcao.RunFocus);

        var pico = _plan.Content.Phases[2];
        Assert.Equal("3. Pico específico", pico.Name);
        Assert.Contains("~32–34km", pico.RunFocus);

        var taper = _plan.Content.Phases[3];
        Assert.Equal("4. Polimento (taper)", taper.Name);
        Assert.Contains("~40%", taper.RunFocus);

        Assert.Equal(
            "Regra nas fases 1 e 2: 3 semanas de progressão + 1 semana de recuo (~20–30% menos volume).",
            _plan.Content.PhaseCycleNote);
    }

    [Fact]
    public void WeekOverview_tem_os_sete_dias_na_ordem_e_rotulos_da_fonte()
    {
        var dias = _plan.Content.WeekOverview;

        Assert.Equal(7, dias.Count);
        Assert.Equal(new PlanWeekdayFocus("Segunda", "Perna (pesada)", null), dias[0]);
        Assert.Equal(new PlanWeekdayFocus("Terça", "Peito e tríceps", "Moderada"), dias[1]);
        Assert.Equal(new PlanWeekdayFocus("Quarta", "Ombro", null), dias[2]);
        Assert.Equal(new PlanWeekdayFocus("Quinta", "Costas e bíceps", "Qualidade (forte)"), dias[3]);
        Assert.Equal(new PlanWeekdayFocus("Sexta", "Perna (leve)", null), dias[4]);
        Assert.Equal(new PlanWeekdayFocus("Sábado", "—", "Longão"), dias[5]);
        Assert.Equal(new PlanWeekdayFocus("Domingo", "Descanso", null), dias[6]);
        Assert.Contains("corra primeiro", _plan.Content.WeekOverviewNote);
    }

    [Fact]
    public void WeekPlan_segunda_repete_os_seis_exercicios_de_perna_pesada_da_fonte()
    {
        var segunda = _plan.WeekPlan[0];

        Assert.Equal("Segunda — Perna (pesada)", segunda.Day);
        Assert.False(segunda.HasRun);
        Assert.Null(segunda.Run);
        Assert.Equal(
            [
                new PlanExercise("Agachamento livre", "4x6–10"),
                new PlanExercise("Levantamento terra romeno (RDL)", "3x8–12"),
                new PlanExercise("Cadeira extensora", "3x12"),
                new PlanExercise("Mesa/cadeira flexora", "3x12"),
                new PlanExercise("Elevação de panturrilha (pé reto)", "3x15"),
                new PlanExercise("Prancha frontal", "3x30–45s"),
            ],
            segunda.Exercises);
    }

    [Fact]
    public void WeekPlan_terca_tem_corrida_moderada_so_com_descricao()
    {
        var terca = _plan.WeekPlan[1];

        Assert.True(terca.HasRun);
        Assert.Equal("Moderada", terca.RunLabel);
        Assert.NotNull(terca.Run);
        Assert.Contains("fartlek leve", terca.Run!.Description);
        Assert.Null(terca.Run.DistanceKm);
        Assert.Null(terca.Run.DurationMinutes);
        Assert.Null(terca.Run.PerceivedEffort);
        Assert.Equal(6, terca.Exercises.Count);
        Assert.Equal("Supino reto (barra ou halteres)", terca.Exercises[0].Name);
    }

    [Fact]
    public void WeekPlan_quarta_nao_tem_corrida_nem_prescricao()
    {
        var quarta = _plan.WeekPlan[2];

        Assert.False(quarta.HasRun);
        Assert.Null(quarta.RunLabel);
        Assert.Null(quarta.Run);
        Assert.Equal(6, quarta.Exercises.Count);
        Assert.Equal("", quarta.Exercises[5].Series);
    }

    [Fact]
    public void WeekPlan_quinta_tem_corrida_de_qualidade_so_com_descricao()
    {
        var quinta = _plan.WeekPlan[3];

        Assert.True(quinta.HasRun);
        Assert.Equal("Qualidade (forte)", quinta.RunLabel);
        Assert.Contains("72h longe da perna pesada", quinta.Run!.Description);
        Assert.Null(quinta.Run.DistanceKm);
        Assert.Equal(6, quinta.Exercises.Count);
    }

    [Fact]
    public void WeekPlan_sexta_tem_cinco_exercicios_de_perna_leve()
    {
        var sexta = _plan.WeekPlan[4];

        Assert.False(sexta.HasRun);
        Assert.Equal(5, sexta.Exercises.Count);
        Assert.Equal("Afundo búlgaro", sexta.Exercises[0].Name);
    }

    [Fact]
    public void WeekPlan_sabado_e_o_longao_so_com_descricao_e_sem_exercicios()
    {
        var sabado = _plan.WeekPlan[5];

        Assert.True(sabado.HasRun);
        Assert.Equal("Longão", sabado.RunLabel);
        Assert.Empty(sabado.Exercises);
        Assert.Contains("Aumente ~1–2km", sabado.Run!.Description);
        Assert.Null(sabado.Run.DistanceKm);
        Assert.Null(sabado.Run.DurationMinutes);
        Assert.Null(sabado.Run.PerceivedEffort);
    }

    [Fact]
    public void WeekPlan_domingo_e_descanso_sem_corrida_e_sem_exercicios()
    {
        var domingo = _plan.WeekPlan[6];

        Assert.False(domingo.HasRun);
        Assert.Null(domingo.Run);
        Assert.Empty(domingo.Exercises);
        Assert.Contains("Descanso total", domingo.Intro);
    }

    [Fact]
    public void TaperAdjustment_tem_titulo_introducao_e_os_tres_itens_da_fonte()
    {
        var taper = _plan.Content.TaperAdjustment;

        Assert.Equal("Ajuste no polimento (semanas 21–24)", taper.Title);
        Assert.Equal(3, taper.Items.Count);
        Assert.Contains("corte pela metade", taper.Items[0]);
        Assert.Contains("Semana 23", taper.Items[1]);
        Assert.Contains("Semana 24", taper.Items[2]);
    }

    [Fact]
    public void LongRunProgression_tem_as_quatro_faixas_textuais_por_fase()
    {
        Assert.Equal(
            [
                new PlanLongRunProgression("Base", "~14km → ~22km"),
                new PlanLongRunProgression("Construção", "~24km → ~29km"),
                new PlanLongRunProgression("Pico", "~30km → ~32–34km (pico, 3–4 semanas antes da prova)"),
                new PlanLongRunProgression("Taper", "~21km → ~13km → ~8km na semana da prova"),
            ],
            _plan.Content.LongRunProgression);
    }

    [Fact]
    public void Mobilidade_tem_os_dois_blocos_com_cinco_itens_cada()
    {
        Assert.Equal(2, _plan.Content.Mobility.Count);
        Assert.Equal(5, _plan.Content.Mobility[0].Items.Count);
        Assert.Equal(5, _plan.Content.Mobility[1].Items.Count);
        Assert.Contains("Aquecimento dinâmico", _plan.Content.Mobility[0].Title);
        Assert.Contains("Mobilidade específica pós-treino", _plan.Content.Mobility[1].Title);
        Assert.Equal(new PlanExercise("Balanço de perna frontal e lateral", "10x cada perna"),
            _plan.Content.Mobility[0].Items[0]);
    }

    [Fact]
    public void GoldenRules_tem_as_cinco_regras_numeradas_da_fonte()
    {
        Assert.Equal(5, _plan.Content.GoldenRules.Count);
        Assert.Contains("Regra dos 10%", _plan.Content.GoldenRules[0].Text);
        Assert.Contains("Dor aguda/pontada", _plan.Content.GoldenRules[1].Text);
        Assert.Contains("Semana de recuo a cada 4 semanas", _plan.Content.GoldenRules[2].Text);
        Assert.Contains("Taper é sagrado", _plan.Content.GoldenRules[3].Text);
        Assert.Contains("Sexta (perna leve)", _plan.Content.GoldenRules[4].Text);
    }

    [Fact]
    public void Nenhum_campo_numerico_e_derivado_de_outro()
    {
        // Nenhum dia do weekPlan carrega distância, duração ou esforço — a fonte só
        // declara número por fase (longRunProgression), nunca por dia, e promover
        // isso exigiria cálculo de progressão (fora de escopo da STORY-016).
        foreach (var dia in _plan.WeekPlan)
        {
            if (dia.Run is null) continue;

            Assert.Null(dia.Run.DistanceKm);
            Assert.Null(dia.Run.DurationMinutes);
            Assert.Null(dia.Run.PerceivedEffort);
        }
    }
}
