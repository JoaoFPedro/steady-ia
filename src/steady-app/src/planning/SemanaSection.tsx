import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NoticeStrip, PrimaryButton, Rule } from '../ui/Nocturne';
import { color, radius, space, textAlpha, type } from '../theme/nocturne';
import type { TrainingPlanDocument, WeekPlanDay } from './trainingPlanDocument';
import type { DayStatus } from './dayCompletion';
import { canRegisterDay } from './registerAvailability';
import { ExerciseList } from './ExerciseList';
import { shared } from './planningStyles';
import type { TrainingSheet, WorkoutType } from '../coaching/types';
import { dailyPrescription } from '../coaching/dailyPrescription';
import { runPrescriptionSummary } from '../coaching/runPrescriptionSummary';

/**
 * A aba Semana — a estrutura semanal e o detalhamento de cada dia
 * (STORY-006), agora dizendo o que já foi cumprido e oferecendo o registro
 * do treino de hoje (STORY-012).
 *
 * Saiu de `PlanningDocument.tsx` porque o arquivo já passava de 300 linhas
 * (FF-003) antes desta story e é aqui que ela cresce.
 */
const LABELS: Record<WorkoutType, string> = {
  push: 'Empurrada',
  pull: 'Puxada',
  lower: 'Inferiores',
  run: 'Corrida',
};

const MARCA: Record<Exclude<DayStatus, 'semMarca'>, { texto: string; estilo: object }> = {
  cumprido: { texto: 'Feito', estilo: { color: color.accent } },
  parcial: { texto: 'Parcial', estilo: { color: color.accentRamp[400] } },
  naoFeito: { texto: 'Não feito', estilo: { color: textAlpha.ghost } },
};

export function SemanaSection({
  document,
  statuses,
  todayIndex,
  todayStatus,
  initialOpenDay,
  sheet,
  sheetStale,
  sheetLoading,
  onRegister,
  onDayLayout,
}: {
  document: TrainingPlanDocument;
  /** Alinhado a `weekPlan`: índice 0 é segunda, 6 é domingo. */
  statuses: readonly DayStatus[];
  /** Índice de hoje em `weekPlan`, ou `-1` quando a semana não é a de hoje. */
  todayIndex: number;
  /**
   * Estado de hoje para o botão de registro. Vem separado de `statuses` porque
   * aquele passa pela janela do plano e este não (`todayRegistrationStatus`).
   */
  todayStatus: DayStatus;
  /** `day.day` que já chega expandido — o caminho vindo do card da Dashboard. */
  initialOpenDay: string | null;
  sheet: TrainingSheet | null;
  sheetStale: boolean;
  sheetLoading: boolean;
  onRegister: (planDayIndex: number) => void;
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
      {sheetStale && (
        <NoticeStrip>
          <Text style={s.notice}>Sem conexão. Exibindo a última ficha salva neste aparelho.</Text>
        </NoticeStrip>
      )}
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
            todayStatus={todayStatus}
            sheet={sheet}
            sheetLoading={sheetLoading}
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
  todayStatus,
  sheet,
  sheetLoading,
  open,
  onToggle,
  onRegister,
  onLayout,
}: {
  day: WeekPlanDay;
  index: number;
  status: DayStatus;
  isToday: boolean;
  todayStatus: DayStatus;
  sheet: TrainingSheet | null;
  sheetLoading: boolean;
  open: boolean;
  onToggle: () => void;
  onRegister: (planDayIndex: number) => void;
  onLayout?: (y: number) => void;
}) {
  const prescription = dailyPrescription(sheet, index);
  const runSummary = prescription.run === null ? null : runPrescriptionSummary(prescription.run);
  const marca = status === 'semMarca' ? null : MARCA[status];
  const weekday = day.day.split(' — ')[0];
  const labels = [
    prescription.strength === null ? null : LABELS[prescription.strength.type],
    prescription.run === null ? null : 'Corrida',
  ].filter(Boolean).join(' + ');

  return (
    <Pressable
      onPress={onToggle}
      style={[s.dayRow, isToday && s.dayRowToday]}
      onLayout={onLayout ? (evento) => onLayout(evento.nativeEvent.layout.y) : undefined}
    >
      <View style={s.dayRowHead}>
        <Text style={s.dayFocus} numberOfLines={open ? undefined : 1}>
          {labels === '' ? weekday : `${weekday} — ${labels}`}
        </Text>
        {marca !== null && <Text style={[s.dayMark, marca.estilo]}>{marca.texto}</Text>}
        {prescription.run !== null && (
          <View style={s.dayRunBadge}>
            <Text style={s.dayRunBadgeText}>Corrida</Text>
          </View>
        )}
      </View>

      {open && (
        <View style={s.dayDetail}>
          {sheetLoading ? (
            <Text style={s.dayNote}>Carregando ficha…</Text>
          ) : sheet === null && index !== 6 ? (
            <Text style={s.dayNote}>Seu personal ainda não publicou este treino.</Text>
          ) : index === 6 ? (
            <Text style={s.dayNote}>Descanso.</Text>
          ) : null}
          {prescription.run !== null && (
            <View style={s.runNoteBox}>
              <Text style={s.runNoteText}>{prescription.run.description}</Text>
              {runSummary !== null && <Text style={s.runNoteSummary}>{runSummary}</Text>}
            </View>
          )}
          {prescription.strength !== null && (
            <ExerciseList items={prescription.strength.exercises.map((exercise) => ({
              name: exercise.name,
              series: exercise.durationSeconds === null
                ? `${exercise.sets}x${exercise.repetitions} repetições`
                : `${exercise.sets}x${exercise.repetitions} repetições · ${exercise.durationSeconds}s`,
            }))} />
          )}

          {/* Só hoje: o registro grava sempre com a data de hoje (`todayIso`),
              então um botão em outro dia gravaria a data errada (regra 6). */}
          {isToday && (prescription.strength !== null || prescription.run !== null) && (
            <View style={s.actions}>
              <PrimaryButton
                label={canRegisterDay(todayStatus) ? 'Registrar Treino' : 'Treino registrado'}
                disabled={!canRegisterDay(todayStatus)}
                onPress={() => onRegister(index)}
              />
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  notice: { color: color.accentRamp[300], fontSize: type.meta, lineHeight: 19 },
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
  runNoteSummary: { fontSize: type.meta, lineHeight: 17, color: textAlpha.muted, marginTop: space[1] },

  actions: { marginTop: space[4], gap: space[3] },
});
