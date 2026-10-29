import type { TrailLesson } from '@libras/contracts';
import { StyleSheet, View, type DimensionValue } from 'react-native';

import { spacing } from '@/shared/theme';

import { TrailNode } from './TrailNode';

type TrailPathProps = {
  lessons: readonly TrailLesson[];
  onOpenLesson: (lessonId: string) => void;
};

// Left margins that zigzag the nodes like the design's winding path. They are
// percentages of the trail width so the widest node still fits on small phones.
const pathMargins: readonly DimensionValue[] = ['2%', '30%', '54%', '30%'];

// The lessons of one module.
export function TrailPath({ lessons, onOpenLesson }: TrailPathProps) {
  return (
    <View style={styles.trail}>
      {lessons.map((lesson, index) => (
        <View key={lesson.id} style={{ marginLeft: pathMargins[index % pathMargins.length] }}>
          <TrailNode
            lesson={lesson}
            number={index + 1}
            onPress={lesson.status === 'available' ? () => onOpenLesson(lesson.id) : undefined}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  trail: {
    gap: spacing.md,
  },
});
