import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { color, elevation, type } from '../theme/nocturne';

/**
 * Foto da conta Google, com a inicial como base.
 *
 * A inicial não é um "estado de erro": ela é o que se desenha **primeiro**, e a
 * foto entra por cima quando (e se) chegar. O avatar é gatilho do menu, então
 * precisa ocupar sua área desde o primeiro frame — sem rede, com a conta sem
 * foto, ou com a URL falhando, o comportamento é o mesmo.
 */
export function Avatar({
  initial,
  photoUrl,
  size,
}: {
  initial: string;
  photoUrl: string | null;
  size: number;
}) {
  const [falhou, setFalhou] = useState(false);
  const box = { width: size, height: size, borderRadius: size / 2 };

  return (
    <View style={[styles.base, box]}>
      <Text style={[styles.initial, { fontSize: size * 0.42 }]}>{initial}</Text>

      {photoUrl !== null && !falhou && (
        <Image
          source={{ uri: photoUrl }}
          style={[styles.photo, box]}
          onError={() => setFalhou(true)}
          accessibilityIgnoresInvertColors
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: color.accentRamp[900],
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...elevation.accentOutline,
  },
  initial: {
    color: color.accentRamp[300],
    fontWeight: '500',
  },
  photo: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
