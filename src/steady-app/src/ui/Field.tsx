import { StyleSheet, Text, TextInput, View } from 'react-native';
import { color, radius, space, textAlpha, type } from '../theme/nocturne';

/** Campo de texto do sistema: rótulo pequeno acima, superfície com borda fina. */
export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  multiline,
  error,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
  /** Número de linhas do textarea. Ausente = campo de uma linha só. */
  multiline?: number;
  /**
   * Mensagem de invalidez. Presente, o campo se realça em `danger` e a
   * mensagem aparece logo abaixo — o erro mora no campo, não no topo da tela
   * (STORY-017, ADR-017).
   */
  error?: string;
}) {
  const invalid = error !== undefined;
  return (
    <View style={s.field}>
      <Text style={[s.label, invalid && s.labelInvalid]}>{label}</Text>
      <TextInput
        style={[
          s.input,
          multiline !== undefined && s.inputMultiline,
          invalid && s.inputInvalid,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={textAlpha.ghost}
        keyboardType={keyboardType}
        selectionColor={color.accent}
        multiline={multiline !== undefined}
        numberOfLines={multiline}
        textAlignVertical={multiline !== undefined ? 'top' : 'center'}
      />
      {invalid && <Text style={s.error}>{error}</Text>}
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
  inputMultiline: {
    minHeight: 76,
    paddingTop: space[3],
    paddingBottom: space[3],
  },
  labelInvalid: { color: color.danger[300] },
  inputInvalid: {
    borderColor: color.danger[500],
    backgroundColor: color.danger[900],
  },
  error: {
    color: color.danger[300],
    fontSize: type.label,
    marginTop: space[2],
  },
});
