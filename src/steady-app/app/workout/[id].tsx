import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { TrainingSessionSummary } from '../../src/api/queryApi';
import { goToLogin } from '../../src/auth/goToLogin';
import { workoutCard } from '../../src/home/workoutCard';
import { pendingSessions } from '../../src/home/latestWorkoutState';
import { queryApi, recordQueue } from '../../src/services';
import { color, space, textAlpha, type } from '../../src/theme/nocturne';
import { Card, Kicker, Muted } from '../../src/ui/Nocturne';

type ViewState =
  | { status: 'loaded'; session: TrainingSessionSummary }
  | { status: 'unavailable' }
  | { status: 'notFound' };

export default function WorkoutDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [state, setState] = useState<ViewState | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      if (id?.startsWith('pending:')) {
        try {
          const sessions = (await recordQueue.pending()).flatMap(pendingSessions);
          if (!active) return;
          const session = sessions.find((item) => item.id === id);
          // Pode ter sincronizado entre o toque e a abertura: volte à dashboard para atualizar.
          return setState(session ? { status: 'loaded', session } : { status: 'unavailable' });
        } catch {
          if (active) setState({ status: 'unavailable' });
          return;
        }
      }
      const result = await queryApi.trainingHistory();
      if (!active) return;
      if (result.status === 'unauthenticated') return goToLogin(router);
      if (result.status === 'failure') return setState({ status: 'unavailable' });
      const session = result.data.find((item) => item.id === id);
      setState(session ? { status: 'loaded', session } : { status: 'notFound' });
    }
    void load();
    return () => { active = false; };
  }, [id, router]);

  if (state === null) return <View style={styles.center}><ActivityIndicator color={color.accent} /></View>;
  if (state.status !== 'loaded') return (
    <View style={styles.screen}>
      <Muted>{state.status === 'notFound' ? 'Treino não encontrado.' : 'Não foi possível carregar o treino.'}</Muted>
    </View>
  );

  const card = workoutCard(state.session);
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Kicker accent>Treino registrado</Kicker>
      <Text style={styles.title}>{card.title}</Text>
      <Text style={styles.date}>{card.date}</Text>
      {state.session.pending && <Text style={styles.date}>Aguardando sincronização.</Text>}
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
  date: { color: textAlpha.faint, fontSize: type.bodySm, marginTop: space[2] },
  card: { marginTop: space[6] },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: space[3] },
  label: { color: textAlpha.label, fontSize: type.body },
  value: { color: color.text, fontSize: type.body, fontWeight: '600' },
});
