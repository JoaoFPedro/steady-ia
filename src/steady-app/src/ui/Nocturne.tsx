import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';
import { color, elevation, radius, space, textAlpha, type } from '../theme/nocturne';

/**
 * Peças do Nocturne em React Native.
 *
 * Regras do sistema que estas peças carregam, para não serem reinventadas tela a tela:
 * o accent é linha e brilho (nunca preenchimento amplo), o botão primário é
 * contorno, e elevação em fundo escuro é aresta fina — não sombra empilhada.
 */

/** Rótulo curto em caixa alta sobre um bloco — o `.card-kicker` do sistema. */
export function Kicker({ children, accent }: { children: ReactNode; accent?: boolean }) {
  return <Text style={[styles.kicker, accent && styles.kickerAccent]}>{children}</Text>;
}

/**
 * Etiqueta curta e tingida — o `.tag.tag-accent` do sistema. Carrega um dado
 * que qualifica o bloco ao lado (quantas semanas faltam), nunca uma ação.
 */
export function Tag({ children }: { children: ReactNode }) {
  return (
    <View style={styles.tag}>
      <Text style={styles.tagText}>{children}</Text>
    </View>
  );
}

/** Superfície padrão de conteúdo. */
export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/**
 * Card de destaque com o gradiente do design (accent-900 → surface).
 * Sem biblioteca de gradiente: em fundo escuro, o accent-900 chapado dá a mesma
 * presença sem adicionar dependência nativa ao MVP.
 */
export function HeroCard({ children }: { children: ReactNode }) {
  return <View style={styles.hero}>{children}</View>;
}

/**
 * A faixa que "nomeia o que mudou e por quê" — contorno accent, sem preenchimento.
 * No design original anuncia o plano recalculado; aqui carrega a sugestão de
 * sobrecarga e o aviso de registros pendentes.
 */
export function NoticeStrip({ children }: { children: ReactNode }) {
  return <View style={styles.notice}>{children}</View>;
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
        disabled && styles.buttonDisabled,
      ]}
    >
      <Text style={styles.buttonLabel}>{label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        styles.buttonSecondary,
        pressed && styles.buttonSecondaryPressed,
        disabled && styles.buttonDisabled,
      ]}
    >
      <Text style={styles.buttonSecondaryLabel}>{label}</Text>
    </Pressable>
  );
}

/** Régua que some nas pontas — assinatura do sistema. Aqui, a versão sólida e curta. */
export function Rule() {
  return <View style={styles.rule} />;
}

export function Muted({ children }: { children: ReactNode }) {
  return <Text style={styles.muted}>{children}</Text>;
}

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bg,
    paddingHorizontal: space[8],
  },
  kicker: {
    fontSize: type.kicker,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: textAlpha.faint,
  },
  kickerAccent: {
    color: color.accentRamp[400],
  },
  tag: {
    alignSelf: 'flex-start',
    backgroundColor: color.accentRamp[800],
    borderRadius: radius.md * 0.75,
    paddingVertical: space[1],
    paddingHorizontal: space[3],
  },
  tagText: {
    fontSize: type.label,
    letterSpacing: 0.2,
    color: color.accentRamp[100],
  },
  card: {
    backgroundColor: color.surface,
    borderRadius: radius.lg,
    padding: space[6],
    ...elevation.sm,
  },
  hero: {
    backgroundColor: color.accentRamp[900],
    borderRadius: radius.xl,
    padding: space[8],
    ...elevation.sm,
  },
  notice: {
    backgroundColor: color.surface,
    borderRadius: radius.lg,
    paddingVertical: space[4],
    paddingHorizontal: space[6],
    ...elevation.accentOutline,
  },
  button: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.accent,
    paddingHorizontal: space[6],
  },
  buttonPressed: {
    backgroundColor: color.accentRamp[900],
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonLabel: {
    color: color.accent,
    fontSize: type.body,
    fontWeight: '500',
  },
  buttonSecondary: {
    borderColor: textAlpha.divider,
  },
  buttonSecondaryPressed: {
    backgroundColor: color.neutral[900],
  },
  buttonSecondaryLabel: {
    color: color.text,
    fontSize: type.body,
    fontWeight: '500',
  },
  rule: {
    height: 1,
    backgroundColor: textAlpha.divider,
    marginVertical: space[6],
  },
  muted: {
    color: textAlpha.muted,
    fontSize: type.meta,
    lineHeight: 19,
  },
  title: {
    color: color.text,
    fontSize: type.section,
    fontWeight: '500',
  },
});
