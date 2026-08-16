import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Card,
  HeroCard,
  Kicker,
  Muted,
  NoticeStrip,
  PrimaryButton,
  SecondaryButton,
} from '../src/ui/Nocturne';
import { color, space, type } from '../src/theme/nocturne';
import { queryApi, recordQueue } from '../src/services';
import { goToLogin } from '../src/auth/goToLogin';
import { loadHomeState, type HomeState } from '../src/home/homeState';

/**
 * Home — a tela que carrega a única linha que o app nunca esconde.
 *
 * No design original é "will I finish?"; aqui é "estou me sobrecarregando?".
 * A avaliação vem inteira da API (ADR-001): o app exibe, nunca calcula (FF-004).
 */
export default function HomeScreen() {
  const router = useRouter();
  const [state, setState] = useState<HomeState | null>(null);

  // Recarrega a cada foco: voltar de um registro precisa refletir o treino que
  // acabou de ser sincronizado, sem o corredor precisar fazer nada.
  useFocusEffect(
    useCallback(() => {
      let active = true;

      loadHomeState(recordQueue, queryApi).then((loaded) => {
        if (!active) return;
        if (loaded.sessionLost) return goToLogin(router);
        setState(loaded);
      });

      return () => {
        active = false;
      };
    }, [router]),
  );

  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.header}>
        <Text style={s.date}>{today}</Text>
      </View>

      <OverloadHero state={state} />

      {state !== null && state.pendingCount > 0 && (
        <NoticeStrip>
          <Text style={s.noticeText}>
            <Text style={s.noticeStrong}>Sincronização pendente. </Text>
            {state.pendingCount === 1
              ? '1 registro ainda não foi enviado. A avaliação acima ainda não considera ele.'
              : `${state.pendingCount} registros ainda não foram enviados. A avaliação acima ainda não considera eles.`}
          </Text>
        </NoticeStrip>
      )}

      <Card style={s.spaced}>
        <Kicker>Registrar</Kicker>
        <View style={s.actions}>
          <PrimaryButton label="Corrida" onPress={() => router.push('/log/run')} />
          <SecondaryButton label="Musculação" onPress={() => router.push('/log/strength')} />
          <SecondaryButton label="Dor" onPress={() => router.push('/log/pain')} />
        </View>
      </Card>

      <View style={[s.spaced, s.footer]}>
        <SecondaryButton label="Ver histórico" onPress={() => router.push('/history')} />
        <SecondaryButton label="Conta" onPress={() => router.push('/account')} />
      </View>
    </ScrollView>
  );
}

/**
 * A linha de prontidão, nos quatro estados possíveis.
 *
 * "Reunindo dados" e "sem risco" são deliberadamente diferentes: antes de 14
 * dias a regra do ADR-001 sequer é avaliada, e dizer "sem risco" ali seria uma
 * garantia que o domínio não deu (ADR-004).
 */
function OverloadHero({ state }: { state: HomeState | null }) {
  if (state === null) {
    return (
      <HeroCard>
        <Kicker accent>Sobrecarga</Kicker>
        <View style={s.loading}>
          <ActivityIndicator color={color.accent} />
        </View>
      </HeroCard>
    );
  }

  if (state.overload.status === 'risk') {
    return (
      <HeroCard>
        <Kicker accent>Sobrecarga</Kicker>
        <Text style={s.heroTitle}>Atenção à carga</Text>
        <Muted>{state.overload.suggestion}</Muted>
      </HeroCard>
    );
  }

  if (state.overload.status === 'noRisk') {
    return (
      <HeroCard>
        <Kicker accent>Sobrecarga</Kicker>
        <Text style={s.heroTitle}>Carga equilibrada</Text>
        <Muted>
          A combinação das suas últimas semanas de corrida e musculação não indica risco de
          sobrecarga. Siga o plano.
        </Muted>
      </HeroCard>
    );
  }

  if (state.overload.status === 'gatheringData') {
    return (
      <HeroCard>
        <Kicker accent>Sobrecarga</Kicker>
        <Text style={s.heroTitle}>Reunindo dados</Text>
        <Muted>
          Ainda não há histórico suficiente para avaliar sua carga. Continue registrando seus
          treinos — é o histórico que dá base à recomendação.
        </Muted>
      </HeroCard>
    );
  }

  return (
    <HeroCard>
      <Kicker accent>Sobrecarga</Kicker>
      <Text style={s.heroTitle}>Sem conexão</Text>
      <Muted>
        Não foi possível consultar sua avaliação agora. Seus registros continuam sendo salvos —
        tente de novo quando a conexão voltar.
      </Muted>
    </HeroCard>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  content: { paddingHorizontal: space[8], paddingBottom: space[8] * 2 },
  header: { paddingVertical: space[6] },
  date: { color: color.text, fontSize: type.cardTitle, textTransform: 'capitalize' },
  heroTitle: {
    color: color.text,
    fontSize: type.display,
    lineHeight: type.display * 1.1,
    marginTop: space[3],
    marginBottom: space[2],
  },
  loading: { paddingVertical: space[8], alignItems: 'flex-start' },
  noticeText: { color: color.accentRamp[400], fontSize: type.meta, lineHeight: 19 },
  noticeStrong: { color: color.text },
  spaced: { marginTop: space[6] },
  footer: { gap: space[3] },
  actions: { gap: space[3], marginTop: space[4] },
});
