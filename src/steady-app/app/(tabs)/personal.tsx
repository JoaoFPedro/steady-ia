import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Field } from '../../src/ui/Field';
import { Card, Kicker, Muted, NoticeStrip, PrimaryButton, SecondaryButton } from '../../src/ui/Nocturne';
import { color, space, type } from '../../src/theme/nocturne';
import { coachingApi } from '../../src/services';
import type { LinkedRunner, RunnerSearch } from '../../src/coaching/types';
import { goToLogin } from '../../src/auth/goToLogin';

export default function PersonalScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [found, setFound] = useState<RunnerSearch | null>(null);
  const [runners, setRunners] = useState<LinkedRunner[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    const result = await coachingApi.linkedRunners();
    if (result.status === 'unauthenticated') return goToLogin(router);
    setRunners(result.status === 'ok' ? result.data : []);
  }, [router]);
  useFocusEffect(useCallback(() => { void reload(); }, [reload]));

  async function search() {
    setBusy(true);
    setFound(null);
    const result = await coachingApi.searchRunner(email);
    setBusy(false);
    if (result.status === 'unauthenticated') return goToLogin(router);
    if (result.status === 'ok') {
      setFound(result.data);
      setMessage(result.data.available ? null : 'Este corredor já possui um vínculo ativo.');
      return;
    }
    setMessage(result.status === 'notFound'
      ? 'Corredor não encontrado.'
      : result.status === 'rejected' || result.status === 'conflict'
        ? result.message : 'Não foi possível realizar a busca.');
  }

  async function request() {
    if (found === null) return;
    setBusy(true);
    const result = await coachingApi.requestLink(found.corredorId);
    setBusy(false);
    if (result.status === 'unauthenticated') return goToLogin(router);
    setMessage(result.status === 'ok'
      ? 'Solicitação enviada. O corredor precisa aceitar antes de você acessar os treinos.'
      : result.status === 'conflict' || result.status === 'rejected'
        ? result.message : 'Não foi possível enviar a solicitação.');
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <Text style={s.title}>Área do personal</Text>
      <Muted>O histórico e a ficha só ficam disponíveis após o corredor confirmar o vínculo.</Muted>

      <Card style={s.block}>
        <Kicker>Novo vínculo</Kicker>
        <View style={s.form}>
          <Field label="E-mail do corredor" value={email} onChangeText={setEmail} placeholder="corredor@email.com" />
          <PrimaryButton label={busy ? 'Buscando…' : 'Buscar corredor'} disabled={busy || email.trim() === ''} onPress={() => void search()} />
        </View>
        {found !== null && (
          <View style={s.result}>
            <Text style={s.runnerEmail}>{found.email}</Text>
            <Muted>{found.available ? 'Disponível para solicitação.' : 'Indisponível para novo vínculo.'}</Muted>
            {found.available && <View style={s.button}><SecondaryButton label="Solicitar vínculo" disabled={busy} onPress={() => void request()} /></View>}
          </View>
        )}
      </Card>

      {message !== null && <View style={s.block}><NoticeStrip><Text style={s.notice}>{message}</Text></NoticeStrip></View>}

      <View style={s.block}>
        <Kicker>Corredores vinculados</Kicker>
        {runners.length === 0 ? (
          <Text style={s.empty}>Nenhum corredor vinculado.</Text>
        ) : runners.map((runner) => (
          <Card key={runner.corredorId} style={s.runner}>
            <Text style={s.runnerEmail}>{runner.email}</Text>
            <View style={s.button}>
              <PrimaryButton
                label="Abrir ficha e histórico"
                onPress={() => router.push({ pathname: '/personal/runner', params: runner })}
              />
            </View>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  content: { paddingHorizontal: space[8], paddingTop: space[8] * 2, paddingBottom: space[8] * 2 },
  title: { color: color.text, fontSize: type.title, marginBottom: space[2] },
  block: { marginTop: space[6] },
  form: { marginTop: space[6] },
  result: { marginTop: space[6] },
  button: { marginTop: space[4] },
  notice: { color: color.accentRamp[300], fontSize: type.meta, lineHeight: 19 },
  runner: { marginTop: space[4] },
  runnerEmail: { color: color.text, fontSize: type.body },
  empty: { color: color.text, opacity: 0.55, marginTop: space[4], fontSize: type.meta },
});
