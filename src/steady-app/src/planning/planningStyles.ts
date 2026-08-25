import { StyleSheet } from 'react-native';
import { color, radius, space, textAlpha, type } from '../theme/nocturne';

/**
 * Estilos que mais de uma seção do documento do plano usa.
 *
 * Existem separados porque `PlanningDocument.tsx` passou de 300 linhas (FF-003)
 * e a seção Semana saiu para um módulo próprio (STORY-012) — sem isto, os dois
 * arquivos manteriam cópias do mesmo `kick` e divergiriam no primeiro ajuste.
 */
export const shared = StyleSheet.create({
  kick: {
    fontSize: type.kicker,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: color.accentRamp[400],
    marginTop: space[2],
  },
  paragraph: { fontSize: type.bodySm, lineHeight: 20, color: color.text, marginTop: space[3] },
  spacedTop: { marginTop: space[3] },

  callout: {
    marginTop: space[4],
    padding: space[4],
    borderRadius: radius.md,
    backgroundColor: color.accentRamp[900],
  },
  calloutText: { fontSize: type.bodySm, lineHeight: 19, color: color.accentRamp[300] },

  exerciseRow: { paddingVertical: space[2], borderBottomWidth: 1, borderBottomColor: textAlpha.rule },
  exerciseName: { fontSize: type.bodySm, color: color.text, flexShrink: 1 },
  exerciseSeries: { fontSize: type.label, fontFamily: 'monospace', color: textAlpha.faint, marginTop: 2 },
});
