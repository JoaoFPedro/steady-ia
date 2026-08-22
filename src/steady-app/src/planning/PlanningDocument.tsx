import { Fragment, useState } from 'react';
import { Pressable, StyleSheet, Text, View, ScrollView } from 'react-native';
import { PrimaryButton, Rule } from '../ui/Nocturne';
import { color, radius, space, textAlpha, type } from '../theme/nocturne';
import type { Exercise, TrainingPlanDocument, WeekPlanDay } from './trainingPlanDocument';

type SectionId = 'fases' | 'semana' | 'mobilidade' | 'regras';

const SECTIONS: { id: SectionId; label: string }[] = [
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
  topInset,
  onEdit,
}: {
  document: TrainingPlanDocument;
  topInset: number;
  onEdit: () => void;
}) {
  const [section, setSection] = useState<SectionId>('fases');

  return (
    <View style={s.screen}>
      <View style={[s.header, { paddingTop: topInset + space[4] }]}>
        <View style={s.headerTop}>
          <Text style={s.title} numberOfLines={2}>
            {document.title}
          </Text>
          <Pressable onPress={onEdit} hitSlop={space[3]}>
            <Text style={s.editLink}>Editar dados</Text>
          </Pressable>
        </View>
        <Text style={s.subtitle}>{document.subtitle}</Text>
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

      <ScrollView style={s.body} contentContainerStyle={s.bodyContent} showsVerticalScrollIndicator={false}>
        {section === 'fases' && <FasesSection document={document} />}
        {section === 'semana' && <SemanaSection document={document} />}
        {section === 'mobilidade' && <MobilidadeSection document={document} />}
        {section === 'regras' && <RegrasSection document={document} />}
      </ScrollView>

      <View style={s.footer}>
        <PrimaryButton label="Começar semana 1" onPress={() => setSection('semana')} />
      </View>
    </View>
  );
}

function FasesSection({ document }: { document: TrainingPlanDocument }) {
  return (
    <View>
      <Text style={s.kick}>Princípio central</Text>
      <Text style={s.paragraph}>{document.principle.intro}</Text>
      <BulletList items={document.principle.points} />

      <Rule />
      <Text style={s.kick}>Visão geral das fases</Text>
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
      <View style={s.callout}>
        <Text style={s.calloutText}>{document.phaseCycleNote}</Text>
      </View>

      <Rule />
      <Text style={s.kick}>Progressão aproximada do longão</Text>
      <View>
        {document.longRunProgression.map((row) => (
          <View key={row.phase} style={s.progressionRow}>
            <Text style={s.progressionPhase}>{row.phase}</Text>
            <Text style={s.progressionRange}>{row.range}</Text>
          </View>
        ))}
      </View>

      <Rule />
      <Text style={s.kick}>{document.taperAdjustment.title}</Text>
      <Text style={s.paragraph}>{document.taperAdjustment.intro}</Text>
      <BulletList items={document.taperAdjustment.items} />
    </View>
  );
}

function SemanaSection({ document }: { document: TrainingPlanDocument }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <View>
      <Text style={s.kick}>Estrutura semanal (seu split)</Text>
      <View style={s.overviewTable}>
        {document.weekOverview.map((row) => (
          <View key={row.day} style={s.overviewRow}>
            <Text style={s.overviewDay}>{row.day}</Text>
            <Text style={s.overviewFocus}>{row.strengthFocus}</Text>
            <Text style={row.runLabel ? s.overviewRun : s.overviewRunEmpty}>{row.runLabel ?? '—'}</Text>
          </View>
        ))}
      </View>
      <View style={s.callout}>
        <Text style={s.calloutText}>{document.weekOverviewNote}</Text>
      </View>

      <Rule />
      <Text style={s.kick}>Detalhamento de cada dia</Text>
      <View style={s.weekList}>
        {document.weekPlan.map((day) => (
          <DayRow
            key={day.day}
            day={day}
            open={expanded === day.day}
            onToggle={() => setExpanded((current) => (current === day.day ? null : day.day))}
          />
        ))}
      </View>
    </View>
  );
}

