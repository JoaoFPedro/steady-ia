import { Pressable, StyleSheet, Text, View } from 'react-native';
import { color, radius, space, textAlpha, type } from '../theme/nocturne';

/**
 * Escolha entre poucas opções — o controle segmentado do sistema.
 * A opção ativa é marcada por contorno accent, nunca por preenchimento.
 */
export function Choice<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
}) {
  return (
    <View style={s.group}>
      <Text style={s.label}>{label}</Text>
      <View style={s.options}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
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
