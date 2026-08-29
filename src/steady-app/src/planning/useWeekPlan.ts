import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { steadyTrainingPlanCache } from '../services';
import { goToLogin } from '../auth/goToLogin';
import type { WeekPlanDay } from './trainingPlanDocument';

/**
 * O split semanal do plano do Steady, lido da API com cache offline
 * (ADR-013, STORY-016). `null` enquanto carrega ou se a leitura falhar sem
 * cache — nunca a constante antiga como resposta silenciosa.
 *
 * Para telas que só precisam do contexto do dia (o que consultavam antes só
 * por `TRAINING_PLAN_DOCUMENT.weekPlan` direto); `app/planning/plan.tsx` e a
 * Dashboard têm efeitos próprios porque também dependem de sessão e pedido.
 */
export function useWeekPlan(): readonly WeekPlanDay[] | null {
  const router = useRouter();
  const [weekPlan, setWeekPlan] = useState<readonly WeekPlanDay[] | null>(null);

  useEffect(() => {
    let ativo = true;

    steadyTrainingPlanCache.load().then((loaded) => {
      if (!ativo) return;
      if (loaded.status === 'unauthenticated') return goToLogin(router);
      if (loaded.status === 'ok') setWeekPlan(loaded.data.weekPlan);
    });

    return () => {
      ativo = false;
    };
  }, [router]);

  return weekPlan;
}
