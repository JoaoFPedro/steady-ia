import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Card, Kicker, Muted, NoticeStrip, PrimaryButton, SecondaryButton } from '../../src/ui/Nocturne';
import { color, space, textAlpha, type } from '../../src/theme/nocturne';
import { coachingApi, trainingSheetCache } from '../../src/services';
import type { CoachingLink, TrainingSheet, WorkoutPrescription } from '../../src/coaching/types';
import { goToLogin } from '../../src/auth/goToLogin';

const LABELS = { push: 'Empurrada', pull: 'Puxada', lower: 'Inferiores', run: 'Corrida' } as const;

export default function WorkoutsScreen() {
  const router = useRouter();
  const [sheet, setSheet] = useState<TrainingSheet | null>(null);
  const [stale, setStale] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<CoachingLink[]>([]);
  const [activeLink, setActiveLink] = useState<CoachingLink | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    const [loadedSheet, pendingLinks, currentLink] = await Promise.all([
      trainingSheetCache.load(), coachingApi.pendingLinks(), coachingApi.activeLink(),
    ]);
    if (loadedSheet.status === 'unauthenticated' || pendingLinks.status === 'unauthenticated') {
      goToLogin(router);
      return;
    }
    if (loadedSheet.status === 'ok') {
      setSheet(loadedSheet.data);
      setStale(loadedSheet.stale);
    } else {
      setSheet(null);
    }
    setPending(pendingLinks.status === 'ok' ? pendingLinks.data : []);
    setActiveLink(currentLink.status === 'ok' ? currentLink.data : null);
    setLoading(false);
  }, [router]);

  useFocusEffect(useCallback(() => { void reload(); }, [reload]));

  async function accept(link: CoachingLink) {
    const result = await coachingApi.acceptLink(link.id);
    if (result.status === 'unauthenticated') return goToLogin(router);
    if (result.status !== 'ok') {
      setMessage(result.status === 'conflict' || result.status === 'rejected'
        ? result.message : 'Não foi possível aceitar o vínculo.');
      return;
    }
    setMessage('Vínculo aceito. Sua ficha ficará disponível assim que o personal publicar.');
    await reload();
  }

  async function endLink() {
    if (activeLink === null) return;
    const result = await coachingApi.endLink(activeLink.id);
    if (result.status === 'unauthenticated') return goToLogin(router);
    setMessage(result.status === 'ok' ? 'Vínculo encerrado.' : 'Não foi possível encerrar o vínculo.');
    await reload();
  }

  function openWorkout(workout: WorkoutPrescription) {
    if (workout.type === 'run') {
      router.push({ pathname: '/log/run', params: { prescription: workout.description ?? '' } });
      return;
    }
    router.push({ pathname: '/coaching/strength', params: { type: workout.type } });
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <Text style={s.title}>Meus treinos</Text>
      <Muted>Escolha a ficha que deseja executar hoje. A sugestão de dia não limita sua escolha.</Muted>

      {message !== null && <View style={s.block}><NoticeStrip><Text style={s.notice}>{message}</Text></NoticeStrip></View>}

      {pending.length > 0 && (
        <Card style={s.block}>
          <Kicker>Solicitações de vínculo</Kicker>
          {pending.map((link) => (
            <View key={link.id} style={s.item}>
              <Text style={s.itemTitle}>Personal solicitou acesso</Text>
              <Muted>Aceite somente se reconhecer o profissional.</Muted>
              <View style={s.button}><PrimaryButton label="Aceitar vínculo" onPress={() => void accept(link)} /></View>
            </View>
          ))}
        </Card>
      )}

      {stale && <View style={s.block}><NoticeStrip><Text style={s.notice}>Sem conexão. Exibindo a última ficha salva neste aparelho.</Text></NoticeStrip></View>}

      {loading ? (
        <ActivityIndicator style={s.block} color={color.accent} />
      ) : sheet === null ? (
        <Card style={s.block}>
          <Kicker>Ficha ativa</Kicker>
          <Text style={s.itemTitle}>Nenhuma ficha disponível</Text>
          <Muted>Quando seu personal publicar a ficha, os quatro treinos aparecerão aqui.</Muted>
        </Card>
      ) : (
        <View style={s.block}>
          {sheet.workouts.map((workout) => (
            <Card key={workout.type} style={s.workout}>
              <Kicker>{LABELS[workout.type]}</Kicker>
              <Text style={s.itemTitle}>{LABELS[workout.type]}</Text>
              <Muted>{workout.type === 'run'
                ? workout.description
                : `${workout.exercises.length} exercício${workout.exercises.length === 1 ? '' : 's'}`}</Muted>
              <View style={s.button}><PrimaryButton label="Abrir treino" onPress={() => openWorkout(workout)} /></View>
            </Card>
          ))}
        </View>
      )}

      {activeLink !== null && (
        <View style={s.block}>
          <SecondaryButton label="Encerrar vínculo com o personal" onPress={() => void endLink()} />
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  content: { paddingHorizontal: space[8], paddingTop: space[8] * 2, paddingBottom: space[8] * 2 },
  title: { color: color.text, fontSize: type.title, marginBottom: space[2] },
  block: { marginTop: space[6] },
  notice: { color: color.accentRamp[300], fontSize: type.meta, lineHeight: 19 },
  item: { borderTopWidth: 1, borderTopColor: textAlpha.rule, marginTop: space[4], paddingTop: space[4] },
  itemTitle: { color: color.text, fontSize: type.cardTitle, marginTop: space[2], marginBottom: space[2] },
  button: { marginTop: space[4] },
  workout: { marginBottom: space[4] },
});
