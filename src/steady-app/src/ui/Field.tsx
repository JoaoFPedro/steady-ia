import { StyleSheet, Text, TextInput, View } from 'react-native';
import { color, radius, space, textAlpha, type } from '../theme/nocturne';

/** Campo de texto do sistema: rótulo pequeno acima, superfície com borda fina. */
export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
}) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        style={s.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={textAlpha.ghost}
        keyboardType={keyboardType}
        selectionColor={color.accent}
      />
    </View>
  );
}

const s = StyleSheet.create({
  field: { marginBottom: space[6] },
  label: {
    fontSize: type.label,
    marginBottom: space[2],
    color: textAlpha.label,
  },
  input: {
    minHeight: 44,
    paddingHorizontal: space[4],
    fontSize: type.bodySm,
    color: color.text,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: textAlpha.divider,
    borderRadius: radius.md,
  },
});
