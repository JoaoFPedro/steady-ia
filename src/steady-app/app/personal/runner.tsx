import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Field } from '../../src/ui/Field';
import { Card, Kicker, Muted, NoticeStrip, PrimaryButton, Rule, SecondaryButton } from '../../src/ui/Nocturne';
import { color, radius, space, textAlpha, type } from '../../src/theme/nocturne';
import { coachingApi } from '../../src/services';
import type { CoachingHistory, ExerciseDraft, TrainingSheetDraft } from '../../src/coaching/types';
import {
  buildRunPrescriptionDraft,
  type RunPrescriptionFormInput,
} from '../../src/coaching/runPrescriptionForm';
import { goToLogin } from '../../src/auth/goToLogin';

type DraftInput = { name: string; sets: string; repetitions: string };
const emptyExercise = (): DraftInput => ({ name: '', sets: '', repetitions: '' });
const emptyRun = (): RunPrescriptionFormInput => ({
  description: '',
  distanceMin: '', distanceMax: '',
  durationMin: '', durationMax: '',
  effortMin: '', effortMax: '',
});

export default function PersonalRunnerScreen() {
  const router = useRouter();
  const { corredorId = '', email = '', linkId = '' } = useLocalSearchParams<{
    corredorId?: string; email?: string; linkId?: string;
  }>();
  const [push, setPush] = useState<DraftInput[]>([emptyExercise()]);
  const [pull, setPull] = useState<DraftInput[]>([emptyExercise()]);
  const [lower, setLower] = useState<DraftInput[]>([emptyExercise()]);
  const [tuesdayRun, setTuesdayRun] = useState<RunPrescriptionFormInput>(emptyRun());
  const [thursdayRun, setThursdayRun] = useState<RunPrescriptionFormInput>(emptyRun());
  const [saturdayRun, setSaturdayRun] = useState<RunPrescriptionFormInput>(emptyRun());
  const [history, setHistory] = useState<CoachingHistory | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  /** Os forms de treino só aparecem depois de um toque deliberado — a tela não abre já pedindo 15 campos. */
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    let active = true;
    coachingApi.history(corredorId).then((result) => {
      if (!active) return;
      if (result.status === 'unauthenticated') return goToLogin(router);
      setHistory(result.status === 'ok' ? result.data : null);
    });
    return () => { active = false; };
  }, [corredorId, router]);

  async function publish() {
    const convert = (items: DraftInput[]): ExerciseDraft[] => items.map((item) => ({
      name: item.name.trim(), sets: Number(item.sets), repetitions: Number(item.repetitions),
    }));

    const tuesday = buildRunPrescriptionDraft(tuesdayRun);
    const thursday = buildRunPrescriptionDraft(thursdayRun);
    const saturday = buildRunPrescriptionDraft(saturdayRun);
    const firstProblem = [tuesday, thursday, saturday].find((result) => !result.ok);
    if (firstProblem && !firstProblem.ok) {
      setMessage(firstProblem.message);
      return;
    }
    if (!tuesday.ok || !thursday.ok || !saturday.ok) return;

    const draft: TrainingSheetDraft = {
      push: convert(push),
      pull: convert(pull),
      lower: convert(lower),
      tuesdayRun: tuesday.draft,
      thursdayRun: thursday.draft,
      saturdayRun: saturday.draft,
    };
    setBusy(true);
    const result = await coachingApi.publishTrainingSheet(corredorId, draft);
    setBusy(false);
    if (result.status === 'unauthenticated') return goToLogin(router);
    setMessage(result.status === 'ok'
      ? 'Ficha publicada e ativa. As cargas começam vazias para o corredor.'
      : result.status === 'rejected' || result.status === 'conflict'
        ? result.message : 'Não foi possível publicar a ficha.');
  }

  async function endLink() {
    const result = await coachingApi.endLink(linkId);
    if (result.status === 'unauthenticated') return goToLogin(router);
    if (result.status === 'ok') router.back();
    else setMessage('Não foi possível encerrar o vínculo.');
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <Text style={s.title}>{email}</Text>
      <Muted>Publicar uma nova ficha substitui a atual sem alterar o histórico já registrado.</Muted>
      {message !== null && <View style={s.block}><NoticeStrip><Text style={s.notice}>{message}</Text></NoticeStrip></View>}

      <Card style={s.block}>
        <Kicker>Nova ficha</Kicker>
        {!showForm ? (
          <PrimaryButton label="Criar Ficha" onPress={() => setShowForm(true)} />
        ) : (
          <>
            <ExerciseSection title="Empurrada" items={push} onChange={setPush} />
            <ExerciseSection title="Puxada" items={pull} onChange={setPull} />
            <ExerciseSection title="Inferiores" items={lower} onChange={setLower} />
            <View style={s.section}>
              <Text style={s.sectionTitle}>Corrida</Text>
              <RunPrescriptionSection
                title="Terça-feira"
                descriptionPlaceholder="Moderada/fartlek leve, pace e duração"
                value={tuesdayRun}
                onChange={setTuesdayRun}
              />
              <RunPrescriptionSection
                title="Quinta-feira"
                descriptionPlaceholder="Intervalado ou tempo run, pace e duração"
                value={thursdayRun}
                onChange={setThursdayRun}
              />
              <RunPrescriptionSection
                title="Sábado"
                descriptionPlaceholder="Longão, pace e distância"
                value={saturdayRun}
                onChange={setSaturdayRun}
              />
            </View>
            <PrimaryButton label={busy ? 'Publicando…' : 'Publicar ficha completa'} disabled={busy} onPress={() => void publish()} />
          </>
        )}
      </Card>

      <View style={s.block}>
        <Kicker>Histórico detalhado</Kicker>
        {history === null || (history.strengthExecutions.length === 0 && history.runningSessions.length === 0) ? (
          <Text style={s.empty}>Nenhuma execução registrada.</Text>
        ) : (
          <>
            {history.strengthExecutions.map((execution) => (
              <Card key={execution.id} style={s.historyCard}>
                <Text style={s.historyTitle}>{execution.workoutType.toUpperCase()} · {execution.date}</Text>
                {execution.exercises.map((exercise) => (
                  <View key={exercise.exerciseId} style={s.historyExercise}>
                    <Text style={s.exerciseName}>´{exercise.name} · {exercise.sets}x{exercise.repetitions} repetições´</Text>
                    <Text style={exercise.skipped ? s.skipped : s.load}>
                      {exercise.skipped ? 'Não realizado' : `${exercise.loadKg} kg`}
                    </Text>
                    {exercise.note !== null && <Text style={s.note}>{exercise.note}</Text>}
                  </View>
                ))}
              </Card>
            ))}
            {history.runningSessions.map((run) => (
              <Card key={run.id} style={s.historyCard}>
                <Text style={s.historyTitle}>CORRIDA · {run.date}</Text>
                <Muted>{run.distanceKm} km · {run.durationMinutes} min · esforço {run.perceivedEffort}/10</Muted>
              </Card>
            ))}
          </>
        )}
      </View>

      <View style={s.block}><SecondaryButton label="Encerrar vínculo" onPress={() => void endLink()} /></View>
    </ScrollView>
  );
}

