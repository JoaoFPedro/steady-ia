import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Rule, SecondaryButton } from '../ui/Nocturne';
import { color, radius, space, textAlpha, type } from '../theme/nocturne';
import type { TrainingPlanDocument, WeekPlanDay } from './trainingPlanDocument';
import type { DayStatus } from './dayCompletion';
import { dayRequirements } from './dayRequirements';
import { ExerciseList } from './ExerciseList';
import { shared } from './planningStyles';

/**
 * A aba Semana — a estrutura semanal e o detalhamento de cada dia
 * (STORY-006), agora dizendo o que já foi cumprido e oferecendo o registro
 * do treino de hoje (STORY-012).
 *
 * Saiu de `PlanningDocument.tsx` porque o arquivo já passava de 300 linhas
 * (FF-003) antes desta story e é aqui que ela cresce.
 */
export type RegisterKind = 'running' | 'strength';

const MARCA: Record<Exclude<DayStatus, 'semMarca'>, { texto: string; estilo: object }> = {
  cumprido: { texto: 'Feito', estilo: { color: color.accent } },
  parcial: { texto: 'Parcial', estilo: { color: color.accentRamp[400] } },
  naoFeito: { texto: 'Não feito', estilo: { color: textAlpha.ghost } },
};

export function SemanaSection({
  document,
  statuses,
  todayIndex,
  initialOpenDay,
  onRegister,
  onDayLayout,
}: {
  document: TrainingPlanDocument;
  /** Alinhado a `weekPlan`: índice 0 é segunda, 6 é domingo. */
  statuses: readonly DayStatus[];
  /** Índice de hoje em `weekPlan`, ou `-1` quando a semana não é a de hoje. */
  todayIndex: number;
  /** `day.day` que já chega expandido — o caminho vindo do card da Dashboard. */
  initialOpenDay: string | null;
  onRegister: (kind: RegisterKind, planDayIndex: number) => void;
  /** Onde o dia expandido ficou, para a tela poder rolar até ele. */
  onDayLayout?: (y: number) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(initialOpenDay);

  // O `y` de um `onLayout` é relativo ao pai, não ao topo do conteúdo rolável.
  // O dia expandido está dois níveis abaixo, então a posição real é a soma das
  // duas medidas — e elas não chegam em ordem garantida.
  const posicao = useRef<{ lista?: number; dia?: number; jaAvisou?: boolean }>({});
  const avisarQuandoSouber = (parte: 'lista' | 'dia', y: number) => {
    posicao.current[parte] = y;
    const { lista, dia, jaAvisou } = posicao.current;
    if (jaAvisou || lista === undefined || dia === undefined) return;

    // Uma vez só. `onLayout` volta a disparar sempre que a lista se remede — e
    // ela se remede a cada dia que o corredor abre ou fecha. Sem esta trava, o
    // primeiro toque em qualquer outro dia puxaria a tela de volta para hoje.
    posicao.current.jaAvisou = true;
    onDayLayout?.(lista + dia);
  };

  return (
    <View>
      <Text style={shared.kick}>Estrutura semanal (seu split)</Text>
      <View style={s.overviewTable}>
        {document.weekOverview.map((row) => (
          <View key={row.day} style={s.overviewRow}>
            <Text style={s.overviewDay}>{row.day}</Text>
            <Text style={s.overviewFocus}>{row.strengthFocus}</Text>
            <Text style={row.runLabel ? s.overviewRun : s.overviewRunEmpty}>
              {row.runLabel ?? '—'}
            </Text>
          </View>
        ))}
      </View>
      <View style={shared.callout}>
        <Text style={shared.calloutText}>{document.weekOverviewNote}</Text>
      </View>

      <Rule />
      <Text style={shared.kick}>Detalhamento de cada dia</Text>
      <View
        style={s.weekList}
        onLayout={(evento) => avisarQuandoSouber('lista', evento.nativeEvent.layout.y)}
      >
        {document.weekPlan.map((day, index) => (
          <DayRow
            key={day.day}
            day={day}
            index={index}
            status={statuses[index] ?? 'semMarca'}
            isToday={index === todayIndex}
            open={expanded === day.day}
            onToggle={() => setExpanded((atual) => (atual === day.day ? null : day.day))}
            onRegister={onRegister}
            onLayout={
              day.day === initialOpenDay ? (y) => avisarQuandoSouber('dia', y) : undefined
            }
          />
        ))}
      </View>
    </View>
  );
}

function DayRow({
  day,
  index,
  status,
  isToday,
  open,
  onToggle,
  onRegister,
  onLayout,
}: {
  day: WeekPlanDay;
  index: number;
  status: DayStatus;
  isToday: boolean;
  open: boolean;
  onToggle: () => void;
  onRegister: (kind: RegisterKind, planDayIndex: number) => void;
  onLayout?: (y: number) => void;
}) {
  const previsto = dayRequirements(day);
  const marca = status === 'semMarca' ? null : MARCA[status];

  return (
    <Pressable
      onPress={onToggle}
      style={[s.dayRow, isToday && s.dayRowToday]}
      onLayout={onLayout ? (evento) => onLayout(evento.nativeEvent.layout.y) : undefined}
    >
      <View style={s.dayRowHead}>
        <Text style={s.dayFocus} numberOfLines={open ? undefined : 1}>
          {day.day}
        </Text>
        {marca !== null && <Text style={[s.dayMark, marca.estilo]}>{marca.texto}</Text>}
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

          {/* Só hoje: o registro grava sempre com a data de hoje (`todayIso`),
              então um botão em outro dia gravaria a data errada (regra 6). */}
          {isToday && (previsto.strength || previsto.run) && (
            <View style={s.actions}>
              {previsto.strength && (
                <SecondaryButton
                  label="Registrar musculação"
                  onPress={() => onRegister('strength', index)}
                />
              )}
              {previsto.run && (
                <SecondaryButton label="Registrar corrida" onPress={() => onRegister('running', index)} />
              )}
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
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
  dayRowToday: { borderColor: color.accentRamp[400] },
  dayRowHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[3],
  },
  dayFocus: { flex: 1, fontSize: type.bodySm, color: color.text },
  dayMark: { fontSize: type.label },
  dayRunBadge: {
    borderRadius: radius.sm,
    paddingHorizontal: space[2],
    paddingVertical: 2,
    backgroundColor: color.accentRamp[900],
  },
  dayRunBadgeText: { fontSize: type.label, color: color.accentRamp[400] },
  dayDetail: {
    marginTop: space[3],
    paddingTop: space[3],
    borderTopWidth: 1,
    borderTopColor: textAlpha.rule,
  },
  dayNote: { fontSize: type.meta, lineHeight: 18, color: textAlpha.muted },
  runNoteBox: {
    marginTop: space[3],
    padding: space[3],
    borderRadius: radius.sm,
    backgroundColor: color.accentRamp[900],
  },
  runNoteText: { fontSize: type.meta, lineHeight: 17, color: color.accentRamp[300] },

  actions: { marginTop: space[4], gap: space[3] },
});
