import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Muted } from '../../src/ui/Nocturne';
import { color, space } from '../../src/theme/nocturne';
import { PlanningDocument } from '../../src/planning/PlanningDocument';
import { TRAINING_PLAN_DOCUMENT } from '../../src/planning/trainingPlanDocument';
import { loadPlanList } from '../../src/planning/planListState';
import type { PlanRequestSummary } from '../../src/planning/planRequest';
import { goToLogin } from '../../src/auth/goToLogin';
import { queryApi, recordQueue } from '../../src/services';

/**
 * Documento de **um** planejamento. A rota carrega a chave de idempotência do
 * pedido (STORY-010): sem ela, todo card abria a mesma tela.
 *
 * O pedido é achado na mesma lista que a aba usa, e não por um GET dedicado, de
 * propósito: é o que faz um pedido ainda na fila abrir normalmente (regra 9) —
 * o servidor ainda não o conhece.
 */
export default function PlanningPlanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { key } = useLocalSearchParams<{ key?: string }>();
  const [request, setRequest] = useState<PlanRequestSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;

      loadPlanList(recordQueue, queryApi).then((state) => {
        if (!ativo) return;
        if (state.status === 'sessionLost') return goToLogin(router);

        setRequest(state.plans.find((plan) => plan.idempotencyKey === key) ?? null);
        setLoading(false);
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

  return (
    <PlanningDocument
      document={TRAINING_PLAN_DOCUMENT}
      request={request}
      topInset={insets.top}
      onEdit={() => router.push('/planning/new')}
    />
  );
}

const s = StyleSheet.create({
  centered: { flex: 1, backgroundColor: color.bg, paddingHorizontal: space[8], gap: space[3] },
  missing: { color: color.text, fontSize: 18, fontWeight: '600' },
});
