/**
 * Conteúdo do plano gerado — transcrição literal do plano real (colado pelo
 * corredor, 2026-08-17), que substitui tanto o A/B/C/D de
 * `.discovery/referencias/plano-treino-24-semanas.md` (superado) quanto a
 * reconciliação de 7 dias que este arquivo tinha antes (também superada —
 * tinha exercícios que não faziam sentido com o split real). Layout segue
 * `tela.html` (turno 2, artboard 2b: 4 abas internas).
 *
 * `.discovery/referencias/plano-treino-24-semanas.md` deveria ser atualizado
 * para este texto num passo separado — não é o objeto desta story, mas fica
 * registrado aqui para não se perder.
 */

export type WeekdayFocus = {
  day: string;
  strengthFocus: string;
  runLabel: string | null;
};

export type PhaseOverview = {
  name: string;
  weeks: string;
  runFocus: string;
  strengthFocus: string;
};

export type LongRunProgression = {
  phase: string;
  range: string;
};

export type Exercise = {
  name: string;
  /** Vazio quando a linha é um apontamento (ex: "ver mobilidade"), não um exercício com série. */
  series: string;
};

export type MobilityBlock = {
  title: string;
  items: Exercise[];
};

export type GoldenRule = {
  number: string;
  text: string;
};

export type WeekPlanDay = {
  day: string;
  focus: string;
  hasRun: boolean;
  runLabel?: string;
  intro: string;
  runNote?: string;
  exercises: Exercise[];
};

export type TrainingPlanDocument = {
  title: string;
  subtitle: string;
  principle: { intro: string; points: string[] };
  phases: PhaseOverview[];
  phaseCycleNote: string;
  weekOverview: WeekdayFocus[];
  weekOverviewNote: string;
  weekPlan: WeekPlanDay[];
  taperAdjustment: { title: string; intro: string; items: string[] };
  longRunProgression: LongRunProgression[];
  mobility: MobilityBlock[];
  goldenRules: GoldenRule[];
  paceNote: string;
};

