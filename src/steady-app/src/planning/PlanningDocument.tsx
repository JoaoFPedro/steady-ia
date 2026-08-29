import { Fragment, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, ScrollView } from 'react-native';
import { PrimaryButton, Rule } from '../ui/Nocturne';
import { color, radius, space, textAlpha, type } from '../theme/nocturne';
import type { TrainingPlanDocument } from './trainingPlanDocument';
import type { PlanRequestSummary } from './planRequest';
import type { DayStatus } from './dayCompletion';
import { ExerciseList } from './ExerciseList';
import { shared } from './planningStyles';
import { SemanaSection } from './SemanaSection';
import type { SectionId } from './planDayParam';
import type { TrainingSheet } from '../coaching/types';
import { formatRaceDate } from './raceDate';
import {
  EQUIPMENT_ACCESS_LABEL,
  PAIN_AREA_LABEL,
  RACE_DISTANCE_LABEL,
} from './trainingPlanRequest';

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: 'dados', label: 'Seus dados' },
  { id: 'fases', label: 'Fases' },
  { id: 'semana', label: 'Semana' },
  { id: 'mobilidade', label: 'Mobilidade' },
  { id: 'regras', label: 'Regras' },
];

/**
 * Plano gerado — layout segue `tela.html` (turno 2, artboard 2b): cabeçalho
 * fixo (título, subtítulo, abas internas) + corpo rolável por aba + botão
 * fixo no rodapé. Diferente da Dashboard/formulário, não é um `ScrollView`
 * único — só a aba ativa rola, o cabeçalho fica parado.
 */
