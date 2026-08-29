import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Field } from '../../src/ui/Field';
import { Choice } from '../../src/ui/Choice';
import { Muted, NoticeStrip, PrimaryButton } from '../../src/ui/Nocturne';
import { color, space, type } from '../../src/theme/nocturne';
import { useRecordLogger } from '../../src/features/useRecordLogger';
import { todayIso } from '../../src/features/date';
import {
  INTENSITIES,
  MUSCLE_GROUPS,
  type Intensity,
  type MuscleGroup,
} from '../../src/training/labels';
import { planDayFromParam } from '../../src/planning/planDayParam';
import { plannedMuscleGroup } from '../../src/planning/plannedMuscleGroup';
import { useWeekPlan } from '../../src/planning/useWeekPlan';

export default function LogStrengthScreen() {
  const { log, saving, problem } = useRecordLogger('strength');
  const weekPlan = useWeekPlan();
  const param = useLocalSearchParams<{ planDay?: string }>().planDay;
  /** Chegou pelo detalhamento do dia? Então a tela sabe qual treino era (STORY-012, regra 7). */
  const planDay = weekPlan === null ? null : planDayFromParam(param, weekPlan);

  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup | null>(null);
  const [intensity, setIntensity] = useState<Intensity | null>(null);
  const [durationMinutes, setDurationMinutes] = useState('');

  // O plano chega depois da montagem (leitura assíncrona da API/cache); o
  // efeito preenche o grupo sugerido só se o corredor ainda não escolheu nada.
  useEffect(() => {
    if (planDay !== null && muscleGroup === null) setMuscleGroup(plannedMuscleGroup(planDay));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planDay]);

  const complete = muscleGroup !== null && intensity !== null && durationMinutes !== '';

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      {planDay !== null && (
        <View style={s.planned}>
          <Text style={s.plannedKicker}>Hoje no seu plano</Text>
          <Text style={s.plannedFocus}>{planDay.focus}</Text>
        </View>
      )}

      <Muted>
        Treino de perna pesado é o que a avaliação cruza com o seu volume de corrida — por isso
        o grupo muscular importa.
      </Muted>

      <View style={s.form}>
        <Choice
          label="Grupo muscular"
          options={MUSCLE_GROUPS}
          value={muscleGroup}
          onChange={setMuscleGroup}
        />
        <Choice label="Intensidade" options={INTENSITIES} value={intensity} onChange={setIntensity} />
        <Field
          label="Duração (minutos)"
          value={durationMinutes}
          onChangeText={setDurationMinutes}
          keyboardType="numeric"
          placeholder="45"
        />
      </View>

      {problem && (
        <View style={s.problem}>
          <NoticeStrip>
            <Text style={s.problemText}>
              <Text style={s.problemStrong}>Não foi salvo. </Text>
              {problem}
            </Text>
          </NoticeStrip>
        </View>
      )}

      <PrimaryButton
        label={saving ? 'Registrando…' : 'Registrar musculação'}
        disabled={!complete || saving}
        onPress={() =>
          log({
            date: todayIso(),
            muscleGroup,
            intensity,
            durationMinutes: Number(durationMinutes),
          })
        }
      />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  planned: { marginBottom: space[6] },
  plannedKicker: {
    fontSize: type.kicker,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: color.accentRamp[400],
  },
  plannedFocus: { color: color.text, fontSize: type.cardTitle, marginTop: space[1] },
  content: { paddingHorizontal: space[8], paddingTop: space[6], paddingBottom: space[8] * 2 },
  form: { marginTop: space[8] },
  problem: { marginBottom: space[6] },
  problemText: { color: color.accentRamp[400], fontSize: type.meta, lineHeight: 19 },
  problemStrong: { color: color.text },
});