export const TRAINING_PLAN_DOCUMENT: TrainingPlanDocument = {
  title: 'Plano de Treino Concorrente — 1ª Maratona',
  subtitle: '24 semanas · Split fixo seg-sex + corrida · Base: meia maratona (21km) já corrida',

  principle: {
    intro:
      'Musculação e corrida não competem pelo mesmo recurso o tempo todo — elas competem por recuperação, mas se complementam em capacidade. A lógica deste plano:',
    points: [
      'A corrida constrói a capacidade aeróbica e a resistência específica ao gesto.',
      'A musculação, treinada de forma completa, fortalece o que a corrida sozinha não treina: cadeia posterior, estabilizadores de quadril/tornozelo, tronco e a musculatura superior que sustenta a postura e a braçada quando a técnica começa a desmoronar lá pelo km 30.',
      'A mobilidade garante que os ganhos de força e o volume de corrida não fiquem "presos" em articulações enrijecidas (quadril e tornozelo), causa raiz da maioria das dores de corredor.',
    ],
  },

  phases: [
    {
      name: '1. Base',
      weeks: 'Sem. 1–8',
      runFocus: 'Volume aeróbico leve, técnica, longão sobe de ~14 para ~22km',
      strengthFocus: 'Adaptação anatômica — técnica, repetições moderadas (10–15)',
    },
    {
      name: '2. Construção',
      weeks: 'Sem. 9–16',
      runFocus: 'Ritmo de prova e tempo runs, longão sobe até ~29km',
      strengthFocus: 'Força máxima — cargas mais altas, repetições baixas (6–8)',
    },
    {
      name: '3. Pico específico',
      weeks: 'Sem. 17–20',
      runFocus: 'Longões com trechos em ritmo de maratona, pico (~32–34km) na semana 18–19',
      strengthFocus: 'Manutenção — volume reduzido (menos séries em todos os dias)',
    },
    {
      name: '4. Polimento (taper)',
      weeks: 'Sem. 21–24',
      runFocus: 'Redução progressiva de volume (~40% na semana da prova)',
      strengthFocus: 'Quase zero — ver ajuste específico abaixo',
    },
  ],
  phaseCycleNote:
    'Regra nas fases 1 e 2: 3 semanas de progressão + 1 semana de recuo (~20–30% menos volume).',

  weekOverview: [
    { day: 'Segunda', strengthFocus: 'Perna (pesada)', runLabel: null },
    { day: 'Terça', strengthFocus: 'Peito e tríceps', runLabel: 'Moderada' },
    { day: 'Quarta', strengthFocus: 'Ombro', runLabel: null },
    { day: 'Quinta', strengthFocus: 'Costas e bíceps', runLabel: 'Qualidade (forte)' },
    { day: 'Sexta', strengthFocus: 'Perna (leve)', runLabel: null },
    { day: 'Sábado', strengthFocus: '—', runLabel: 'Longão' },
    { day: 'Domingo', strengthFocus: 'Descanso', runLabel: null },
  ],
  weekOverviewNote:
    'Nos dias duplos (terça e quinta), se possível separe corrida e musculação por algumas horas (ex: corrida de manhã, musculação à tarde/noite). Se não der, corra primeiro — a musculação de superior não é prejudicada por pernas cansadas.',

  weekPlan: [
    {
      day: 'Segunda — Perna (pesada)',
      focus: 'Perna (pesada)',
      hasRun: false,
      intro:
        'Dia principal de força de perna: perna está "fresca" do descanso de domingo, e há a semana toda pela frente pra recuperar antes do longão de sábado.',
      exercises: [
        { name: 'Agachamento livre', series: '4x6–10' },
        { name: 'Levantamento terra romeno (RDL)', series: '3x8–12' },
        { name: 'Cadeira extensora', series: '3x12' },
        { name: 'Mesa/cadeira flexora', series: '3x12' },
        { name: 'Elevação de panturrilha (pé reto)', series: '3x15' },
        { name: 'Prancha frontal', series: '3x30–45s' },
      ],
    },
    {
      day: 'Terça — Peito e tríceps + corrida moderada',
      focus: 'Peito e tríceps',
      hasRun: true,
      runLabel: 'Moderada',
      intro: 'Musculação:',
      runNote:
        'Moderada / fartlek leve (pernas ainda semi-recuperadas da segunda, não é dia de intensidade máxima).',
      exercises: [
        { name: 'Supino reto (barra ou halteres)', series: '3x8–10' },
        { name: 'Supino inclinado (halteres)', series: '3x10' },
        { name: 'Crucifixo ou peck deck', series: '3x12' },
        { name: 'Tríceps corda', series: '3x12' },
        { name: 'Tríceps francês', series: '3x10' },
        { name: 'Pallof press (anti-rotação, sustenta o tronco na corrida)', series: '2x10 cada lado' },
      ],
    },
    {
      day: 'Quarta — Ombro',
      focus: 'Ombro',
      hasRun: false,
      intro: 'Dia sem perna e sem corrida — bom momento pra investir mais tempo em mobilidade.',
      exercises: [
        { name: 'Desenvolvimento de ombro (halteres ou barra)', series: '3x8–10' },
        { name: 'Elevação lateral', series: '3x12' },
        { name: 'Elevação posterior (postura de corrida, evita ombros caídos na fadiga)', series: '3x12' },
        { name: 'Encolhimento (trapézio)', series: '3x12' },
        { name: 'Prancha lateral', series: '2x30–45s cada lado' },
        { name: 'Bloco extra de mobilidade de quadril e tornozelo (ver seção abaixo)', series: '' },
      ],
    },
    {
      day: 'Quinta — Costas e bíceps + corrida de qualidade',
      focus: 'Costas e bíceps',
      hasRun: true,
      runLabel: 'Qualidade (forte)',
      intro: 'Musculação:',
      runNote:
        'Intervalado ou tempo run — pernas bem recuperadas (72h longe da perna pesada de segunda), melhor dia da semana pra intensidade alta.',
      exercises: [
        { name: 'Puxada alta (pulldown) ou barra fixa assistida', series: '3x8–10' },
        { name: 'Remada curvada ou remada cabo', series: '3x10' },
        { name: 'Remada unilateral (halter)', series: '3x10 cada lado' },
        { name: 'Rosca direta', series: '3x12' },
        { name: 'Rosca alternada', series: '3x10' },
        { name: 'Dead bug (controle de tronco)', series: '2x10 cada lado' },
      ],
    },
    {
      day: 'Sexta — Perna (leve)',
      focus: 'Perna (leve)',
      hasRun: false,
      intro:
        'Propositalmente mais leve que segunda — carga moderada, foco em técnica e unilateral, pra não comprometer o longão de sábado.',
      exercises: [
        { name: 'Afundo búlgaro', series: '3x8–10 cada perna' },
        { name: 'Step-up', series: '2x10 cada perna' },
        { name: 'Single-leg RDL', series: '2x8 cada perna' },
        { name: 'Panturrilha unilateral, joelho dobrado (sóleo)', series: '2x15 cada perna' },
        { name: 'Trabalho de pé/tornozelo (short foot)', series: '2x20s' },
      ],
    },
    {
      day: 'Sábado — Longão',
      focus: 'Longão',
      hasRun: true,
      runLabel: 'Longão',
      intro: 'O treino mais importante da semana. Ritmo sempre confortável/conversável.',
      runNote:
        'Aumente ~1–2km a cada 1–2 semanas, com recuo a cada 4ª semana. A partir da Construção, inclua os últimos 15–20% em ritmo de maratona. Mobilidade pós-longão é inegociável.',
      exercises: [],
    },
    {
      day: 'Domingo — Descanso',
      focus: 'Descanso',
      hasRun: false,
      intro: 'Descanso total. Mobilidade leve/foam roller é opcional, mas sem treino prescrito.',
      exercises: [],
    },
  ],

  taperAdjustment: {
    title: 'Ajuste no polimento (semanas 21–24)',
    intro:
      'O split de 5 dias de musculação + 3 dias de corrida é pesado demais pras últimas semanas antes da prova. Ajustes:',
    items: [
      'Semanas 21–22: corte pela metade o número de séries em todos os dias de musculação (ex: 2 exercícios por grupo em vez de 5–6, 2 séries cada).',
      'Semana 23: apenas 2–3 sessões leves de ativação (ex: segunda-perna e quinta-costas, com carga bem reduzida), sem chegar perto da falha.',
      'Semana 24 (semana da prova): só mobilidade e ativação leve, nada de carga significativa.',
    ],
  },

  longRunProgression: [
    { phase: 'Base', range: '~14km → ~22km' },
    { phase: 'Construção', range: '~24km → ~29km' },
    { phase: 'Pico', range: '~30km → ~32–34km (pico, 3–4 semanas antes da prova)' },
    { phase: 'Taper', range: '~21km → ~13km → ~8km na semana da prova' },
  ],

  mobility: [
    {
      title: 'Aquecimento dinâmico (antes de qualquer sessão) — 8–10min',
      items: [
        { name: 'Balanço de perna frontal e lateral', series: '10x cada perna' },
        { name: 'Avanço com giro de tronco', series: '8x cada lado' },
        { name: 'Abertura de quadril 90/90', series: '5x cada lado' },
        { name: 'Skip alto / chute no glúteo', series: '20m cada' },
        { name: 'Círculos de tornozelo', series: '10x cada direção' },
      ],
    },
    {
      title: 'Mobilidade específica pós-treino (10–15min)',
      items: [
        { name: 'Flexor de quadril (couch stretch)', series: '60s cada lado' },
        { name: 'Dorsiflexão de tornozelo (rock joelho-parede)', series: '10x cada lado' },
        { name: 'Pomba (rotação externa de quadril)', series: '60s cada lado' },
        { name: 'Rolo miofascial — panturrilha, trato iliotibial, quadríceps, glúteo', series: '60–90s cada área' },
        { name: 'Rotação torácica (open book)', series: '8x cada lado' },
      ],
    },
  ],

  goldenRules: [
    { number: '1', text: 'Regra dos 10%: nunca aumente o volume semanal de corrida em mais de ~10% de uma semana para outra.' },
    {
      number: '2',
      text: 'Dor aguda/pontada ≠ desconforto muscular normal. Dor localizada, que piora durante o treino, ou persiste 48h+ em repouso = parar e avaliar.',
    },
    { number: '3', text: 'Semana de recuo a cada 4 semanas é treino, não preguiça.' },
    {
      number: '4',
      text: 'Taper é sagrado: siga o ajuste de polimento acima à risca — o ganho de fitness nas últimas semanas é zero, o risco de lesão é alto.',
    },
    {
      number: '5',
      text: 'Sexta (perna leve) nunca deve doer no dia seguinte de um jeito que atrapalhe o longão — se isso acontecer, reduza ainda mais a carga desse dia.',
    },
  ],

  paceNote:
    'Os ritmos de corrida estão descritos por esforço percebido de propósito. Para converter em paces exatos (min/km), use o tempo recente da meia maratona do cliente como referência.',
};
