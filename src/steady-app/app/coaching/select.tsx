import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Card, Kicker, Muted, NoticeStrip, PrimaryButton, SecondaryButton } from '../../src/ui/Nocturne';
import { color, space, type } from '../../src/theme/nocturne';
import { trainingSheetCache } from '../../src/services';
import { dailyPrescription } from '../../src/coaching/dailyPrescription';
import type { TrainingSheet, WorkoutType } from '../../src/coaching/types';
import { goToLogin } from '../../src/auth/goToLogin';

const STRENGTH = [
  { type: 'push', label: 'Empurrada' },
  { type: 'pull', label: 'Puxada' },
  { type: 'lower', label: 'Inferiores' },
] as const;

export default function SelectWorkoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ planDay?: string }>();
  const dayIndex = Number(params.planDay);
  const validDayIndex = Number.isInteger(dayIndex) && dayIndex >= 0 && dayIndex <= 6 ? dayIndex : 0;
  const [sheet, setSheet] = useState<TrainingSheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    trainingSheetCache.load().then((result) => {
      if (!active) return;
      if (result.status === 'unauthenticated') return goToLogin(router);
      if (result.status === 'ok') setSheet(result.data);
      else setProblem('Não foi possível carregar a ficha do personal.');
      setLoading(false);
    });
    return () => { active = false; };
  }, [router]);

  const dailyRun = dailyPrescription(sheet, validDayIndex).run?.description ?? null;
  const run = sheet?.workouts.find((workout) => workout.type === 'run');

  function selectStrength(workoutType: Exclude<WorkoutType, 'run'>) {
    router.replace({
      pathname: '/coaching/strength',
      params: { type: workoutType, planDay: validDayIndex, runPrescription: dailyRun ?? '' },
    });
  }

  function selectRun(prescription: string) {
    router.replace({ pathname: '/log/run', params: { planDay: validDayIndex, prescription } });
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <Kicker>Ficha do personal</Kicker>
      <Text style={s.title}>Qual treino você fez?</Text>
      <Muted>Escolha o treino realizado. O registro usará os exercícios prescritos na sua ficha.</Muted>
      {loading && <ActivityIndicator style={s.block} color={color.accent} />}
      {problem && <View style={s.block}><NoticeStrip><Text style={s.notice}>{problem}</Text></NoticeStrip></View>}
      {!loading && sheet && (
        <Card style={s.block}>
          {STRENGTH.map((workout, index) => (
            <View key={workout.type} style={index > 0 ? s.button : undefined}>
              <PrimaryButton label={workout.label} onPress={() => selectStrength(workout.type)} />
            </View>
          ))}
          {dailyRun ? (
            <View style={s.button}><SecondaryButton label="Corrida" onPress={() => selectRun(dailyRun)} /></View>
          ) : run?.runDescriptions ? (
            <View style={s.runs}>
              <Text style={s.runTitle}>Corrida</Text>
              <SecondaryButton label="Terça-feira" onPress={() => selectRun(run.runDescriptions!.tuesday.description)} />
              <View style={s.button}><SecondaryButton label="Quinta-feira" onPress={() => selectRun(run.runDescriptions!.thursday.description)} /></View>
              <View style={s.button}><SecondaryButton label="Sábado" onPress={() => selectRun(run.runDescriptions!.saturday.description)} /></View>
            </View>
          ) : null}
        </Card>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  content: { paddingHorizontal: space[8], paddingTop: space[6], paddingBottom: space[8] * 2 },
  title: { color: color.text, fontSize: type.title, marginTop: space[2], marginBottom: space[2] },
  block: { marginTop: space[6] },
  button: { marginTop: space[3] },
  runs: { marginTop: space[6] },
  runTitle: { color: color.text, fontSize: type.cardTitle, marginBottom: space[3] },
  notice: { color: color.accentRamp[300], fontSize: type.meta },
});
