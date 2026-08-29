using Steady.Domain.Coaching;
using Steady.Domain.Planning;

namespace Steady.Infrastructure.Repositories;

/// <summary>
/// Transcrição literal de <c>src/steady-app/src/planning/trainingPlanDocument.ts</c>
/// (ADR-013). Persistir não é gerar: nenhum valor aqui existe além do que o
/// texto-fonte já declarava antes desta story.
///
/// A fonte só declara número por <b>fase</b> (<see cref="Fase 4 — longRunProgression"/>
/// mais abaixo), nunca por dia da semana — por isso terça, quinta e sábado do
/// <see cref="SteadyTrainingPlan.WeekPlan"/> carregam <see cref="RunPrescription"/>
/// só com descrição. Promover uma faixa de fase para um dia fixo exigiria
/// escolher a fase, que é cálculo de progressão (fora de escopo da STORY-016;
/// ver ADR-006, superada por esse exato erro).
/// </summary>
public static class SteadyTrainingPlanSeed
{
    public static SteadyTrainingPlan Version1() => SteadyTrainingPlan.Create(
        version: 1,
        weekPlan: WeekPlan(),
        content: new PlanStaticContent(
            Title: "Plano de Treino Concorrente — 1ª Maratona",
            Subtitle: "24 semanas · Split fixo seg-sex + corrida · Base: meia maratona (21km) já corrida",
            Principle: Principle(),
            Phases: Phases(),
            PhaseCycleNote:
                "Regra nas fases 1 e 2: 3 semanas de progressão + 1 semana de recuo (~20–30% menos volume).",
            WeekOverview: WeekOverview(),
            WeekOverviewNote:
                "Nos dias duplos (terça e quinta), se possível separe corrida e musculação por algumas horas " +
                "(ex: corrida de manhã, musculação à tarde/noite). Se não der, corra primeiro — a musculação de " +
                "superior não é prejudicada por pernas cansadas.",
            TaperAdjustment: TaperAdjustment(),
            LongRunProgression: LongRunProgression(),
            Mobility: Mobility(),
            GoldenRules: GoldenRules(),
            PaceNote:
                "Os ritmos de corrida estão descritos por esforço percebido de propósito. Para converter em " +
                "paces exatos (min/km), use o tempo recente da meia maratona do cliente como referência."));

    private static PlanPrinciple Principle() => new(
        Intro:
            "Musculação e corrida não competem pelo mesmo recurso o tempo todo — elas competem por " +
            "recuperação, mas se complementam em capacidade. A lógica deste plano:",
        Points:
        [
            "A corrida constrói a capacidade aeróbica e a resistência específica ao gesto.",
            "A musculação, treinada de forma completa, fortalece o que a corrida sozinha não treina: cadeia " +
                "posterior, estabilizadores de quadril/tornozelo, tronco e a musculatura superior que sustenta " +
                "a postura e a braçada quando a técnica começa a desmoronar lá pelo km 30.",
            "A mobilidade garante que os ganhos de força e o volume de corrida não fiquem \"presos\" em " +
                "articulações enrijecidas (quadril e tornozelo), causa raiz da maioria das dores de corredor.",
        ]);

    private static IReadOnlyList<PlanPhase> Phases() =>
    [
        new("1. Base", "Sem. 1–8",
            "Volume aeróbico leve, técnica, longão sobe de ~14 para ~22km",
            "Adaptação anatômica — técnica, repetições moderadas (10–15)"),
        new("2. Construção", "Sem. 9–16",
            "Ritmo de prova e tempo runs, longão sobe até ~29km",
            "Força máxima — cargas mais altas, repetições baixas (6–8)"),
        new("3. Pico específico", "Sem. 17–20",
            "Longões com trechos em ritmo de maratona, pico (~32–34km) na semana 18–19",
            "Manutenção — volume reduzido (menos séries em todos os dias)"),
        new("4. Polimento (taper)", "Sem. 21–24",
            "Redução progressiva de volume (~40% na semana da prova)",
            "Quase zero — ver ajuste específico abaixo"),
    ];

    private static IReadOnlyList<PlanWeekdayFocus> WeekOverview() =>
    [
        new("Segunda", "Perna (pesada)", null),
        new("Terça", "Peito e tríceps", "Moderada"),
        new("Quarta", "Ombro", null),
        new("Quinta", "Costas e bíceps", "Qualidade (forte)"),
        new("Sexta", "Perna (leve)", null),
        new("Sábado", "—", "Longão"),
        new("Domingo", "Descanso", null),
    ];

