import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Field } from '../ui/Field';
import { Choice } from '../ui/Choice';
import { Card, Kicker, Muted, PrimaryButton } from '../ui/Nocturne';
import { color, radius, space, textAlpha, type } from '../theme/nocturne';
import { MultiChoice } from './MultiChoice';
import {
  DERIVED_FIELDS,
  EQUIPMENT_ACCESS,
  PAIN_AREAS,
  RACE_DISTANCES,
  TRAINING_DAYS_PER_WEEK,
  WEEKDAYS,
  type EquipmentAccess,
  type PainArea,
  type RaceDistance,
  type TrainingDaysPerWeek,
  type Weekday,
} from './trainingPlanRequest';

const TOTAL_WEEKS_LABEL = '24 semanas';

/**
 * Formulário de solicitação de plano — os campos espelham
 * `.discovery/referencias/plano-treino-input-schema.md` (`TrainingPlanRequest`).
 * Layout segue o template em `tela.html` (turno 2, artboard 2a).
 *
 * Nenhum valor daqui alimenta o resultado: o DISC-002 exclui geração
 * dinâmica nesta versão — o plano gerado é sempre o mesmo documento de
 * referência. O formulário existe para a experiência ser honesta sobre o
 * fluxo real (pedir dados → gerar), por isso o botão anuncia sempre
 * "24 semanas" — o que o documento de fato tem — em vez de um número
 * calculado da data que ainda não é usado para nada.
 */
export type GeneratePlanInput = { raceDistance: RaceDistance; raceDate: string };

export function PlanningForm({ onGenerate }: { onGenerate: (input: GeneratePlanInput) => void }) {
  const [raceDistance, setRaceDistance] = useState<RaceDistance | null>(null);
  const [firstTime, setFirstTime] = useState(false);
  const [raceDate, setRaceDate] = useState('');
  const [longestRecentRunKm, setLongestRecentRunKm] = useState('');
  const [weeklyRunningDays, setWeeklyRunningDays] = useState('');
  const [referenceDistanceKm, setReferenceDistanceKm] = useState('');
  const [referenceDuration, setReferenceDuration] = useState('');
  const [trainingDaysPerWeek, setTrainingDaysPerWeek] = useState<TrainingDaysPerWeek | null>(null);
  const [preferredWeekdays, setPreferredWeekdays] = useState<Weekday[]>([]);
  const [strengthMinutes, setStrengthMinutes] = useState('');
  const [equipment, setEquipment] = useState<EquipmentAccess | null>(null);
  const [painAreas, setPainAreas] = useState<PainArea[]>([]);
  const [priorInjuries, setPriorInjuries] = useState('');

  const complete =
    raceDistance !== null &&
    raceDate.trim() !== '' &&
    longestRecentRunKm.trim() !== '' &&
    trainingDaysPerWeek !== null;

  return (
    <View>
      <Text style={s.title}>Montar meu plano</Text>
      <Muted>Cinco blocos. O resto o app calcula.</Muted>

      <View style={s.section}>
        <Kicker>Prova-alvo</Kicker>
        <View style={s.sectionBody}>
          <Choice
            label="Distância"
            options={RACE_DISTANCES}
            value={raceDistance}
            onChange={setRaceDistance}
          />
          <FirstTimeToggle checked={firstTime} onToggle={() => setFirstTime((v) => !v)} />
          <Field
            label="Data da prova"
            value={raceDate}
            onChangeText={setRaceDate}
            placeholder="AAAA-MM-DD"
          />
        </View>
      </View>

      <View style={s.section}>
        <Kicker>Base atual</Kicker>
        <View style={s.sectionBody}>
          <View style={s.row}>
            <View style={s.rowItem}>
              <Field
                label="Maior corrida recente (km)"
                value={longestRecentRunKm}
                onChangeText={setLongestRecentRunKm}
                keyboardType="numeric"
                placeholder="21"
              />
            </View>
            <View style={s.rowItem}>
              <Field
                label="Corridas por semana hoje"
                value={weeklyRunningDays}
                onChangeText={setWeeklyRunningDays}
                keyboardType="numeric"
                placeholder="3"
              />
            </View>
          </View>

          {/* <Text style={s.hint}>
            Tempo de referência — uma prova ou treino cronometrado recente. Vira suas zonas de
            ritmo.
          </Text> */}
          <View style={s.row}>
            {/* <View style={s.rowItem}>
              <Field
                label="Distância (km)"
                value={referenceDistanceKm}
                onChangeText={setReferenceDistanceKm}
                keyboardType="decimal-pad"
                placeholder="21.1"
              />
            </View> */}
            {/* <View style={s.rowItem}>
              <Field
                label="Duração (HH:MM:SS)"
                value={referenceDuration}
                onChangeText={setReferenceDuration}
                placeholder="01:52:00"
              />
            </View> */}
          </View>
        </View>
      </View>

      <View style={s.section}>
        <Kicker>Disponibilidade</Kicker>
        <View style={s.sectionBody}>
          <Choice
            label="Dias de treino por semana"
            options={TRAINING_DAYS_PER_WEEK}
            value={trainingDaysPerWeek}
            onChange={setTrainingDaysPerWeek}
          />
          {/* <MultiChoice
            label="Dias preferidos (opcional)"
            options={WEEKDAYS}
            values={preferredWeekdays}
            onChange={setPreferredWeekdays}
          /> */}
          {/* <Field
            label="Sessão de força (minutos)"
            value={strengthMinutes}
            onChangeText={setStrengthMinutes}
            keyboardType="numeric"
            placeholder="50"
          /> */}
        </View>
      </View>

      {/* <View style={s.section}>
        <Kicker>Equipamento</Kicker>
        <View style={s.sectionBody}>
          {EQUIPMENT_ACCESS.map((option) => {
            const selected = option.value === equipment;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => setEquipment(option.value)}
                style={[s.equipRow, selected && s.equipRowSelected]}
              >
                <View style={[s.equipDot, selected && s.equipDotSelected]} />
                <View style={s.equipTextGroup}>
                  <Text style={s.equipLabel}>{option.label}</Text>
                  <Text style={s.equipSub}>{option.sub}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View> */}

      <View style={s.section}>
        <Kicker>
          Histórico de saúde <Text style={s.optionalMark}>· opcional</Text>
        </Kicker>
        <View style={s.sectionBody}>
          <MultiChoice
            label="Dores recorrentes"
            options={PAIN_AREAS}
            values={painAreas}
            onChange={setPainAreas}
          />
          <Field
            label="Lesões anteriores"
            value={priorInjuries}
            onChangeText={setPriorInjuries}
            placeholder="Fascite plantar em 2024, tratada. Nada desde então."
            multiline={3}
          />
        </View>
      </View>

      <Card style={s.derived}>
        <Kicker>Calculado a partir disso</Kicker>
        <View style={s.derivedList}>
          {DERIVED_FIELDS.map((item) => (
            <View key={item} style={s.derivedItem}>
              <View style={s.derivedDot} />
              <Text style={s.derivedText}>{item}</Text>
            </View>
          ))}
        </View>
      </Card>

      <View style={s.submit}>
        <PrimaryButton
          label={`Gerar plano de ${TOTAL_WEEKS_LABEL}`}
          disabled={!complete}
          onPress={() => onGenerate({ raceDistance: raceDistance!, raceDate })}
        />
      </View>
    </View>
  );
}