function ExerciseSection({
  title, items, onChange,
}: {
  title: string;
  items: DraftInput[];
  onChange: (items: DraftInput[]) => void;
}) {
  function update(index: number, field: keyof DraftInput, value: string) {
    onChange(items.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));
  }
  return (
    <View style={s.section}>
      <Rule />
      <Text style={s.sectionTitle}>{title}</Text>
      {items.map((item, index) => (
        <View key={index} style={s.exerciseDraft}>
          <Field label="Exercício" value={item.name} onChangeText={(value) => update(index, 'name', value)} placeholder="Agachamento livre" />
          <View style={s.row}>
            <View style={s.half}><Field label="Séries" value={item.sets} onChangeText={(value) => update(index, 'sets', value)} keyboardType="numeric" placeholder="4" /></View>
            <View style={s.half}><Field label="Repetições" value={item.repetitions} onChangeText={(value) => update(index, 'repetitions', value)} keyboardType="numeric" placeholder="6" /></View>
          </View>
        </View>
      ))}
      <Pressable style={s.add} onPress={() => onChange([...items, emptyExercise()])}>
        <Text style={s.addText}>+ Adicionar exercício</Text>
      </Pressable>
    </View>
  );
}

/**
 * Distância, duração e esforço são opcionais e independentes (ADR-012): o
 * personal continua podendo publicar só a descrição, como antes desta story.
 */
