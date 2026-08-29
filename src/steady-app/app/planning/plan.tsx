import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Muted } from '../../src/ui/Nocturne';
import { color, space } from '../../src/theme/nocturne';
import { PlanningDocument } from '../../src/planning/PlanningDocument';
import { planDayIndexFromParam, sectionFromParam } from '../../src/planning/planDayParam';
import type { TrainingPlanDocument } from '../../src/planning/trainingPlanDocument';
import { loadPlanList } from '../../src/planning/planListState';
import { loadLoggedSessions } from '../../src/planning/loggedSessions';
import { weekStatuses } from '../../src/planning/weekStatuses';
import { weekPlanIndexFor } from '../../src/planning/weekPlanDay';
import type { DayStatus, LoggedSession } from '../../src/planning/dayCompletion';
import type { PlanRequestSummary } from '../../src/planning/planRequest';
import { goToLogin } from '../../src/auth/goToLogin';
import { queryApi, recordQueue, steadyTrainingPlanCache, trainingSheetCache } from '../../src/services';
import type { TrainingSheet } from '../../src/coaching/types';

/**
 * Documento de **um** planejamento. A rota carrega a chave de idempotência do
 * pedido (STORY-010): sem ela, todo card abria a mesma tela.
 *
 * O pedido é achado na mesma lista que a aba usa, e não por um GET dedicado, de
 * propósito: é o que faz um pedido ainda na fila abrir normalmente (regra 9) —
 * o servidor ainda não o conhece.
 *
 * `section` e `day` chegam do card da Dashboard (STORY-012, regra 1): sem eles,
 * a tela abre em "Seus dados" com tudo fechado, como sempre abriu (regra 3).
 */
export default function PlanningPlanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { key, section, day } = useLocalSearchParams<{
    key?: string;
    section?: string;
    day?: string;
  }>();
  const [request, setRequest] = useState<PlanRequestSummary | null>(null);
  const [sessions, setSessions] = useState<readonly LoggedSession[] | null>(null);
  const [sheet, setSheet] = useState<TrainingSheet | null>(null);
  const [sheetStale, setSheetStale] = useState(false);
  const [sheetLoading, setSheetLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  /**
   * O plano do Steady, lido da API com cache offline (ADR-013, STORY-016) — não
   * mais a constante local. `documentFailed` distingue "ainda carregando" de
   * "falhou sem cache", para nunca aparecer como uma semana vazia (ADR-004).
   */
  const [document, setDocument] = useState<TrainingPlanDocument | null>(null);
  const [documentFailed, setDocumentFailed] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;

      loadPlanList(recordQueue, queryApi).then(async (state) => {
        if (!ativo) return;
        if (state.status === 'sessionLost') return goToLogin(router);

        const encontrado = state.plans.find((plan) => plan.idempotencyKey === key) ?? null;
        setRequest(encontrado);
        setLoading(false);

        // Leitura separada e tolerante: falhar aqui deixa a semana sem marcas,
        // nunca com marcas erradas (regra 25). O documento continua legível.
        const lidas = await loadLoggedSessions(recordQueue, queryApi);
        if (!ativo) return;
        if (lidas.status === 'sessionLost') return goToLogin(router);

        setSessions(lidas.status === 'ok' ? lidas.sessions : null);
      });

      trainingSheetCache.load().then((loaded) => {
        if (!ativo) return;
        if (loaded.status === 'unauthenticated') return goToLogin(router);
        setSheet(loaded.status === 'ok' ? loaded.data : null);
        setSheetStale(loaded.status === 'ok' && loaded.stale);
        setSheetLoading(false);
      });

      steadyTrainingPlanCache.load().then((loaded) => {
        if (!ativo) return;
        if (loaded.status === 'unauthenticated') return goToLogin(router);
        if (loaded.status === 'ok') {
          setDocument(loaded.data);
          setDocumentFailed(false);
        } else {
          setDocumentFailed(true);
        }
      });

      return () => {
        ativo = false;
      };
    }, [key, router]),
  );

  if (loading) {
    return (
      <View style={[s.centered, { paddingTop: insets.top + space[8] }]}>
        <Muted>Carregando…</Muted>
      </View>
    );
  }

  if (!request) {
    return (
      <View style={[s.centered, { paddingTop: insets.top + space[8] }]}>
        <Text style={s.missing}>Planejamento não encontrado.</Text>
        <Muted>Ele pode não ter sido carregado ainda. Volte e tente de novo.</Muted>
      </View>
    );
  }

  if (document === null) {
    return (
      <View style={[s.centered, { paddingTop: insets.top + space[8] }]}>
        {documentFailed ? (
          <>
            <Text style={s.missing}>Não foi possível carregar seu plano.</Text>
            <Muted>Verifique sua conexão e tente novamente.</Muted>
          </>
        ) : (
          <Muted>Carregando…</Muted>
        )}
      </View>
    );
  }

  const abrir = planDayIndexFromParam(day, document.weekPlan);
  const hoje = weekPlanIndexFor(new Date().getDay());
  const statuses = weekStatuses(new Date(), request, sessions, document.weekPlan);

  return (
    <PlanningDocument
      document={document}
      request={request}
      topInset={insets.top}
      onEdit={() => router.push('/planning/new')}
      initialSection={sectionFromParam(section)}
      openDay={abrir === null ? null : document.weekPlan[abrir].day}
      dayStatuses={statuses}
      todayIndex={hoje}
      sheet={sheet}
      sheetStale={sheetStale}
      sheetLoading={sheetLoading}
      onRegister={(planDayIndex: number) => router.push({
        pathname: '/coaching/select', params: { planDay: planDayIndex },
      })}
    />
  );
}


const s = StyleSheet.create({
  centered: { flex: 1, backgroundColor: color.bg, paddingHorizontal: space[8], gap: space[3] },
  missing: { color: color.text, fontSize: 18, fontWeight: '600' },
});
