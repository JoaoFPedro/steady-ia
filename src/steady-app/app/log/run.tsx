import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Field } from '../../src/ui/Field';
import { Muted, NoticeStrip, PrimaryButton } from '../../src/ui/Nocturne';
import { color, space, type } from '../../src/theme/nocturne';
import { useRecordLogger } from '../../src/features/useRecordLogger';
import { todayIso } from '../../src/features/date';

export default function LogRunScreen() {
  const { log, saving, problem } = useRecordLogger('running');

  const [distanceKm, setDistanceKm] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [averagePace, setAveragePace] = useState('');
  const [perceivedEffort, setPerceivedEffort] = useState('');

  const complete =
    distanceKm !== '' && durationMinutes !== '' && averagePace !== '' && perceivedEffort !== '';

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <Muted>
        A validação de verdade é do domínio, no servidor — se algo estiver fora do aceitável,
        a mensagem vem de lá.
      </Muted>

      <View style={s.form}>
        <Field
          label="Distância (km)"
          value={distanceKm}
          onChangeText={setDistanceKm}
          keyboardType="decimal-pad"
          placeholder="8"
        />
        <Field
          label="Duração (minutos)"
          value={durationMinutes}
          onChangeText={setDurationMinutes}
          keyboardType="numeric"
          placeholder="45"
        />
        <Field
          label="Ritmo médio (min/km)"
          value={averagePace}
          onChangeText={setAveragePace}
          keyboardType="decimal-pad"
          placeholder="5.6"
        />
        <Field
          label="Esforço percebido (1 a 10)"
          value={perceivedEffort}
          onChangeText={setPerceivedEffort}
          keyboardType="numeric"
          placeholder="5"
        />
      </View>

      {problem && (
        <View style={s.problem}>
          <NoticeStrip>
            <Text style={s.problemText}>
              <Text style={s.problemStrong}>Não foi salvo. </Text>
              {problem}
            </Text>
          </NoticeStrip>
        </View>
      )}

      <PrimaryButton
        label={saving ? 'Registrando…' : 'Registrar corrida'}
        disabled={!complete || saving}
        onPress={() =>
          log({
            date: todayIso(),
            distanceKm: Number(distanceKm.replace(',', '.')),
            durationMinutes: Number(durationMinutes),
            averagePaceMinPerKm: Number(averagePace.replace(',', '.')),
            perceivedEffort: Number(perceivedEffort),
          })
        }
      />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  content: { paddingHorizontal: space[8], paddingTop: space[6], paddingBottom: space[8] * 2 },
  form: { marginTop: space[8] },
  problem: { marginBottom: space[6] },
  problemText: { color: color.accentRamp[400], fontSize: type.meta, lineHeight: 19 },
  problemStrong: { color: color.text },
});
