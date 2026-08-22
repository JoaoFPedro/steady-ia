import { Pressable, StyleSheet, Text, View } from 'react-native';
import { color, radius, space, textAlpha, type } from '../theme/nocturne';

/**
 * `Choice` do sistema é single-select — dias preferidos e dores recorrentes
 * são arrays no `TrainingPlanRequest` (`plano-treino-input-schema.md`), por
 * isso este irmão local em vez de sobrecarregar `Choice` com um modo duplo.
 * Mesmo estilo de pílula, alternando pertencimento ao array.
 */
export function MultiChoice<T extends string>({
  label,
  options,
  values,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  values: T[];
  onChange: (values: T[]) => void;
}) {
  function toggle(value: T) {
    onChange(values.includes(value) ? values.filter((v) => v !== value) : [...values, value]);
  }

  return (
    <View style={s.group}>
      <Text style={s.label}>{label}</Text>
      <View style={s.options}>
        {options.map((option) => {
          const selected = values.includes(option.value);
          return (
            <Pressable
              key={option.value}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected }}
              onPress={() => toggle(option.value)}
              style={[s.option, selected && s.optionSelected]}
            >
              <Text style={[s.optionLabel, selected && s.optionLabelSelected]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  group: { marginBottom: space[6] },
  label: { fontSize: type.label, marginBottom: space[2], color: textAlpha.label },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  option: {
    paddingVertical: space[3],
    paddingHorizontal: space[4],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: textAlpha.divider,
    backgroundColor: color.surface,
  },
  optionSelected: { borderColor: color.accent },
  optionLabel: { fontSize: type.meta, color: textAlpha.muted },
  optionLabelSelected: { color: color.accent },
});
