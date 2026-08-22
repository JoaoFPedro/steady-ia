import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PlanningDocument } from '../../src/planning/PlanningDocument';
import { TRAINING_PLAN_DOCUMENT } from '../../src/planning/trainingPlanDocument';

/**
 * Rota própria (STORY-008) — `headerShown: false` no `Stack` (root
 * `_layout.tsx`): `PlanningDocument` desenha o próprio cabeçalho (título,
 * abas internas), a barra do `Stack` aqui duplicaria o topo, mesmo motivo
 * do grupo `(tabs)`. Conteúdo é sempre `TRAINING_PLAN_DOCUMENT` — nenhum
 * plano gerado tem conteúdo diferente de outro (DISC-002).
 */
export default function PlanningPlanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <PlanningDocument
      document={TRAINING_PLAN_DOCUMENT}
      topInset={insets.top}
      onEdit={() => router.push('/planning/new')}
    />
  );
}
