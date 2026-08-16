import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Choice } from '../../src/ui/Choice';
import { Field } from '../../src/ui/Field';
import { Muted, NoticeStrip, PrimaryButton } from '../../src/ui/Nocturne';
import { color, space, type } from '../../src/theme/nocturne';
import { useRecordLogger } from '../../src/features/useRecordLogger';
import { todayIso } from '../../src/features/date';

/**
 * Regiões frequentes, com campo livre para o resto.
 *
 * A dor é registrada solta, não presa a uma sessão: ela costuma aparecer horas
 * ou dias depois do treino (decisão registrada em specs/STORY-003/story.md).
 */
const REGIONS = [
  { value: 'Canela', label: 'Canela' },
  { value: 'Joelho', label: 'Joelho' },
  { value: 'Panturrilha', label: 'Panturrilha' },
  { value: 'Coxa', label: 'Coxa' },
  { value: 'Quadril', label: 'Quadril' },
  { value: 'Pé', label: 'Pé' },
  { value: 'Lombar', label: 'Lombar' },
] as const;

export default function LogPainScreen() {
  const { log, saving, problem } = useRecordLogger('pain');

  const [region, setRegion] = useState<string | null>(null);
  const [otherRegion, setOtherRegion] = useState('');

  const chosen = otherRegion.trim() !== '' ? otherRegion.trim() : region;

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <Muted>
        Registrar onde doeu é o que permite observar se os episódios ficam menos frequentes ao
        longo das semanas.
      </Muted>

      <View style={s.form}>
        <Choice
          label="Região"
          options={REGIONS.map((r) => ({ value: r.value, label: r.label }))}
          value={region}
          onChange={setRegion}
        />
        <Field
          label="Outra região"
          value={otherRegion}
          onChangeText={setOtherRegion}
          placeholder="Descreva onde doeu"
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
        label={saving ? 'Registrando…' : 'Registrar dor'}
        disabled={!chosen || saving}
        onPress={() => log({ date: todayIso(), region: chosen })}
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
