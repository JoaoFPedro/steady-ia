import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Field } from '../../src/ui/Field';
import { Card, Kicker, Muted, NoticeStrip, PrimaryButton, Rule, SecondaryButton } from '../../src/ui/Nocturne';
import { color, radius, space, textAlpha, type } from '../../src/theme/nocturne';
import { coachingApi } from '../../src/services';
import type { CoachingHistory } from '../../src/coaching/types';
import {
  emptyExerciseInput,
  emptyRunInput,
  parseTrainingSheetForm,
  type ExerciseFormInput,
  type FieldErrors,
  type RunPrescriptionFormInput,
} from '../../src/coaching/trainingSheetSchema';
import {
  canRemoveExercise,
  clearFieldError,
  dropExerciseErrors,
  removeExercise,
} from '../../src/coaching/trainingSheetFormState';
import { coachingTimeline } from '../../src/coaching/coachingTimeline';
import { runnerLabel } from '../../src/coaching/runnerLabel';
import { goToLogin } from '../../src/auth/goToLogin';
import { workoutReviewView } from '../../src/coaching/workoutReviewView';
import type { WorkoutReview } from '../../src/coaching/types';


export default function PersonalRunnerScreen() {
  const router = useRouter();
  const { corredorId = '', email = '', name = '', linkId = '' } = useLocalSearchParams<{
    corredorId?: string; email?: string; name?: string; linkId?: string;
  }>();
  const [push, setPush] = useState<ExerciseFormInput[]>([emptyExerciseInput()]);
  const [pull, setPull] = useState<ExerciseFormInput[]>([emptyExerciseInput()]);
  const [lower, setLower] = useState<ExerciseFormInput[]>([emptyExerciseInput()]);
  const [tuesdayRun, setTuesdayRun] = useState<RunPrescriptionFormInput>(emptyRunInput());
  const [thursdayRun, setThursdayRun] = useState<RunPrescriptionFormInput>(emptyRunInput());
  const [saturdayRun, setSaturdayRun] = useState<RunPrescriptionFormInput>(emptyRunInput());
  /**
   * Erro por campo, preenchido só quando o personal tenta publicar (STORY-017).
   * Ninguém é corrigido enquanto digita; corrigido o campo, o erro dele some.
   */
  const [errors, setErrors] = useState<FieldErrors>({});
  const [history, setHistory] = useState<CoachingHistory | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const timeline = coachingTimeline(history);
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
    const parsed = parseTrainingSheetForm({
      push, pull, lower, tuesdayRun, thursdayRun, saturdayRun,
    });
    if (!parsed.ok) {
      // Ficha incompleta não vai à rede: o personal não espera round-trip
      // para descobrir qual campo falta.
      setErrors(parsed.errors);
      setMessage(null);
      return;
    }

    setErrors({});
    setBusy(true);
    const result = await coachingApi.publishTrainingSheet(corredorId, parsed.draft);
    setBusy(false);
    if (result.status === 'unauthenticated') return goToLogin(router);
    // O aviso do topo fica com o que não pertence a campo algum: rejeição da
    // API por limite de domínio, conflito e falha de rede.
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
      <Text style={s.title}>{runnerLabel({ name: name || null, email })}</Text>
      {name !== '' && <Muted>{email}</Muted>}
      <Muted>Publicar uma nova ficha substitui a atual sem alterar o histórico já registrado.</Muted>
      {message !== null && <View style={s.block}><NoticeStrip><Text style={s.notice}>{message}</Text></NoticeStrip></View>}

      <Card style={s.block}>
        <Kicker>Nova ficha</Kicker>
        {!showForm ? (
          <PrimaryButton label="Criar Ficha" onPress={() => setShowForm(true)} />
        ) : (
          <>
            <ExerciseSection
              title="Empurrada" list="push" items={push} onChange={setPush}
              errors={errors} onErrors={setErrors}
            />
            <ExerciseSection
              title="Puxada" list="pull" items={pull} onChange={setPull}
              errors={errors} onErrors={setErrors}
            />
            <ExerciseSection
              title="Inferiores" list="lower" items={lower} onChange={setLower}
              errors={errors} onErrors={setErrors}
            />
            <View style={s.section}>
              <Text style={s.sectionTitle}>Corrida</Text>
              <RunPrescriptionSection
                title="Terça-feira"
                descriptionPlaceholder="Moderada/fartlek leve, pace e duração"
                field="tuesdayRun"
                value={tuesdayRun}
                onChange={setTuesdayRun}
                errors={errors}
                onErrors={setErrors}
              />
              <RunPrescriptionSection
                title="Quinta-feira"
                descriptionPlaceholder="Intervalado ou tempo run, pace e duração"
                field="thursdayRun"
                value={thursdayRun}
                onChange={setThursdayRun}
                errors={errors}
                onErrors={setErrors}
              />
              <RunPrescriptionSection
                title="Sábado"
                descriptionPlaceholder="Longão, pace e distância"
                field="saturdayRun"
                value={saturdayRun}
                onChange={setSaturdayRun}
                errors={errors}
                onErrors={setErrors}
              />
            </View>
            <PrimaryButton label={busy ? 'Publicando…' : 'Publicar ficha completa'} disabled={busy} onPress={() => void publish()} />
          </>
        )}
      </Card>

      <View style={s.block}>
        <Kicker>Histórico detalhado</Kicker>
        {timeline.length === 0 ? (
          <Text style={s.empty}>Nenhuma execução registrada.</Text>
        ) : timeline.map((item) => item.kind === 'strength' ? (
          <Card key={item.execution.id} style={s.historyCard}>
            <Text style={s.historyTitle}>
              {item.execution.workoutType.toUpperCase()} · {item.execution.date}
            </Text>
            {item.execution.exercises.map((exercise) => (
              <View key={exercise.exerciseId} style={s.historyExercise}>
                <Text style={s.exerciseName}>
                  {exercise.name} · {exercise.sets}x{exercise.repetitions} repetições
                </Text>
                <Text style={exercise.skipped ? s.skipped : s.load}>
                  {exercise.skipped ? 'Não realizado' : `${exercise.loadKg} kg`}
                </Text>
                {exercise.note !== null && <Text style={s.note}>{exercise.note}</Text>}
              </View>
            ))}
            <PersonalReview review={history?.reviews?.find(review => review.executionId === item.execution.id)} />
          </Card>
        ) : (
          <Card key={item.run.id} style={s.historyCard}>
            <Text style={s.historyTitle}>CORRIDA · {item.run.date}</Text>
            <Muted>
              {item.run.distanceKm} km · {item.run.durationMinutes} min · esforço {item.run.perceivedEffort}/10
            </Muted>
            <PersonalReview review={history?.reviews?.find(review => review.executionId === item.run.id)} />
          </Card>
        ))}
      </View>

      <View style={s.block}><SecondaryButton label="Encerrar vínculo" onPress={() => void endLink()} /></View>
    </ScrollView>
  );
}

