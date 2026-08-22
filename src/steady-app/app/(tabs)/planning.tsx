import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Card, Kicker, Muted, PrimaryButton } from '../../src/ui/Nocturne';
import { color, radius, space, textAlpha, type } from '../../src/theme/nocturne';
import { RACE_DISTANCES } from '../../src/planning/trainingPlanRequest';
import { listGeneratedPlans, type GeneratedPlan } from '../../src/planning/generatedPlansStore';

const RACE_DISTANCE_LABEL: Record<string, string> = Object.fromEntries(
  RACE_DISTANCES.map((option) => [option.value, option.label]),
);

/**
 * Planejamento (STORY-006/STORY-008) — a aba mostra os planos já criados
 * e o botão para criar mais um. Não é um estado interno alternando entre
 * form/lista/documento: criar e visualizar são rotas próprias
 * (`/planning/new`, `/planning/plan`, irmãs de `log/*`), do mesmo jeito que
 * o resto do app já empilha telas sobre uma aba. A aba, sozinha, é sempre
 * esta lista.
 */
export default function PlanningScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [plans, setPlans] = useState<GeneratedPlan[]>(() => listGeneratedPlans());

  // Recarrega ao voltar de `/planning/new`: um plano pode ter sido criado.
  useFocusEffect(
    useCallback(() => {
      setPlans(listGeneratedPlans());
    }, []),
  );

  const mostRecentId = plans[0]?.id;

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={[s.content, { paddingTop: insets.top + space[6] }]}
      showsVerticalScrollIndicator={false}
    >
      <Kicker accent>Planejamento</Kicker>
      <Text style={s.title}>Seus planejamentos</Text>

      {plans.length === 0 ? (
        <View style={s.spaced}>
          <Muted>Você ainda não criou nenhum planejamento.</Muted>
        </View>
      ) : (
        <View style={s.listItems}>
          {plans.map((plan) => {
            const isActive = plan.id === mostRecentId;
            return (
              <Pressable key={plan.id} onPress={() => router.push('/planning/plan')}>
                <Card style={s.listItem}>
                  <View style={s.listItemRow}>
                    <View style={s.listItemBody}>
                      <Kicker accent={isActive}>{isActive ? 'Ativo' : 'Anterior'}</Kicker>
                      <Text style={s.listItemTitle}>
                        {RACE_DISTANCE_LABEL[plan.raceDistance] ?? plan.raceDistance}
                      </Text>
                      <Muted>Prova em {plan.raceDate}</Muted>
                    </View>
                    <Text style={s.chevron}>›</Text>
                  </View>
                </Card>
              </Pressable>
            );
          })}
        </View>
      )}

      <View style={s.spaced}>
        <PrimaryButton label="Criar planejamento" onPress={() => router.push('/planning/new')} />
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  content: { paddingHorizontal: space[8], paddingBottom: space[8] * 2 },
  title: { color: color.text, fontSize: type.section, fontWeight: '500', marginTop: space[2] },
  listItems: { gap: space[3], marginTop: space[6] },
  listItem: { borderRadius: radius.md },
  listItemRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  listItemBody: { flex: 1 },
  listItemTitle: { color: color.text, fontSize: type.body, marginTop: space[2], marginBottom: 2 },
  chevron: { color: textAlpha.faint, fontSize: type.cardTitle, paddingTop: space[1] },
  spaced: { marginTop: space[8] },
});
