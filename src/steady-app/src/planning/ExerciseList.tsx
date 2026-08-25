import { Text, View } from 'react-native';
import type { Exercise } from './trainingPlanDocument';
import { shared } from './planningStyles';

/** Lista de exercícios — usada pela aba Semana e pela Mobilidade. */
export function ExerciseList({ items, spaced }: { items: Exercise[]; spaced?: boolean }) {
  return (
    <View style={spaced ? shared.spacedTop : undefined}>
      {items.map((item) => (
        <View key={item.name} style={shared.exerciseRow}>
          <Text style={shared.exerciseName}>{item.name}</Text>
          {item.series !== '' && <Text style={shared.exerciseSeries}>{item.series}</Text>}
        </View>
      ))}
    </View>
  );
}
