import { ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { PlanningForm } from '../../src/planning/PlanningForm';
import { addGeneratedPlan } from '../../src/planning/generatedPlansStore';
import { color, space } from '../../src/theme/nocturne';

/**
 * Rota própria (STORY-008), irmã de `log/*` — mesmo padrão do resto do app:
 * empilha sobre a aba de origem, cabeçalho nativo do `Stack` cuida do
 * título/voltar. Ao gerar, troca de lugar (`replace`) com o documento — a
 * pilha não acumula um formulário preenchido atrás do plano gerado.
 */
export default function PlanningNewScreen() {
  const router = useRouter();

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <PlanningForm
        onGenerate={(input) => {
          addGeneratedPlan(input);
          router.replace('/planning/plan');
        }}
      />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  content: { paddingHorizontal: space[8], paddingTop: space[6], paddingBottom: space[8] * 2 },
});
