import type { TrailUnit } from '@libras/contracts';
import { StyleSheet, View, type DimensionValue } from 'react-native';

import { spacing } from '@/shared/theme';

import { TrailNode } from './TrailNode';

type TrailPathProps = {
  units: readonly TrailUnit[];
  onStartLesson?: (() => void) | undefined;
};

// Left margins that zigzag the nodes like the design's winding path. They are
// percentages of the trail width so the widest node still fits on small phones.
const pathMargins: readonly DimensionValue[] = ['2%', '30%', '54%', '30%'];

export function TrailPath({ units, onStartLesson }: TrailPathProps) {
  return (
    <View style={styles.path}>
      {units.map((unit, index) => (
        <View key={unit.id} style={{ marginLeft: pathMargins[index % pathMargins.length] }}>
          <TrailNode unit={unit} onPress={unit.status === 'current' ? onStartLesson : undefined} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  path: {
    gap: spacing.md,
  },
});