function FirstTimeToggle({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={onToggle}
      style={s.toggleRow}
    >
      <View style={[s.toggleBox, checked && s.toggleBoxChecked]}>
        {checked && <Text style={s.toggleMark}>✓</Text>}
      </View>
      <View style={s.toggleTextGroup}>
        <Text style={s.toggleLabel}>Primeira vez nesta distância</Text>
        <Text style={s.toggleHint}>Progressão mais conservadora</Text>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  title: { color: color.text, fontSize: type.section, fontWeight: '500', marginTop: space[2] },
  section: { marginTop: space[8] },
  sectionBody: { marginTop: space[4] },
  row: { flexDirection: 'row', gap: space[3] },
  rowItem: { flex: 1 },
  hint: { fontSize: type.label, color: textAlpha.faint, marginTop: space[2], marginBottom: space[3] },
  optionalMark: { color: textAlpha.ghost, fontWeight: '400', textTransform: 'none', letterSpacing: 0 },

  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: space[3], marginBottom: space[6] },
  toggleBox: {
    width: 20,
    height: 20,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: textAlpha.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBoxChecked: { borderColor: color.accent },
  toggleMark: { color: color.accent, fontSize: 12, fontWeight: '700' },
  toggleTextGroup: { flex: 1 },
  toggleLabel: { fontSize: type.bodySm, color: color.text },
  toggleHint: { fontSize: type.label, color: textAlpha.faint, marginTop: 2 },

  equipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[3],
    padding: space[4],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: textAlpha.divider,
    backgroundColor: color.surface,
    marginBottom: space[3],
  },
  equipRowSelected: { borderColor: color.accent },
  equipDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: textAlpha.divider,
    marginTop: 3,
  },
  equipDotSelected: { borderColor: color.accent, backgroundColor: color.accent },
  equipTextGroup: { flex: 1 },
  equipLabel: { fontSize: type.body, color: color.text },
  equipSub: { fontSize: type.label, color: textAlpha.faint, marginTop: 2, lineHeight: 15 },

  derived: { marginTop: space[8] },
  derivedList: { gap: space[3], marginTop: space[4] },
  derivedItem: { flexDirection: 'row', gap: space[3], alignItems: 'flex-start' },
  derivedDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: color.accent, marginTop: 6 },
  derivedText: { flex: 1, fontSize: type.meta, lineHeight: 18, color: textAlpha.muted },

  submit: { marginTop: space[8] },
});