    private static IReadOnlyList<PlanWeekDay> WeekPlan() =>
    [
        new(
            Day: "Segunda — Perna (pesada)", Focus: "Perna (pesada)", HasRun: false, RunLabel: null,
            Intro:
                "Dia principal de força de perna: perna está \"fresca\" do descanso de domingo, e há a semana " +
                "toda pela frente pra recuperar antes do longão de sábado.",
            RunNote: null,
            Exercises:
            [
                new("Agachamento livre", "4x6–10"),
                new("Levantamento terra romeno (RDL)", "3x8–12"),
                new("Cadeira extensora", "3x12"),
                new("Mesa/cadeira flexora", "3x12"),
                new("Elevação de panturrilha (pé reto)", "3x15"),
                new("Prancha frontal", "3x30–45s"),
            ],
            Run: null),
        new(
            Day: "Terça — Peito e tríceps + corrida moderada", Focus: "Peito e tríceps", HasRun: true,
            RunLabel: "Moderada", Intro: "Musculação:",
            RunNote:
                "Moderada / fartlek leve (pernas ainda semi-recuperadas da segunda, não é dia de intensidade " +
                "máxima).",
            Exercises:
            [
                new("Supino reto (barra ou halteres)", "3x8–10"),
                new("Supino inclinado (halteres)", "3x10"),
                new("Crucifixo ou peck deck", "3x12"),
                new("Tríceps corda", "3x12"),
                new("Tríceps francês", "3x10"),
                new("Pallof press (anti-rotação, sustenta o tronco na corrida)", "2x10 cada lado"),
            ],
            Run: RunPrescription.Create(
                "Moderada / fartlek leve (pernas ainda semi-recuperadas da segunda, não é dia de intensidade " +
                "máxima).")),
        new(
            Day: "Quarta — Ombro", Focus: "Ombro", HasRun: false, RunLabel: null,
            Intro: "Dia sem perna e sem corrida — bom momento pra investir mais tempo em mobilidade.",
            RunNote: null,
            Exercises:
            [
                new("Desenvolvimento de ombro (halteres ou barra)", "3x8–10"),
                new("Elevação lateral", "3x12"),
                new("Elevação posterior (postura de corrida, evita ombros caídos na fadiga)", "3x12"),
                new("Encolhimento (trapézio)", "3x12"),
                new("Prancha lateral", "2x30–45s cada lado"),
                new("Bloco extra de mobilidade de quadril e tornozelo (ver seção abaixo)", ""),
            ],
            Run: null),
        new(
            Day: "Quinta — Costas e bíceps + corrida de qualidade", Focus: "Costas e bíceps", HasRun: true,
            RunLabel: "Qualidade (forte)", Intro: "Musculação:",
            RunNote:
                "Intervalado ou tempo run — pernas bem recuperadas (72h longe da perna pesada de segunda), " +
                "melhor dia da semana pra intensidade alta.",
            Exercises:
            [
                new("Puxada alta (pulldown) ou barra fixa assistida", "3x8–10"),
                new("Remada curvada ou remada cabo", "3x10"),
                new("Remada unilateral (halter)", "3x10 cada lado"),
                new("Rosca direta", "3x12"),
                new("Rosca alternada", "3x10"),
                new("Dead bug (controle de tronco)", "2x10 cada lado"),
            ],
            Run: RunPrescription.Create(
                "Intervalado ou tempo run — pernas bem recuperadas (72h longe da perna pesada de segunda), " +
                "melhor dia da semana pra intensidade alta.")),
        new(
            Day: "Sexta — Perna (leve)", Focus: "Perna (leve)", HasRun: false, RunLabel: null,
            Intro:
                "Propositalmente mais leve que segunda — carga moderada, foco em técnica e unilateral, pra " +
                "não comprometer o longão de sábado.",
            RunNote: null,
            Exercises:
            [
                new("Afundo búlgaro", "3x8–10 cada perna"),
                new("Step-up", "2x10 cada perna"),
                new("Single-leg RDL", "2x8 cada perna"),
                new("Panturrilha unilateral, joelho dobrado (sóleo)", "2x15 cada perna"),
                new("Trabalho de pé/tornozelo (short foot)", "2x20s"),
            ],
            Run: null),
        new(
            Day: "Sábado — Longão", Focus: "Longão", HasRun: true, RunLabel: "Longão",
            Intro: "O treino mais importante da semana. Ritmo sempre confortável/conversável.",
            RunNote:
                "Aumente ~1–2km a cada 1–2 semanas, com recuo a cada 4ª semana. A partir da Construção, inclua " +
                "os últimos 15–20% em ritmo de maratona. Mobilidade pós-longão é inegociável.",
            Exercises: [],
            Run: RunPrescription.Create(
                "Aumente ~1–2km a cada 1–2 semanas, com recuo a cada 4ª semana. A partir da Construção, inclua " +
                "os últimos 15–20% em ritmo de maratona. Mobilidade pós-longão é inegociável.")),
        new(
            Day: "Domingo — Descanso", Focus: "Descanso", HasRun: false, RunLabel: null,
            Intro: "Descanso total. Mobilidade leve/foam roller é opcional, mas sem treino prescrito.",
            RunNote: null,
            Exercises: [],
            Run: null),
    ];

