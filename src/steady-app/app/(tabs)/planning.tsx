import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, Kicker, Muted, NoticeStrip, PrimaryButton } from '../../src/ui/Nocturne';
import { color, space, textAlpha, type } from '../../src/theme/nocturne';
import { loadPlanList, type PlanListState } from '../../src/planning/planListState';
import { formatRaceDate } from '../../src/planning/raceDate';
import { RACE_DISTANCE_LABEL } from '../../src/planning/trainingPlanRequest';
import { goToLogin } from '../../src/auth/goToLogin';
import { queryApi, recordQueue } from '../../src/services';

/**
 * A aba **é** a lista de planejamentos criados (STORY-008), agora vinda do
 * servidor (STORY-010): ela sobrevive a fechar o app e é a mesma em qualquer
 * aparelho do corredor.
 */
export default function PlanningScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [state, setState] = useState<PlanListState>({ status: 'ok', plans: [] });
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;

      loadPlanList(recordQueue, queryApi).then((novo) => {
        if (!ativo) return;
        if (novo.status === 'sessionLost') return goToLogin(router);

        setState(novo);
        setLoading(false);
      });

      return () => {
        ativo = false;
      };
    }, [router]),
  );

  const maisRecente = state.plans[0]?.idempotencyKey;

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={[s.content, { paddingTop: insets.top + space[6] }]}
      showsVerticalScrollIndicator={false}
    >
      <Kicker accent>Planejamento</Kicker>
      <Text style={s.title}>Seus planejamentos</Text>

      {/* "Não consegui carregar" nunca vira "você não tem nenhum": são estados
          diferentes, e só um deles convida a criar (ADR-004, spec regra 14). */}
      {state.status === 'unavailable' && (
        <View style={s.spaced}>
          <NoticeStrip>
            <Text style={s.noticeText}>
              Não foi possível carregar seus planejamentos. O que está aqui é o que
              ainda não subiu deste aparelho.
            </Text>
          </NoticeStrip>
        </View>
      )}

      {state.plans.length === 0 ? (
        <View style={s.spaced}>
          <Muted>
            {loading
              ? 'Carregando…'
              : state.status === 'unavailable'
                ? 'Nada guardado neste aparelho.'
                : 'Você ainda não criou nenhum planejamento.'}
          </Muted>
        </View>
      ) : (
        <View style={s.listItems}>
          {state.plans.map((plan) => {
            const ativo = plan.idempotencyKey === maisRecente;
            return (
              <Pressable
                key={plan.idempotencyKey}
                onPress={() => router.push(`/planning/plan?key=${plan.idempotencyKey}`)}
              >
                <Card style={s.listItem}>
                  <View style={s.listItemRow}>
                    <View style={s.listItemBody}>
                      <Kicker accent={ativo}>
                        {plan.pending ? 'Pendente' : ativo ? 'Ativo' : 'Anterior'}
                      </Kicker>
                      <Text style={s.listItemTitle}>
                        {RACE_DISTANCE_LABEL[plan.raceDistance] ?? plan.raceDistance}
                      </Text>
                      <Muted>Prova em {formatRaceDate(plan.raceDate)}</Muted>
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
  title: { color: color.text, fontSize: type.title, fontWeight: '600', marginTop: space[2] },
  spaced: { marginTop: space[6] },
  listItems: { marginTop: space[6], gap: space[4] },
  listItem: { paddingVertical: space[4] },
  listItemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  listItemBody: { flex: 1, gap: space[1] },
  listItemTitle: { color: color.text, fontSize: type.cardTitle, fontWeight: '600' },
  chevron: { color: textAlpha.ghost, fontSize: type.cardTitle, marginLeft: space[4] },
  noticeText: { color: color.accentRamp[400], fontSize: type.meta, lineHeight: 19 },
});
