import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, View, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Card,
  HeroCard,
  Kicker,
  Muted,
  NoticeStrip,
  PrimaryButton,
  SecondaryButton,
  Tag,
} from '../../src/ui/Nocturne';
import { color, space, textAlpha, type } from '../../src/theme/nocturne';
import { coachingApi, queryApi, recordQueue, steadyTrainingPlanCache, workoutReviewCache } from '../../src/services';
import { goToLogin } from '../../src/auth/goToLogin';
import { useAccountMenu } from '../../src/account/useAccountMenu';
import { AccountMenuButton, AccountMenuDrawer } from '../../src/account/AccountMenuDrawer';
import { loadHomeState, type HomeState } from '../../src/home/homeState';
import { todaysTraining } from '../../src/planning/todaysTraining';
import type { WeekPlanDay } from '../../src/planning/trainingPlanDocument';
import { loadPlanList } from '../../src/planning/planListState';
import { loadLoggedSessions } from '../../src/planning/loggedSessions';
import { planProgress } from '../../src/planning/planProgress';
import { weekPlanIndexFor } from '../../src/planning/weekPlanDay';
import { homeHeader } from '../../src/home/homeHeader';
import { planProgressView } from '../../src/home/planProgressView';
import type { LoggedSession } from '../../src/planning/dayCompletion';
import type { PlanRequestSummary } from '../../src/planning/planRequest';
import type { WorkoutReview } from '../../src/coaching/types';
import { workoutReviewView } from '../../src/coaching/workoutReviewView';

/**
 * Home — a tela que carrega a única linha que o app nunca esconde.
 *
 * No design original é "will I finish?"; aqui é "estou me sobrecarregando?".
 * A avaliação vem inteira da API (ADR-001): o app exibe, nunca calcula (FF-004).
 */