export function PlanningDocument({
  document,
  request,
  topInset,
  onEdit,
  initialSection = 'dados',
  openDay = null,
  dayStatuses = [],
  todayIndex = -1,
  todayStatus = 'semMarca',
  sheet = null,
  sheetStale = false,
  sheetLoading = false,
  onRegister,
}: {
  document: TrainingPlanDocument;
  /**
   * O pedido que originou este planejamento. É a única parte que varia entre
   * dois planejamentos: os treinos abaixo são o mesmo conteúdo para todos, até
   * a geração deixar de ser mockada (spec STORY-010, regra 17).
   */
  request: PlanRequestSummary;
  topInset: number;
  onEdit: () => void;
  /**
   * Aba de entrada. O padrão continua sendo "Seus dados" — chegar pela aba
   * Planejamento não muda o comportamento antigo (STORY-012, regra 3). Só o
   * card da Dashboard pede a Semana.
   */
  initialSection?: SectionId;
  /** `day.day` que já chega expandido, quando a entrada foi pelo card. */
  openDay?: string | null;
  /** Estado de cada dia, alinhado a `weekPlan`. Vazio = nada a marcar. */
  dayStatuses?: readonly DayStatus[];
  todayIndex?: number;
  /** Estado de hoje para o botão de registro — sem o corte da janela do plano. */
  todayStatus?: DayStatus;
  sheet?: TrainingSheet | null;
  sheetStale?: boolean;
  sheetLoading?: boolean;
  onRegister?: (planDayIndex: number) => void;
}) {
  const [section, setSection] = useState<SectionId>(initialSection);
  const body = useRef<ScrollView>(null);

  return (
    <View style={s.screen}>
      <View style={[s.header, { paddingTop: topInset + space[4] }]}>
        <View style={s.headerTop}>
          <Text style={s.title} numberOfLines={2}>
            {RACE_DISTANCE_LABEL[request.raceDistance] ?? request.raceDistance}
          </Text>
          <Pressable onPress={onEdit} hitSlop={space[3]}>
            <Text style={s.editLink}>Editar dados</Text>
          </Pressable>
        </View>
        <Text style={s.subtitle}>
          Prova em {formatRaceDate(request.raceDate)}
          {request.pending ? ' · ainda não enviado' : ''}
        </Text>
        <View style={s.tabs}>
          {SECTIONS.map((sec) => {
            const active = sec.id === section;
            return (
              <Pressable key={sec.id} onPress={() => setSection(sec.id)} style={s.tab}>
                <Text style={[s.tabLabel, active && s.tabLabelActive]}>{sec.label}</Text>
                <View style={[s.tabIndicator, active && s.tabIndicatorActive]} />
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView
        ref={body}
        style={s.body}
        contentContainerStyle={s.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {section === 'dados' && <SeusDadosSection request={request} />}
        {section === 'fases' && <FasesSection document={document} />}
        {section === 'semana' && (
          <SemanaSection
            document={document}
            statuses={dayStatuses}
            todayIndex={todayIndex}
            todayStatus={todayStatus}
            initialOpenDay={openDay}
            sheet={sheet}
            sheetStale={sheetStale}
            sheetLoading={sheetLoading}
            onRegister={onRegister ?? (() => {})}
            // Sem animação: o dia precisa já estar na tela quando ela aparece,
            // não deslizar até lá depois (regra 1).
            onDayLayout={(y) =>
              body.current?.scrollTo({ y: Math.max(0, y - space[6]), animated: false })
            }
          />
        )}
        {section === 'mobilidade' && <MobilidadeSection document={document} />}
        {section === 'regras' && <RegrasSection document={document} />}
      </ScrollView>

      {/* <View style={s.footer}>
        <PrimaryButton label="Começar semana 1" onPress={() => setSection('semana')} />
      </View> */}
    </View>
  );
}

/**
 * As respostas gravadas deste pedido. Campo opcional não respondido simplesmente
 * não aparece — sem "—", sem "não informado" (spec regra 16).
 */
function SeusDadosSection({ request }: { request: PlanRequestSummary }) {
  const linhas: { rotulo: string; valor: string }[] = [
    { rotulo: 'Distância', valor: RACE_DISTANCE_LABEL[request.raceDistance] ?? request.raceDistance },
    { rotulo: 'Data da prova', valor: formatRaceDate(request.raceDate) },
    { rotulo: 'Primeira vez nesta distância', valor: request.raceIsFirstTime ? 'Sim' : 'Não' },
    { rotulo: 'Maior corrida recente', valor: `${request.longestRecentRunKm} km` },
    { rotulo: 'Treinos por semana', valor: `${request.trainingDaysPerWeek} dias` },
  ];

  if (request.currentWeeklyRunningDays !== null)
    linhas.push({ rotulo: 'Corridas por semana hoje', valor: `${request.currentWeeklyRunningDays}` });

  if (request.referenceDistanceKm !== null && request.referenceDuration)
    linhas.push({
      rotulo: 'Referência',
      valor: `${request.referenceDistanceKm} km em ${request.referenceDuration}`,
    });

  if (request.strengthSessionMinutes !== null)
    linhas.push({ rotulo: 'Sessão de força', valor: `${request.strengthSessionMinutes} min` });

  if (request.equipmentAccess)
    linhas.push({
      rotulo: 'Equipamento',
      valor: EQUIPMENT_ACCESS_LABEL[request.equipmentAccess] ?? request.equipmentAccess,
    });

  if (request.recurringPainAreas.length > 0)
    linhas.push({
      rotulo: 'Dores recorrentes',
      valor: request.recurringPainAreas.map((area) => PAIN_AREA_LABEL[area] ?? area).join(', '),
    });

  return (
    <View>
      <Text style={shared.kick}>O que você respondeu</Text>
      <View style={s.dataList}>
        {linhas.map((linha) => (
          <View key={linha.rotulo} style={s.dataRow}>
            <Text style={s.dataLabel}>{linha.rotulo}</Text>
            <Text style={s.dataValue}>{linha.valor}</Text>
          </View>
        ))}
      </View>

      {request.priorInjuries && (
        <>
          <Rule />
          <Text style={shared.kick}>Lesões anteriores</Text>
          <Text style={shared.paragraph}>{request.priorInjuries}</Text>
        </>
      )}

      <Rule />
      {/* Honestidade explícita: o plano abaixo ainda não é calculado a partir
          destas respostas (DISC-002 — geração fica para depois). */}
      <Text style={shared.paragraph}>
        O plano nas abas seguintes ainda não é calculado a partir destas respostas —
        elas ficam guardadas para quando a geração entrar.
      </Text>
    </View>
  );
}

function FasesSection({ document }: { document: TrainingPlanDocument }) {
  return (
    <View>
      <Text style={shared.kick}>Princípio central</Text>
      <Text style={shared.paragraph}>{document.principle.intro}</Text>
      <BulletList items={document.principle.points} />

      <Rule />
      <Text style={shared.kick}>Visão geral das fases</Text>
      <View style={s.phaseList}>
        {document.phases.map((phase, index) => (
          <Fragment key={phase.name}>
            {index > 0 && <View style={s.phaseDivider} />}
            <View style={s.phaseHead}>
              <Text style={s.phaseName}>{phase.name}</Text>
              <Text style={s.phaseWeeks}>{phase.weeks}</Text>
            </View>
            <View style={s.phaseColumns}>
              <View style={s.phaseColumn}>
                <Text style={s.phaseColumnLabel}>Corrida</Text>
                <Text style={s.phaseColumnText}>{phase.runFocus}</Text>
              </View>
              <View style={s.phaseColumn}>
                <Text style={s.phaseColumnLabel}>Musculação</Text>
                <Text style={s.phaseColumnText}>{phase.strengthFocus}</Text>
              </View>
            </View>
          </Fragment>
        ))}
      </View>
      <View style={shared.callout}>
        <Text style={shared.calloutText}>{document.phaseCycleNote}</Text>
      </View>

      <Rule />
      <Text style={shared.kick}>Progressão aproximada do longão</Text>
      <View>
        {document.longRunProgression.map((row) => (
          <View key={row.phase} style={s.progressionRow}>
            <Text style={s.progressionPhase}>{row.phase}</Text>
            <Text style={s.progressionRange}>{row.range}</Text>
          </View>
        ))}
      </View>

      <Rule />
      <Text style={shared.kick}>{document.taperAdjustment.title}</Text>
      <Text style={shared.paragraph}>{document.taperAdjustment.intro}</Text>
      <BulletList items={document.taperAdjustment.items} />
    </View>
  );
}

function MobilidadeSection({ document }: { document: TrainingPlanDocument }) {
  return (
    <View>
      <Text style={shared.paragraph}>Mobilidade — a cola entre os treinos.</Text>
      {document.mobility.map((block, index) => (
        <Fragment key={block.title}>
          <Rule />
          <Text style={shared.kick}>{block.title}</Text>
          <ExerciseList items={block.items} spaced={index === 0} />
        </Fragment>
      ))}
    </View>
  );
}

function RegrasSection({ document }: { document: TrainingPlanDocument }) {
  return (
    <View>
      <Text style={shared.kick}>Regras de ouro (prevenção de lesão)</Text>
      <View style={s.rulesList}>
        {document.goldenRules.map((rule) => (
          <View key={rule.number} style={s.ruleCard}>
            <Text style={s.ruleNumber}>{rule.number}</Text>
            <Text style={s.ruleText}>{rule.text}</Text>
          </View>
        ))}
      </View>

      <Rule />
      <Text style={shared.kick}>Observação sobre ritmos</Text>
      <Text style={shared.paragraph}>{document.paceNote}</Text>
    </View>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <View style={s.list}>
      {items.map((item) => (
        <View key={item} style={s.listRow}>
          <View style={s.bulletDot} />
          <Text style={s.listText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  dataList: { marginTop: space[4], gap: space[3] },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', gap: space[6] },
  dataLabel: { color: textAlpha.label, fontSize: type.meta, flexShrink: 1 },
  dataValue: { color: color.text, fontSize: type.meta, fontWeight: '600', textAlign: 'right', flexShrink: 1 },
  screen: { flex: 1, backgroundColor: color.bg },

  header: { paddingHorizontal: space[8], paddingBottom: 0 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: space[3] },
  title: { flex: 1, color: color.text, fontSize: type.cardTitle, fontWeight: '500', lineHeight: 24 },
  editLink: { color: color.accentRamp[400], fontSize: type.label, marginTop: space[1] },
  subtitle: { color: textAlpha.faint, fontSize: type.label, marginTop: space[2], lineHeight: 16 },

  tabs: { flexDirection: 'row', gap: space[6], marginTop: space[4], borderBottomWidth: 1, borderBottomColor: textAlpha.rule },
  tab: { paddingBottom: space[3], alignItems: 'center' },
  tabLabel: { fontSize: type.bodySm, color: textAlpha.faint },
  tabLabelActive: { color: color.text },
  tabIndicator: { height: 2, width: '100%', marginTop: space[2], backgroundColor: 'transparent' },
  tabIndicatorActive: { backgroundColor: color.accent },

  body: { flex: 1 },
  bodyContent: { paddingHorizontal: space[8], paddingTop: space[4], paddingBottom: space[8] },

  footer: {
    padding: space[6],
    paddingHorizontal: space[8],
    borderTopWidth: 1,
    borderTopColor: textAlpha.rule,
    backgroundColor: color.bg,
  },



  list: { gap: space[3], marginTop: space[4] },
  listRow: { flexDirection: 'row', gap: space[3], alignItems: 'flex-start' },
  bulletDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: color.accent, marginTop: 7 },
  listText: { flex: 1, fontSize: type.bodySm, lineHeight: 20, color: textAlpha.label },

  phaseList: { marginTop: space[4] },
  phaseDivider: { height: 1, backgroundColor: textAlpha.rule, marginVertical: space[4] },
  phaseHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  phaseName: { fontSize: type.body, color: color.text },
  phaseWeeks: { fontSize: type.label, fontFamily: 'monospace', color: color.accentRamp[400] },
  phaseColumns: { flexDirection: 'row', gap: space[4], marginTop: space[3] },
  phaseColumn: { flex: 1 },
  phaseColumnLabel: { fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: textAlpha.ghost },
  phaseColumnText: { fontSize: type.meta, lineHeight: 18, color: textAlpha.label, marginTop: space[1] },

  progressionRow: {
    flexDirection: 'row',
    gap: space[3],
    alignItems: 'baseline',
    paddingVertical: space[3],
    borderBottomWidth: 1,
    borderBottomColor: textAlpha.rule,
  },
  progressionPhase: { width: 82, fontSize: type.bodySm, color: color.text },
  progressionRange: { flex: 1, fontSize: type.meta, lineHeight: 18, color: textAlpha.muted },




  rulesList: { gap: space[2], marginTop: space[4] },
  ruleCard: {
    flexDirection: 'row',
    gap: space[3],
    padding: space[4],
    borderRadius: radius.md,
    backgroundColor: color.surface,
  },
  ruleNumber: { fontSize: type.label, fontFamily: 'monospace', color: color.accent, width: 14 },
  ruleText: { flex: 1, fontSize: type.bodySm, lineHeight: 19, color: textAlpha.label },
});
