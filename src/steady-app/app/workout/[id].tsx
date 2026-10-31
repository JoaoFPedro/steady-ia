import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { goToLogin } from '../../src/auth/goToLogin';
import { workoutCard } from '../../src/home/workoutCard';
import { queryApi, recordQueue, trainingSheetCache } from '../../src/services';
import { color, space, textAlpha, type } from '../../src/theme/nocturne';
import { loadWorkoutDetail, type WorkoutDetailState } from '../../src/training/loadWorkoutDetail';
import { workoutDetailView, type ExerciseView } from '../../src/training/workoutDetailView';
import { BodyMap } from '../../src/ui/BodyMap';
import { Card, Kicker, Muted, Tag } from '../../src/ui/Nocturne';

const MESSAGES = {
  notFound: 'Treino não encontrado.',
  unavailable: 'Não foi possível carregar o treino.',
  synced: 'Este treino já foi sincronizado e não está mais pendente. Volte à dashboard para vê-lo atualizado.',
} as const;

export default function WorkoutDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [state, setState] = useState<WorkoutDetailState | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      const result = await loadWorkoutDetail(id ?? '', queryApi, recordQueue, trainingSheetCache);
      if (!active) return;
      if (result.status === 'sessionLost') return goToLogin(router);
      setState(result);
    }
    void load();
    return () => { active = false; };
  }, [id, router]);

  if (state === null) return <View style={styles.center}><ActivityIndicator color={color.accent} /></View>;
  if (state.status === 'sessionLost') return <View style={styles.center}><ActivityIndicator color={color.accent} /></View>;
  if (state.status !== 'loaded') return (
    <View style={styles.screen}><Muted>{MESSAGES[state.status]}</Muted></View>
  );

  const { session } = state;
  if (session.kind === 'running') return <RunningDetails session={session} />;

  const view = workoutDetailView(session);
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Kicker accent>Treino registrado</Kicker>
      <Text style={styles.title}>{view.title}</Text>
      {view.subtitle !== null && <Text style={styles.subtitle}>{view.subtitle}</Text>}
      <Text style={styles.date}>{view.date}</Text>
      {view.pending && <Text style={styles.date}>Aguardando sincronização.</Text>}

      <Card style={styles.card}>
        {view.metrics.map((metric) => (
          <View key={metric.label} style={styles.row}>
            <Text style={styles.label}>{metric.label}</Text>
            <Text style={styles.value}>{metric.value}</Text>
          </View>
        ))}
      </Card>

      <Card style={styles.card}>
        <Kicker>Músculos trabalhados</Kicker>
        <BodyMap regions={view.regions} />
        {view.mapNotice !== null
          ? <Muted>{view.mapNotice}</Muted>
          : <Text style={styles.regions}>{view.regionLabels.join(' · ')}</Text>}
      </Card>

      <View style={styles.section}>
        <Kicker>Exercícios</Kicker>
      </View>
      {view.exercises === null
        ? <Muted>{view.exercisesNotice}</Muted>
        : view.exercises.map((exercise, index) => <ExerciseCard key={`${exercise.name}-${index}`} exercise={exercise} />)}
    </ScrollView>
  );
}

function ExerciseCard({ exercise }: { exercise: ExerciseView }) {
  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        {exercise.skipped && <Tag>Pulado</Tag>}
      </View>
      {exercise.sets.map((set) => <Text key={set} style={styles.set}>{set}</Text>)}
      {exercise.note !== null && <Text style={styles.note}>{exercise.note}</Text>}
    </Card>
  );
}

function RunningDetails({ session }: { session: Parameters<typeof workoutCard>[0] }) {
  const card = workoutCard(session);
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Kicker accent>Treino registrado</Kicker>
      <Text style={styles.title}>{card.title}</Text>
      <Text style={styles.date}>{card.date}</Text>
      {session.pending && <Text style={styles.date}>Aguardando sincronização.</Text>}
      <Card style={styles.card}>
        {card.metrics.map((metric) => (
          <View key={metric.label} style={styles.row}>
            <Text style={styles.label}>{metric.label}</Text>
            <Text style={styles.value}>{metric.value}</Text>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg, paddingHorizontal: space[8] },
  content: { paddingVertical: space[8] },
  center: { flex: 1, backgroundColor: color.bg, justifyContent: 'center' },
  title: { color: color.text, fontSize: 24, fontWeight: '700', marginTop: space[2] },
  subtitle: { color: textAlpha.label, fontSize: type.body, marginTop: space[2] },
  date: { color: textAlpha.faint, fontSize: type.bodySm, marginTop: space[2] },
  card: { marginTop: space[6] },
  section: { marginTop: space[8] },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: space[3] },
  label: { color: textAlpha.label, fontSize: type.body },
  value: { color: color.text, fontSize: type.body, fontWeight: '600' },
  regions: { color: color.text, fontSize: type.body, textAlign: 'center', marginTop: space[4] },
  exerciseName: { color: color.text, fontSize: type.body, fontWeight: '600', flexShrink: 1 },
  set: { color: textAlpha.label, fontSize: type.body, paddingVertical: space[1] },
  note: { color: textAlpha.faint, fontSize: type.bodySm, marginTop: space[3] },
});