export default function HomeScreen() {
  const router = useRouter();
  const [state, setState] = useState<HomeState | null>(null);
  /**
   * Os planejamentos do corredor, do mais recente para o mais antigo — a ordem
   * que `loadPlanList` garante (STORY-010). O mais recente é o plano em vigor:
   * decide para onde "Ver plano da semana" leva (STORY-008) e alimenta a
   * semana, a fase e a contagem do cabeçalho (STORY-011).
   */
  const [plans, setPlans] = useState<readonly PlanRequestSummary[]>([]);
  /**
   * Tudo que já foi registrado — o servidor mais a fila local. `null` é "não
   * consegui ler", que nunca pode virar 0% de avanço (STORY-012, regra 25).
   */
  const [sessions, setSessions] = useState<readonly LoggedSession[] | null>(null);
  /**
   * O plano do Steady, lido da API com cache offline (ADR-013, STORY-016).
   * `null` cobre tanto "ainda carregando" quanto "falhou sem cache" — a
   * distinção mora em `weekPlanFailed`; nenhum dos dois inventa um dia de
   * treino a partir da constante antiga.
   */
  const [weekPlan, setWeekPlan] = useState<readonly WeekPlanDay[] | null>(null);
  const [weekPlanFailed, setWeekPlanFailed] = useState(false);
  const [latestReview, setLatestReview] = useState<WorkoutReview | null>(null);
  const menu = useAccountMenu();
  // Sem a barra do Stack, o topo da tela é a barra de status: o recuo é nosso.
  const insets = useSafeAreaInsets();

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

      // Leitura separada e tolerante: falhar aqui não pode derrubar a home. Sem
      // planejamento conhecido, o botão leva ao formulário — o mesmo destino de
      // quando de fato não existe nenhum.
      loadPlanList(recordQueue, queryApi).then((lista) => {
        if (!active) return;
        setPlans(lista.plans);
      });

      // Tolerante a falha de rede — o avanço some da tela e o resto da home
      // continua de pé —, mas não a 401: essa leva ao login como qualquer outra.
      loadLoggedSessions(recordQueue, queryApi).then((lidas) => {
        if (!active) return;
        if (lidas.status === 'sessionLost') return goToLogin(router);
        setSessions(lidas.status === 'ok' ? lidas.sessions : null);
      });

      steadyTrainingPlanCache.load().then((loaded) => {
        if (!active) return;
        if (loaded.status === 'unauthenticated') return goToLogin(router);
        if (loaded.status === 'ok') {
          setWeekPlan(loaded.data.weekPlan);
          setWeekPlanFailed(false);
        } else {
          setWeekPlanFailed(true);
        }
      });

      workoutReviewCache.load().then(async (loaded) => {
        if (!active) return;
        if (loaded.status === 'unauthenticated') return goToLogin(router);
        if (loaded.status !== 'ok') return setLatestReview(null);
        setLatestReview(loaded.data);
        if (workoutReviewView(loaded.data).isConflict) {
          const key = `steady.review-conflict-seen.${loaded.data.id}`;
          if (await AsyncStorage.getItem(key) === null && active) {
            Alert.alert(
              'Prescrições em conflito',
              'O plano do Steady e a ficha do personal indicam corridas incompatíveis. Nenhuma recomendação foi escolhida.',
              [{ text: 'Fechar', onPress: () => void AsyncStorage.setItem(key, '1') }],
            );
          }
        }
      });

      return () => {
        active = false;
      };
    }, [router]),
  );

  const now = new Date();
  const header = homeHeader(now, menu.account.displayName, plans);
  const latestPlan = plans[0] ?? null;
  const training = weekPlan === null ? null : todaysTraining(now.getDay(), weekPlan);
  const progress = planProgressView(
    weekPlan === null ? { status: 'none' } : planProgress(now, latestPlan, sessions, weekPlan),
  );

  // O card leva ao dia de hoje já aberto na aba Semana (STORY-012, regra 1).
  // Sem planejamento, o destino continua sendo o formulário (regra 2).
  const planoDaSemana = latestPlan
    ? `/planning/plan?key=${encodeURIComponent(latestPlan.idempotencyKey)}` +
      `&section=semana&day=${weekPlanIndexFor(now.getDay())}`
    : '/planning/new';

  // O drawer continua restrito às telas que oferecem conta. A casca compartilhada
  // evita duplicar configuração entre Dashboard e Planejamento sem fazê-lo
  // vazar para login, Personal ou rotas empilhadas.
  return (
    <AccountMenuDrawer menu={menu}>
      <ScrollView
        style={s.screen}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[s.header, { paddingTop: insets.top + space[6] }]}>
          <View style={s.headerTop}>
            {/* O avatar é o único gatilho do menu: dizer quem está autenticado e
                abrir a conta é a mesma intenção — um hambúrguer ao lado dele só
                repetiria o toque. O gesto de arrastar da borda continua valendo. */}
            <AccountMenuButton menu={menu} />
          </View>

          {/* Saudação, contagem e fase: onde estou no plano, não que dia é hoje
              (STORY-011). O dia continua decidindo o card do treino abaixo. */}
          <View style={s.headline}>
            <View style={s.headlineText}>
              <Text style={s.greeting}>{header.greeting}</Text>
              {header.line !== null && <Text style={s.headerLine}>{header.line}</Text>}
            </View>
            {header.tag !== null && <Tag>{header.tag}</Tag>}
          </View>
        </View>

        {latestReview !== null && (
          <WorkoutReviewCard
            review={latestReview}
            onChange={setLatestReview}
          />
        )}

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
          <Kicker>Plano da semana</Kicker>
          {training !== null ? (
            <>
              <Text style={s.trainingTitle}>{training.title}</Text>
              <Muted>{training.description}</Muted>
            </>
          ) : (
            <Muted>
              {weekPlanFailed ? 'Não foi possível carregar seu plano.' : 'Carregando plano…'}
            </Muted>
          )}
          {progress.status !== 'hidden' && (
            <View style={s.progress}>
              {progress.headline !== null && (
                <View style={s.progressHead}>
                  <Text style={s.progressPercent}>{progress.headline}</Text>
                  <Text style={s.progressDetail}>{progress.detail}</Text>
                </View>
              )}
              {progress.status === 'ok' && (
                <View style={s.track}>
                  <View style={[s.fill, { width: `${progress.percent}%` }]} />
                </View>
              )}
              {progress.status === 'unavailable' && (
                <Text style={s.progressDetail}>{progress.detail}</Text>
              )}
              {progress.note !== null && <Text style={s.progressNote}>{progress.note}</Text>}
            </View>
          )}

          <View style={s.spaced}>
            <SecondaryButton label="Ver plano da semana" onPress={() => router.push(planoDaSemana)} />
          </View>
        </Card>

        <Card style={s.spaced}>
          <Kicker>Registrar</Kicker>
          <View style={s.actions}>
            <PrimaryButton label="Corrida" onPress={() => router.push('/log/run')} />
            <SecondaryButton label="Musculação" onPress={() => router.push('/log/strength')} />
            <SecondaryButton label="Dor" onPress={() => router.push('/log/pain')} />
          </View>
        </Card>

        <View style={s.spaced}>
          <SecondaryButton label="Ver histórico" onPress={() => router.push('/history')} />
        </View>
      </ScrollView>
    </AccountMenuDrawer>
  );
}