function RunPrescriptionSection({
  title, descriptionPlaceholder, value, onChange,
}: {
  title: string;
  descriptionPlaceholder: string;
  value: RunPrescriptionFormInput;
  onChange: (value: RunPrescriptionFormInput) => void;
}) {
  function update(field: keyof RunPrescriptionFormInput, text: string) {
    onChange({ ...value, [field]: text });
  }
  return (
    <View style={s.runDraft}>
      <Text style={s.runDraftTitle}>{title}</Text>
      <Field
        label="Descrição"
        value={value.description}
        onChangeText={(text) => update('description', text)}
        multiline={3}
        placeholder={descriptionPlaceholder}
      />
      <View style={s.row}>
        <View style={s.third}>
          <Field label="Km (min)" value={value.distanceMin} onChangeText={(text) => update('distanceMin', text)} keyboardType="numeric" placeholder="8" />
        </View>
        <View style={s.third}>
          <Field label="Km (máx.)" value={value.distanceMax} onChangeText={(text) => update('distanceMax', text)} keyboardType="numeric" placeholder="10" />
        </View>
      </View>
      <View style={s.row}>
        <View style={s.third}>
          <Field label="Min. (min)" value={value.durationMin} onChangeText={(text) => update('durationMin', text)} keyboardType="numeric" placeholder="45" />
        </View>
        <View style={s.third}>
          <Field label="Min. (máx.)" value={value.durationMax} onChangeText={(text) => update('durationMax', text)} keyboardType="numeric" placeholder="55" />
        </View>
      </View>
      <View style={s.row}>
        <View style={s.third}>
          <Field label="Esforço (min)" value={value.effortMin} onChangeText={(text) => update('effortMin', text)} keyboardType="numeric" placeholder="5" />
        </View>
        <View style={s.third}>
          <Field label="Esforço (máx.)" value={value.effortMax} onChangeText={(text) => update('effortMax', text)} keyboardType="numeric" placeholder="6" />
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  content: { paddingHorizontal: space[8], paddingTop: space[6], paddingBottom: space[8] * 2 },
  title: { color: color.text, fontSize: type.title, marginBottom: space[2] },
  block: { marginTop: space[6] },
  notice: { color: color.accentRamp[300], fontSize: type.meta, lineHeight: 19 },
  section: { marginTop: space[4] },
  sectionTitle: { color: color.text, fontSize: type.cardTitle, marginBottom: space[4] },
  exerciseDraft: { marginBottom: space[2] },
  row: { flexDirection: 'row', gap: space[4] },
  half: { flex: 1 },
  third: { flex: 1 },
  runDraft: { marginTop: space[4] },
  runDraftTitle: { color: color.text, fontSize: type.bodySm, marginBottom: space[2] },
  add: { alignSelf: 'flex-start', borderRadius: radius.md, borderWidth: 1, borderColor: textAlpha.divider, padding: space[3], marginBottom: space[6] },
  addText: { color: color.accentRamp[300], fontSize: type.meta },
  empty: { color: textAlpha.muted, marginTop: space[4], fontSize: type.meta },
  historyCard: { marginTop: space[4] },
  historyTitle: { color: color.text, fontSize: type.body, marginBottom: space[3] },
  historyExercise: { borderTopWidth: 1, borderTopColor: textAlpha.rule, paddingTop: space[3], marginTop: space[3] },
  exerciseName: { color: color.text, fontSize: type.bodySm },
  load: { color: color.accentRamp[300], fontSize: type.meta, marginTop: space[1] },
  skipped: { color: color.accentRamp[400], fontSize: type.meta, marginTop: space[1] },
  note: { color: textAlpha.muted, fontSize: type.meta, marginTop: space[2] },
});