    private static PlanTaperAdjustment TaperAdjustment() => new(
        Title: "Ajuste no polimento (semanas 21–24)",
        Intro:
            "O split de 5 dias de musculação + 3 dias de corrida é pesado demais pras últimas semanas antes " +
            "da prova. Ajustes:",
        Items:
        [
            "Semanas 21–22: corte pela metade o número de séries em todos os dias de musculação (ex: 2 " +
                "exercícios por grupo em vez de 5–6, 2 séries cada).",
            "Semana 23: apenas 2–3 sessões leves de ativação (ex: segunda-perna e quinta-costas, com carga " +
                "bem reduzida), sem chegar perto da falha.",
            "Semana 24 (semana da prova): só mobilidade e ativação leve, nada de carga significativa.",
        ]);

    private static IReadOnlyList<PlanLongRunProgression> LongRunProgression() =>
    [
        new("Base", "~14km → ~22km"),
        new("Construção", "~24km → ~29km"),
        new("Pico", "~30km → ~32–34km (pico, 3–4 semanas antes da prova)"),
        new("Taper", "~21km → ~13km → ~8km na semana da prova"),
    ];

    private static IReadOnlyList<PlanMobilityBlock> Mobility() =>
    [
        new("Aquecimento dinâmico (antes de qualquer sessão) — 8–10min",
        [
            new("Balanço de perna frontal e lateral", "10x cada perna"),
            new("Avanço com giro de tronco", "8x cada lado"),
            new("Abertura de quadril 90/90", "5x cada lado"),
            new("Skip alto / chute no glúteo", "20m cada"),
            new("Círculos de tornozelo", "10x cada direção"),
        ]),
        new("Mobilidade específica pós-treino (10–15min)",
        [
            new("Flexor de quadril (couch stretch)", "60s cada lado"),
            new("Dorsiflexão de tornozelo (rock joelho-parede)", "10x cada lado"),
            new("Pomba (rotação externa de quadril)", "60s cada lado"),
            new("Rolo miofascial — panturrilha, trato iliotibial, quadríceps, glúteo", "60–90s cada área"),
            new("Rotação torácica (open book)", "8x cada lado"),
        ]),
    ];

    private static IReadOnlyList<PlanGoldenRule> GoldenRules() =>
    [
        new("1",
            "Regra dos 10%: nunca aumente o volume semanal de corrida em mais de ~10% de uma semana para " +
                "outra."),
        new("2",
            "Dor aguda/pontada ≠ desconforto muscular normal. Dor localizada, que piora durante o treino, ou " +
                "persiste 48h+ em repouso = parar e avaliar."),
        new("3", "Semana de recuo a cada 4 semanas é treino, não preguiça."),
        new("4",
            "Taper é sagrado: siga o ajuste de polimento acima à risca — o ganho de fitness nas últimas " +
                "semanas é zero, o risco de lesão é alto."),
        new("5",
            "Sexta (perna leve) nunca deve doer no dia seguinte de um jeito que atrapalhe o longão — se isso " +
                "acontecer, reduza ainda mais a carga desse dia."),
    ];
}
