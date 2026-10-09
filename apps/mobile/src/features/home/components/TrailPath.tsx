import type { TrailUnit } from '@libras/contracts';
import { StyleSheet, View, type DimensionValue } from 'react-native';

import { spacing } from '@/shared/theme';
import { AppText } from '@/shared/ui';

import { completedLessons, lessonsLabel } from './homeView';
import { TrailNode } from './TrailNode';

type TrailPathProps = {
  units: readonly TrailUnit[];
  onOpenLesson: (lessonId: string) => void;
};

// Left margins that zigzag the nodes like the design's winding path. They are
// percentages of the trail width so the widest node still fits on small phones.
const pathMargins: readonly DimensionValue[] = ['2%', '30%', '54%', '30%'];

export function TrailPath({ units, onOpenLesson }: TrailPathProps) {
  return (
    <View style={styles.trail}>
      {units.map((unit, unitIndex) => (
        <View key={unit.id} style={styles.unit}>
          <View style={styles.unitHeader}>
            <AppText variant="kicker">{`Unidade ${unitIndex + 1}`}</AppText>
            <AppText variant="subtitle" accessibilityRole="header">
              {unit.title}
            </AppText>
            <AppText variant="caption">
              {`${completedLessons(unit)} de ${lessonsLabel(unit.lessons.length)}`}
            </AppText>
          </View>
          {unit.lessons.map((lesson, index) => (
            <View key={lesson.id} style={{ marginLeft: pathMargins[index % pathMargins.length] }}>
              <TrailNode
                lesson={lesson}
                onPress={lesson.status === 'available' ? () => onOpenLesson(lesson.id) : undefined}
              />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  trail: {
    gap: spacing['5xl'],
  },
  unit: {
    gap: spacing.md,
  },
  unitHeader: {
    gap: spacing['3xs'],
  },
});
