import { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Field } from '../../src/ui/Field';
import { Muted, NoticeStrip, PrimaryButton } from '../../src/ui/Nocturne';
import { color, space, type } from '../../src/theme/nocturne';
import { useRecordLogger } from '../../src/features/useRecordLogger';
import { todayIso } from '../../src/features/date';
import { planDayFromParam } from '../../src/planning/planDayParam';
import { useWeekPlan } from '../../src/planning/useWeekPlan';
import { combinedWorkoutDrafts, syncEngine } from '../../src/services';
import { outcomeOf } from '../../src/features/logRecord';
import { goToLogin } from '../../src/auth/goToLogin';

export default function LogRunScreen() {
  const router = useRouter();
  const { log, saving, problem } = useRecordLogger('running');
  /** Só contexto: distância, ritmo e esforço são medidas do que aconteceu (regra 9). */
  const params = useLocalSearchParams<{ planDay?: string; prescription?: string; combined?: string }>();
  const weekPlan = useWeekPlan();
  const planDay = weekPlan === null ? null : planDayFromParam(params.planDay, weekPlan);
  const combined = params.combined === '1';
  const completed = useRef(false);

  const [distanceKm, setDistanceKm] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [averagePace, setAveragePace] = useState('');
  const [perceivedEffort, setPerceivedEffort] = useState('');
  const [combinedSaving, setCombinedSaving] = useState(false);
  const [combinedProblem, setCombinedProblem] = useState<string | null>(null);

  useEffect(() => () => {
    if (!combined || completed.current) return;
    void combinedWorkoutDrafts.finishStrengthOnly().then(() => syncEngine.sync()).catch(() => {});
  }, [combined]);

  const complete =
    distanceKm !== '' && durationMinutes !== '' && averagePace !== '' && perceivedEffort !== '';

  const payload = (painReported: boolean) => ({
    date: todayIso(),
    distanceKm: Number(distanceKm.replace(',', '.')),
    durationMinutes: Number(durationMinutes),
    averagePaceMinPerKm: Number(averagePace.replace(',', '.')),
    perceivedEffort: Number(perceivedEffort),
    painReported,
  });

  function submit() {
    Alert.alert(
      'Sentiu dor neste treino?',
      'Escolha uma resposta para concluir o registro.',
      [
        { text: 'Não', onPress: () => void save(false) },
        { text: 'Sim', onPress: () => void save(true) },
      ],
      { cancelable: true },
    );
  }

  async function save(painReported: boolean) {
    if (!combined) return log(payload(painReported));

    setCombinedSaving(true);
    setCombinedProblem(null);
    try {
      await combinedWorkoutDrafts.completeWithRun(payload(painReported));
      completed.current = true;
      const outcome = outcomeOf(await syncEngine.sync(), 'combinedWorkout');
      if (outcome.status === 'rejected') {
        setCombinedProblem(outcome.message);
        return;
      }
      if (outcome.status === 'sessionLost') {
        goToLogin(router);
        return;
      }
      router.back();
    } catch {
      setCombinedProblem('Não foi possível guardar os dois treinos. Tente novamente.');
    } finally {
      setCombinedSaving(false);
    }
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      {planDay?.hasRun && (
        <View style={s.planned}>
          <Text style={s.plannedKicker}>Hoje no seu plano</Text>
          <Text style={s.plannedFocus}>Corrida {planDay.runLabel?.toLowerCase()}</Text>
          {planDay.runNote && <Text style={s.plannedNote}>{planDay.runNote}</Text>}
        </View>
      )}

      {params.prescription && (
        <View style={s.planned}>
          <Text style={s.plannedKicker}>Ficha do personal</Text>
          <Text style={s.plannedNote}>{params.prescription}</Text>
        </View>
      )}

      <Muted>
        A validação de verdade é do domínio, no servidor — se algo estiver fora do aceitável,
        a mensagem vem de lá.
      </Muted>

      <View style={s.form}>
        <Field
          label="Distância (km)"
          value={distanceKm}
          onChangeText={setDistanceKm}
          keyboardType="decimal-pad"
          placeholder="8"
        />
        <Field
          label="Duração (minutos)"
          value={durationMinutes}
          onChangeText={setDurationMinutes}
          keyboardType="numeric"
          placeholder="45"
        />
        <Field
          label="Ritmo médio (min/km)"
          value={averagePace}
          onChangeText={setAveragePace}
          keyboardType="decimal-pad"
          placeholder="5.6"
        />
        <Field
          label="Esforço percebido (1 a 10)"
          value={perceivedEffort}
          onChangeText={setPerceivedEffort}
          keyboardType="numeric"
          placeholder="5"
        />
      </View>

      {(problem ?? combinedProblem) && (
        <View style={s.problem}>
          <NoticeStrip>
            <Text style={s.problemText}>
              <Text style={s.problemStrong}>Não foi salvo. </Text>
              {problem ?? combinedProblem}
            </Text>
          </NoticeStrip>
        </View>
      )}

      <PrimaryButton
        label={(saving || combinedSaving) ? 'Registrando…' : 'Registrar corrida'}
        disabled={!complete || saving || combinedSaving}
        onPress={submit}
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
  plannedNote: { color: color.accentRamp[300], fontSize: type.meta, lineHeight: 18, marginTop: space[2] },
  content: { paddingHorizontal: space[8], paddingTop: space[6], paddingBottom: space[8] * 2 },
  form: { marginTop: space[8] },
  problem: { marginBottom: space[6] },
  problemText: { color: color.accentRamp[400], fontSize: type.meta, lineHeight: 19 },
  problemStrong: { color: color.text },
});