function WorkoutReviewCard({
  review,
  onChange,
}: {
  review: WorkoutReview;
  onChange(review: WorkoutReview): void;
}) {
  const view = workoutReviewView(review);
  const [working, setWorking] = useState(false);
  async function command(kind: 'understood' | 'retry' | 'contest') {
    setWorking(true);
    const result = kind === 'understood'
      ? await coachingApi.acknowledgeWorkoutReview(review.id)
      : kind === 'retry'
        ? await coachingApi.retryWorkoutReview(review.id)
        : await coachingApi.contestWorkoutReview(review.id);
    if (result.status === 'ok') {
      const refreshed = await coachingApi.latestWorkoutReview();
      if (refreshed.status === 'ok') onChange(refreshed.data);
    }
    setWorking(false);
  }
  return (
    <Card>
      <Kicker accent>Revisão do treino</Kicker>
      <Text style={s.trainingTitle}>{view.title}</Text>
      {view.action !== null && <Text style={s.reviewAction}>{view.action}</Text>}
      {view.comparison.map((line) => <Muted key={line}>{line}</Muted>)}
      {view.explanation !== null && <Muted>{view.explanation}</Muted>}
      {view.explanationUnavailable && (
        <>
          <Muted>A explicação não está disponível. A comparação e a recomendação continuam válidas.</Muted>
          <View style={s.reviewButton}><SecondaryButton label="Tentar novamente" disabled={working} onPress={() => void command('retry')} /></View>
        </>
      )}
      <Text style={s.reviewMeta}>{view.coherence}</Text>
      <View style={s.reviewButton}>
        {review.understoodAt === null
          ? <PrimaryButton label="Entendi" disabled={working} onPress={() => void command('understood')} />
          : <Muted>Leitura confirmada</Muted>}
      </View>
      {!review.contested && (
        <View style={s.reviewButton}><SecondaryButton label="Isso não faz sentido" disabled={working} onPress={() => void command('contest')} /></View>
      )}
    </Card>
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
  header: { paddingBottom: space[6] },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: space[6],
  },
  headline: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  headlineText: { flex: 1, paddingRight: space[4] },
  greeting: { color: color.text, fontSize: type.cardTitle },
  headerLine: {
    color: textAlpha.faint,
    fontSize: type.kicker,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: space[1],
  },
  trainingTitle: {
    color: color.text,
    fontSize: type.cardTitle,
    marginTop: space[3],
    marginBottom: space[2],
  },
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
  progress: { marginTop: space[6], gap: space[2] },
  progressHead: { flexDirection: 'row', alignItems: 'baseline', gap: space[3] },
  progressPercent: { color: color.text, fontSize: type.cardTitle, fontWeight: '600' },
  progressDetail: { color: textAlpha.muted, fontSize: type.meta, flex: 1 },
  progressNote: { color: color.accentRamp[400], fontSize: type.meta, lineHeight: 17 },
  reviewAction: { color: color.accentRamp[300], fontSize: type.cardTitle, marginBottom: space[3] },
  reviewMeta: { color: textAlpha.faint, fontSize: type.meta, marginTop: space[3] },
  reviewButton: { marginTop: space[4] },
  track: { height: 4, borderRadius: 2, backgroundColor: textAlpha.rule, overflow: 'hidden' },
  fill: { height: 4, borderRadius: 2, backgroundColor: color.accent },
  actions: { gap: space[3], marginTop: space[4] },
});