function PersonalReview({ review }: { review: WorkoutReview | undefined }) {
  if (review === undefined) return null;
  const view = workoutReviewView(review);
  return (
    <View style={s.review}>
      <Text style={s.historyTitle}>{view.title}</Text>
      {view.action !== null && <Text style={s.load}>{view.action}</Text>}
      {view.explanation !== null && <Muted>{view.explanation}</Muted>}
      {view.explanationUnavailable && <Muted>Explicação indisponível.</Muted>}
      <Text style={s.note}>{review.understoodAt === null ? 'Leitura não confirmada' : 'Leitura confirmada'}</Text>
      <Text style={s.note}>{view.coherence}</Text>
    </View>
  );
}

function ExerciseSection({
  title, list, items, onChange, errors, onErrors,
}: {
  title: string;
  list: 'push' | 'pull' | 'lower';
  items: ExerciseFormInput[];
  onChange: (items: ExerciseFormInput[]) => void;
  errors: FieldErrors;
  onErrors: (errors: FieldErrors) => void;
}) {
  function update(index: number, field: keyof ExerciseFormInput, value: string) {
    onChange(items.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));
    onErrors(clearFieldError(errors, `${list}.${index}.${field}`));
  }

  function remove(index: number) {
    onChange(removeExercise(items, index));
    onErrors(dropExerciseErrors(errors, list, index));
  }

  const removable = canRemoveExercise(items);

  return (
    <View style={s.section}>
      <Rule />
      <Text style={s.sectionTitle}>{title}</Text>
      {items.map((item, index) => (
        <View key={index} style={s.exerciseDraft}>
          <Field
            label="Exercício"
            value={item.name}
            onChangeText={(value) => update(index, 'name', value)}
            placeholder="Agachamento livre"
            error={errors[`${list}.${index}.name`]}
          />
          <View style={s.row}>
            <View style={s.half}>
              <Field
                label="Séries" value={item.sets}
                onChangeText={(value) => update(index, 'sets', value)}
                keyboardType="numeric" placeholder="4"
                error={errors[`${list}.${index}.sets`]}
              />
            </View>
            <View style={s.half}>
              <Field
                label="Repetições" value={item.repetitions}
                onChangeText={(value) => update(index, 'repetitions', value)}
                keyboardType="numeric" placeholder="6"
                error={errors[`${list}.${index}.repetitions`]}
              />
            </View>
          </View>
          <Field
            label="Tempo em segundos (opcional)"
            value={item.durationSeconds}
            onChangeText={(value) => update(index, 'durationSeconds', value)}
            keyboardType="numeric"
            placeholder="40"
            error={errors[`${list}.${index}.durationSeconds`]}
          />
          <Field
            label="Observação (opcional)"
            value={item.observation}
            onChangeText={(value) => update(index, 'observation', value)}
            multiline={2}
            placeholder="Não travar o cotovelo"
            error={errors[`${list}.${index}.observation`]}
          />
          {removable && (
            <Pressable style={s.remove} onPress={() => remove(index)}>
              <Text style={s.removeText}>Remover exercício</Text>
            </Pressable>
          )}
        </View>
      ))}
      <Pressable style={s.add} onPress={() => onChange([...items, emptyExerciseInput()])}>
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
  title, field, descriptionPlaceholder, value, onChange, errors, onErrors,
}: {
  title: string;
  field: 'tuesdayRun' | 'thursdayRun' | 'saturdayRun';
  descriptionPlaceholder: string;
  value: RunPrescriptionFormInput;
  onChange: (value: RunPrescriptionFormInput) => void;
  errors: FieldErrors;
  onErrors: (errors: FieldErrors) => void;
}) {
  function update(name: keyof RunPrescriptionFormInput, text: string) {
    onChange({ ...value, [name]: text });
    onErrors(clearFieldError(errors, `${field}.${name}`));
  }

  function numeric(name: keyof RunPrescriptionFormInput, label: string, placeholder: string) {
    return (
      <View style={s.third}>
        <Field
          label={label}
          value={value[name]}
          onChangeText={(text) => update(name, text)}
          keyboardType="numeric"
          placeholder={placeholder}
          error={errors[`${field}.${name}`]}
        />
      </View>
    );
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
        error={errors[`${field}.description`]}
      />
      <Field
        label="Quilômetros (opcional)"
        value={value.distanceKm}
        onChangeText={(text) => update('distanceKm', text)}
        keyboardType="decimal-pad"
        placeholder="5,4"
        error={errors[`${field}.distanceKm`]}
      />
      <View style={s.row}>
        {numeric('durationMin', 'Min. (min)', '45')}
        {numeric('durationMax', 'Min. (máx.)', '55')}
      </View>
      <View style={s.row}>
        {numeric('effortMin', 'Esforço (min)', '5')}
        {numeric('effortMax', 'Esforço (máx.)', '6')}
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
  remove: { alignSelf: 'flex-start', paddingVertical: space[2], marginBottom: space[4] },
  removeText: { color: color.danger[300], fontSize: type.meta },
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
  review: { borderTopWidth: 1, borderTopColor: textAlpha.rule, paddingTop: space[4], marginTop: space[4] },
});
