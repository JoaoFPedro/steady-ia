import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Field } from '../../src/ui/Field';
import { Card, Kicker, Muted, NoticeStrip, PrimaryButton } from '../../src/ui/Nocturne';
import { color, space, type } from '../../src/theme/nocturne';
import { combinedWorkoutDrafts, trainingSheetCache } from '../../src/services';
import { useRecordLogger } from '../../src/features/useRecordLogger';
import { todayIso } from '../../src/features/date';
import { prepareStrengthExecution, type ExerciseInput } from '../../src/coaching/workoutExecution';
import { formatExercisePrescription } from '../../src/coaching/exercisePrescription';
import type { ExercisePrescription, WorkoutType } from '../../src/coaching/types';
import { goToLogin } from '../../src/auth/goToLogin';

type StrengthType = Exclude<WorkoutType, 'run'>;
const TYPES: StrengthType[] = ['push', 'pull', 'lower'];
const LABELS = { push: 'Empurrada', pull: 'Puxada', lower: 'Inferiores' } as const;

export default function DetailedStrengthScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string; planDay?: string; runPrescription?: string }>();
  const rawType = params.type;
  const workoutType: StrengthType = TYPES.includes(rawType as StrengthType) ? rawType as StrengthType : 'push';
  const { log, saving, problem } = useRecordLogger('strengthWorkout');
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [exercises, setExercises] = useState<ExercisePrescription[]>([]);
  const [inputs, setInputs] = useState<Record<string, { load: string; note: string }>>({});
  const [localProblem, setLocalProblem] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stale, setStale] = useState(false);

  useEffect(() => {
    let active = true;
    trainingSheetCache.load().then((result) => {
      if (!active) return;
      if (result.status === 'unauthenticated') return goToLogin(router);
      if (result.status === 'ok') {
        const workout = result.data.workouts.find((item) => item.type === workoutType);
        if (workout !== undefined) {
          setSheetId(result.data.id);
          setExercises(workout.exercises);
          setInputs(Object.fromEntries(workout.exercises.map((exercise) => [
            exercise.id,
            { load: exercise.suggestedLoadKg?.toFixed(2).replace('.', ',') ?? '', note: '' },
          ])));
        }
        setStale(result.stale);
      }
      setLoading(false);
    });
    return () => { active = false; };
  }, [router, workoutType]);

  function update(id: string, field: 'load' | 'note', value: string) {
    setInputs((current) => ({ ...current, [id]: { ...current[id], [field]: value } }));
  }

  function submit() {
    if (sheetId === null) return;
    const values: ExerciseInput[] = exercises.map((exercise) => ({
      exerciseId: exercise.id,
      name: exercise.name,
      load: inputs[exercise.id]?.load ?? '',
      note: inputs[exercise.id]?.note ?? '',
    }));
    const prepared = prepareStrengthExecution(sheetId, workoutType, todayIso(), values);
    if (prepared.status === 'invalid') {
      setLocalProblem(prepared.message);
      return;
    }
    setLocalProblem(null);
    if (prepared.status === 'ready') {
      savePrepared(prepared.payload);
      return;
    }

    Alert.alert(
      'Confirmar exercícios pulados',
      `${prepared.skippedExerciseNames.join(', ')} será entendido como não realizado neste treino. Deseja salvar mesmo assim?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar e salvar', onPress: () => savePrepared(prepared.payload) },
      ],
    );
  }

  function savePrepared(payload: Parameters<typeof combinedWorkoutDrafts.hold>[0]) {
    Alert.alert(
      'Sentiu dor neste treino?',
      'Escolha uma resposta para concluir o registro.',
      [
        { text: 'Não', onPress: () => saveWithPain(payload, false) },
        { text: 'Sim', onPress: () => saveWithPain(payload, true) },
      ],
      { cancelable: true },
    );
  }

  function saveWithPain(
    payload: Parameters<typeof combinedWorkoutDrafts.hold>[0],
    painReported: boolean,
  ) {
    const completedPayload = { ...payload, painReported };
    if (!params.runPrescription) {
      void log(completedPayload);
      return;
    }

    Alert.alert(
      'Registrar corrida?',
      'Este dia também tem uma corrida prescrita. Você deseja registrá-la agora?',
      [
        { text: 'Não', onPress: () => void log(completedPayload) },
        {
          text: 'Sim',
          onPress: () => {
            void combinedWorkoutDrafts.hold(completedPayload).then(() => {
              router.replace({
                pathname: '/log/run',
                params: {
                  combined: '1',
                  planDay: params.planDay ?? '',
                  prescription: params.runPrescription ?? '',
                },
              });
            }).catch(() => setLocalProblem('Não foi possível guardar a musculação antes da corrida.'));
          },
        },
      ],
    );
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <Kicker>{LABELS[workoutType]}</Kicker>
      <Text style={s.title}>{LABELS[workoutType]}</Text>
      <Muted>Informe a carga real em quilogramas. A observação é opcional e vale apenas para esta execução.</Muted>
      {stale && <View style={s.block}><NoticeStrip><Text style={s.notice}>Você está usando a ficha salva offline.</Text></NoticeStrip></View>}

      {loading ? <ActivityIndicator style={s.block} color={color.accent} /> : exercises.map((exercise) => (
        <Card key={exercise.id} style={s.exercise}>
          <Text style={s.exerciseName}>{exercise.name}</Text>
          <Text style={s.prescription}>
            {formatExercisePrescription(
              exercise.sets, exercise.repetitions, exercise.durationSeconds)}
          </Text>
          {exercise.observation !== null && (
            <Text style={s.coachNote}>Do personal: {exercise.observation}</Text>
          )}
          <Field
            label="Carga real (kg)"
            value={inputs[exercise.id]?.load ?? ''}
            onChangeText={(value) => update(exercise.id, 'load', value)}
            keyboardType="decimal-pad"
            placeholder="0,00"
          />
          <Field
            label="Sua observação (opcional)"
            value={inputs[exercise.id]?.note ?? ''}
            onChangeText={(value) => update(exercise.id, 'note', value)}
            multiline={3}
            placeholder="Algo saiu diferente neste exercício?"
          />
        </Card>
      ))}

      {(localProblem ?? problem) !== null && (
        <View style={s.block}><NoticeStrip><Text style={s.notice}>{localProblem ?? problem}</Text></NoticeStrip></View>
      )}
      {!loading && exercises.length > 0 && (
        <View style={s.block}>
          <PrimaryButton label={saving ? 'Salvando…' : 'Salvar treino'} disabled={saving} onPress={submit} />
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  content: { paddingHorizontal: space[8], paddingTop: space[6], paddingBottom: space[8] * 2 },
  title: { color: color.text, fontSize: type.title, marginTop: space[2], marginBottom: space[2] },
  block: { marginTop: space[6] },
  notice: { color: color.accentRamp[300], fontSize: type.meta, lineHeight: 19 },
  exercise: { marginTop: space[6] },
  exerciseName: { color: color.text, fontSize: type.cardTitle },
  prescription: { color: color.accentRamp[300], fontSize: type.body, marginTop: space[1], marginBottom: space[6] },
  /** Instrução do personal — distinta do campo em que o corredor escreve a dele. */
  coachNote: {
    color: color.text,
    fontSize: type.meta,
    lineHeight: 19,
    marginTop: -space[4],
    marginBottom: space[6],
    paddingLeft: space[3],
    borderLeftWidth: 1,
    borderLeftColor: color.accentRamp[700],
  },
});
