import { StyleSheet, View } from 'react-native';
import Body from 'react-native-body-highlighter';
import { color, space } from '../theme/nocturne';
import { MUSCLE_REGION_LABELS, type MuscleRegion } from '../training/muscleRegions';
import { bodyParts } from '../training/bodyParts';

const SIDES = ['front', 'back'] as const;

/**
 * Corpo humano de frente e de costas com as regiões trabalhadas em destaque
 * (STORY-025). O accent é o destaque; o resto fica num neutro do tema. Sem
 * níveis de intensidade — só "trabalhado" ou não.
 *
 * O desenho é SVG e não diz nada a um leitor de tela: o texto acessível lista
 * os músculos no contêiner.
 */
export function BodyMap({ regions }: { regions: readonly MuscleRegion[] }) {
  const data = bodyParts(regions);
  const label = regions.length === 0
    ? 'Nenhum músculo destacado'
    : `Músculos trabalhados: ${regions.map((region) => MUSCLE_REGION_LABELS[region]).join(', ')}`;

  return (
    <View accessible accessibilityLabel={label} style={styles.row}>
      {SIDES.map((side) => (
        <Body
          key={side}
          side={side}
          gender="male"
          data={data}
          colors={[color.accent]}
          scale={0.6}
          border="none"
          defaultFill={color.neutral[800]}
          defaultStroke={color.neutral[700]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: space[4] },
});
