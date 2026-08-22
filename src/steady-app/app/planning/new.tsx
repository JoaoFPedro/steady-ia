import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { PlanningForm } from '../../src/planning/PlanningForm';
import { logPlanRequest } from '../../src/planning/logPlanRequest';
import type { PlanRequestPayload } from '../../src/planning/planRequest';
import { goToLogin } from '../../src/auth/goToLogin';
import { recordQueue, syncEngine } from '../../src/services';
import { color, space } from '../../src/theme/nocturne';

/**
 * Rota própria (STORY-008), irmã de `log/*`. Ao gerar, troca de lugar
 * (`replace`) com o documento — a pilha não acumula um formulário preenchido
 * atrás do plano gerado.
 *
 * A navegação leva a chave de idempotência: ela identifica o pedido desde antes
 * de ele chegar ao servidor, então o documento abre mesmo se a rede estiver
 * fora (STORY-010, regras 3 e 9).
 */
export default function PlanningNewScreen() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  async function gerar(payload: PlanRequestPayload) {
    setSaving(true);
    setProblem(null);

    try {
      const { outcome, idempotencyKey } = await logPlanRequest(recordQueue, syncEngine, payload);

      if (outcome.status === 'rejected') {
        setProblem(outcome.message);
        return;
      }

      if (outcome.status === 'sessionLost') {
        goToLogin(router);
        return;
      }

      // `saved` e `pending` são o mesmo desfecho para o corredor: está guardado.
      router.replace(`/planning/plan?key=${idempotencyKey}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <PlanningForm onGenerate={gerar} saving={saving} problem={problem} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  content: { paddingHorizontal: space[8], paddingTop: space[6], paddingBottom: space[8] * 2 },
});
