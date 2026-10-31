import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { TrainingSessionSummary } from '../api/queryApi';
import { Card, Kicker } from '../ui/Nocturne';
import { color, space, textAlpha, type } from '../theme/nocturne';
import { workoutCard } from './workoutCard';

export function LatestWorkoutCard({
  session,
  orderUnknown,
  onPress,
}: {
  session: TrainingSessionSummary;
  orderUnknown: boolean;
  onPress: () => void;
}) {
  const card = workoutCard(session);
  const summary = card.metrics.map(({ label, value }) => `${label}: ${value}`).join(', ');
  const status = [session.pending ? 'Aguardando sincronização.' : null,
    orderUnknown ? 'A ordem entre treinos desta data é desconhecida.' : null].filter(Boolean).join(' ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ver detalhes da ${card.title.toLowerCase()} de ${card.date}. ${summary}. ${status}`}
      onPress={onPress}
    >
      <Card style={styles.card}>
        <View style={styles.header}>
          <View>
            <Kicker accent>Último treino</Kicker>
            <Text style={styles.title}>{card.title}</Text>
            <Text style={styles.date}>{card.date}</Text>
          </View>
          <Text accessibilityElementsHidden importantForAccessibility="no" style={styles.arrow}>›</Text>
        </View>
        <View style={styles.metrics}>
          {card.metrics.map((metric) => (
            <View key={metric.label} style={styles.metric}>
              <Text style={styles.metricValue}>{metric.value}</Text>
              <Text style={styles.metricLabel}>{metric.label}</Text>
            </View>
          ))}
        </View>
        {session.pending && <Text style={styles.note}>Aguardando sincronização.</Text>}
        {orderUnknown && (
          <Text style={styles.note}>A ordem entre treinos desta data é desconhecida.</Text>
        )}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: space[4] },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: color.text, fontSize: type.body, fontWeight: '700', marginTop: space[2] },
  date: { color: textAlpha.faint, fontSize: type.bodySm, marginTop: space[1] },
  arrow: { color: color.accentRamp[300], fontSize: 28 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: space[4], marginTop: space[4] },
  metric: { flexGrow: 1, minWidth: 75 },
  metricValue: { color: color.text, fontSize: type.body, fontWeight: '600' },
  metricLabel: { color: textAlpha.faint, fontSize: type.bodySm, marginTop: space[1] },
  note: { color: textAlpha.label, fontSize: type.bodySm, marginTop: space[4] },
});
