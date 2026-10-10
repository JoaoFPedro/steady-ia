import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Card, Kicker, Muted } from '../src/ui/Nocturne';
import { color, space, textAlpha, type } from '../src/theme/nocturne';
import { coachingApi, queryApi } from '../src/services';
import { loadTrainingHistory, type HistoryView } from '../src/training/trainingHistory';
import type { WorkoutReview } from '../src/coaching/types';
import { workoutReviewView } from '../src/coaching/workoutReviewView';

/**
 * Histórico de treinos — onde o corredor confere que o registro feito na rua
 * realmente chegou, e o que dá lastro à avaliação de sobrecarga.
 */
export default function HistoryScreen() {
  const router = useRouter();
  // `sessionLost` nunca chega ao estado: leva ao login em vez de virar tela.
  const [view, setView] = useState<Exclude<HistoryView, { status: 'sessionLost' }> | null>(null);
  const [reviews, setReviews] = useState<Record<string, WorkoutReview>>({});

  useFocusEffect(
    useCallback(() => {
      let active = true;

      loadTrainingHistory(queryApi).then((loaded) => {
        if (!active) return;
        if (loaded.status === 'sessionLost') return router.replace('/login');
        setView(loaded);
        if (loaded.status === 'loaded') {
          void Promise.all(loaded.items.map(async (item) => {
            const result = await coachingApi.workoutReviewByExecution(item.id);
            return result.status === 'ok' ? [item.id, result.data] as const : null;
          })).then((entries) => {
            if (!active) return;
            const found: Record<string, WorkoutReview> = {};
            for (const entry of entries) if (entry !== null) found[entry[0]] = entry[1];
            setReviews(found);
          });
        }
      });

      return () => {
        active = false;
      };
    }, [router]),
  );

  if (view === null) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={color.accent} />
      </View>
    );
  }

  if (view.status === 'empty') {
    return (
      <Message title="Nada registrado ainda">
        Seus treinos aparecem aqui assim que você registrar o primeiro. São eles que dão base à
        avaliação de sobrecarga.
      </Message>
    );
  }

  // Deliberadamente diferente de "nada registrado": dizer que o histórico está
  // vazio para quem registrou o faria duvidar dos próprios registros.
  if (view.status === 'unavailable') {
    return (
      <Message title="Não foi possível carregar">
        Seu histórico está no servidor e a consulta não chegou lá agora. Tente de novo quando a
        conexão voltar — nenhum registro foi perdido.
      </Message>
    );
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      {view.items.map((item) => (
        <Card key={item.id} style={s.item}>
          <Kicker accent>{item.kicker}</Kicker>
          <Text style={s.itemTitle}>{item.title}</Text>
          <Text style={s.itemDate}>{item.date}</Text>
          {reviews[item.id] !== undefined && <HistoryReview review={reviews[item.id]} />}
        </Card>
      ))}
    </ScrollView>
  );
}

function HistoryReview({ review }: { review: WorkoutReview }) {
  const view = workoutReviewView(review);
  return (
    <View style={s.review}>
      <Text style={s.reviewTitle}>{view.title}</Text>
      {view.action !== null && <Text style={s.reviewAction}>{view.action}</Text>}
      {view.explanation !== null && <Muted>{view.explanation}</Muted>}
      {view.explanationUnavailable && <Muted>Explicação indisponível; comparação e recomendação preservadas.</Muted>}
      <Text style={s.itemDate}>{review.understoodAt === null ? 'Leitura ainda não confirmada' : 'Leitura confirmada'}</Text>
      <Text style={s.itemDate}>{view.coherence}</Text>
    </View>
  );
}

function Message({ title, children }: { title: string; children: string }) {
  return (
    <View style={s.message}>
      <Kicker>Histórico</Kicker>
      <Text style={s.messageTitle}>{title}</Text>
      <Muted>{children}</Muted>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  content: { paddingHorizontal: space[8], paddingTop: space[6], paddingBottom: space[8] * 2 },
  center: { flex: 1, backgroundColor: color.bg, alignItems: 'center', justifyContent: 'center' },
  message: {
    flex: 1,
    backgroundColor: color.bg,
    paddingHorizontal: space[8],
    paddingTop: space[8] * 2,
  },
  messageTitle: {
    color: color.text,
    fontSize: type.title,
    marginTop: space[3],
    marginBottom: space[3],
  },
  item: { marginBottom: space[4] },
  itemTitle: { color: color.text, fontSize: type.cardTitle, marginTop: space[2] },
  itemDate: { color: textAlpha.faint, fontSize: type.label, marginTop: space[1] },
  review: { borderTopWidth: 1, borderTopColor: textAlpha.rule, marginTop: space[4], paddingTop: space[4] },
  reviewTitle: { color: color.text, fontSize: type.body },
  reviewAction: { color: color.accentRamp[300], fontSize: type.meta, marginTop: space[2] },
});
