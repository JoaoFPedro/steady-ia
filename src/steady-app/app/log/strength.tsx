import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Field } from '../../src/ui/Field';
import { Choice } from '../../src/ui/Choice';
import { Muted, NoticeStrip, PrimaryButton } from '../../src/ui/Nocturne';
import { color, space, type } from '../../src/theme/nocturne';
import { useRecordLogger } from '../../src/features/useRecordLogger';
import { todayIso } from '../../src/features/date';
import {
  INTENSITIES,
  MUSCLE_GROUPS,
  type Intensity,
  type MuscleGroup,
} from '../../src/training/labels';

export default function LogStrengthScreen() {
  const { log, saving, problem } = useRecordLogger('strength');

  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup | null>(null);
  const [intensity, setIntensity] = useState<Intensity | null>(null);
  const [durationMinutes, setDurationMinutes] = useState('');

  const complete = muscleGroup !== null && intensity !== null && durationMinutes !== '';

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <Muted>
        Treino de perna pesado é o que a avaliação cruza com o seu volume de corrida — por isso
        o grupo muscular importa.
      </Muted>

      <View style={s.form}>
        <Choice
          label="Grupo muscular"
          options={MUSCLE_GROUPS}
          value={muscleGroup}
          onChange={setMuscleGroup}
        />
        <Choice label="Intensidade" options={INTENSITIES} value={intensity} onChange={setIntensity} />
        <Field
          label="Duração (minutos)"
          value={durationMinutes}
          onChangeText={setDurationMinutes}
          keyboardType="numeric"
          placeholder="45"
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
        label={saving ? 'Registrando…' : 'Registrar musculação'}
        disabled={!complete || saving}
        onPress={() =>
          log({
            date: todayIso(),
            muscleGroup,
            intensity,
            durationMinutes: Number(durationMinutes),
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