function DayRow({ day, open, onToggle }: { day: WeekPlanDay; open: boolean; onToggle: () => void }) {
  return (
    <Pressable onPress={onToggle} style={s.dayRow}>
      <View style={s.dayRowHead}>
        <Text style={s.dayFocus} numberOfLines={open ? undefined : 1}>
          {day.day}
        </Text>
        {day.hasRun && (
          <View style={s.dayRunBadge}>
            <Text style={s.dayRunBadgeText}>{day.runLabel}</Text>
          </View>
        )}
      </View>

      {open && (
        <View style={s.dayDetail}>
          <Text style={s.dayNote}>{day.intro}</Text>
          {day.runNote && (
            <View style={s.runNoteBox}>
              <Text style={s.runNoteText}>{day.runNote}</Text>
            </View>
          )}
          <ExerciseList items={day.exercises} />
        </View>
      )}
    </Pressable>
  );
}

function MobilidadeSection({ document }: { document: TrainingPlanDocument }) {
  return (
    <View>
      <Text style={s.paragraph}>Mobilidade — a cola entre os treinos.</Text>
      {document.mobility.map((block, index) => (
        <Fragment key={block.title}>
          <Rule />
          <Text style={s.kick}>{block.title}</Text>
          <ExerciseList items={block.items} spaced={index === 0} />
        </Fragment>
      ))}
    </View>
  );
}

function RegrasSection({ document }: { document: TrainingPlanDocument }) {
  return (
    <View>
      <Text style={s.kick}>Regras de ouro (prevenção de lesão)</Text>
      <View style={s.rulesList}>
        {document.goldenRules.map((rule) => (
          <View key={rule.number} style={s.ruleCard}>
            <Text style={s.ruleNumber}>{rule.number}</Text>
            <Text style={s.ruleText}>{rule.text}</Text>
          </View>
        ))}
      </View>

      <Rule />
      <Text style={s.kick}>Observação sobre ritmos</Text>
      <Text style={s.paragraph}>{document.paceNote}</Text>
    </View>
  );
}

function ExerciseList({ items, spaced }: { items: Exercise[]; spaced?: boolean }) {
  return (
    <View style={spaced ? s.spacedTop : undefined}>
      {items.map((item) => (
        <View key={item.name} style={s.exerciseRow}>
          <Text style={s.exerciseName}>{item.name}</Text>
          {item.series !== '' && <Text style={s.exerciseSeries}>{item.series}</Text>}
        </View>
      ))}
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

  kick: {
    fontSize: type.kicker,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: color.accentRamp[400],
    marginTop: space[2],
  },
  paragraph: { fontSize: type.bodySm, lineHeight: 20, color: color.text, marginTop: space[3] },
  spacedTop: { marginTop: space[3] },

  callout: {
    marginTop: space[4],
    padding: space[4],
    borderRadius: radius.md,
    backgroundColor: color.accentRamp[900],
  },
  calloutText: { fontSize: type.bodySm, lineHeight: 19, color: color.accentRamp[300] },

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

  overviewTable: { marginTop: space[4] },
  overviewRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: space[3],
    paddingVertical: space[2],
    borderBottomWidth: 1,
    borderBottomColor: textAlpha.rule,
  },
  overviewDay: { width: 64, fontSize: type.bodySm, color: color.text },
  overviewFocus: { flex: 1, fontSize: type.meta, color: textAlpha.label },
  overviewRun: { fontSize: type.meta, color: color.accentRamp[400] },
  overviewRunEmpty: { fontSize: type.meta, color: textAlpha.ghost },

  weekList: { marginTop: space[4], gap: space[2] },
  dayRow: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: textAlpha.divider,
    backgroundColor: color.surface,
    padding: space[4],
  },
  dayRowHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space[3] },
  dayFocus: { flex: 1, fontSize: type.bodySm, color: color.text },
  dayRunBadge: { borderRadius: radius.sm, paddingHorizontal: space[2], paddingVertical: 2, backgroundColor: color.accentRamp[900] },
  dayRunBadgeText: { fontSize: type.label, color: color.accentRamp[400] },
  dayDetail: { marginTop: space[3], paddingTop: space[3], borderTopWidth: 1, borderTopColor: textAlpha.rule },
  dayNote: { fontSize: type.meta, lineHeight: 18, color: textAlpha.muted },
  runNoteBox: { marginTop: space[3], padding: space[3], borderRadius: radius.sm, backgroundColor: color.accentRamp[900] },
  runNoteText: { fontSize: type.meta, lineHeight: 17, color: color.accentRamp[300] },

  exerciseRow: { paddingVertical: space[2], borderBottomWidth: 1, borderBottomColor: textAlpha.rule },
  exerciseName: { fontSize: type.bodySm, color: color.text, flexShrink: 1 },
  exerciseSeries: { fontSize: type.label, fontFamily: 'monospace', color: textAlpha.faint, marginTop: 2 },

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
