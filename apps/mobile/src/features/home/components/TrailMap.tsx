import type { TrailLesson } from '@libras/contracts';
import { Fragment, useRef } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg from 'react-native-svg';

import { trailColors } from '@/shared/theme';
import { SkyGradient } from '@/shared/ui';

import { TrailBalloon } from './TrailBalloon';
import { initialScrollY, mapLayout } from './trailMapLayout';
import { TrailNode, TrailNodeLabel } from './TrailNode';
import { TrailRoad } from './TrailRoad';
import { TrailScenery } from './TrailScenery';

type TrailMapProps = {
  lessons: readonly TrailLesson[];
  onOpenLesson: (lessonId: string) => void;
};

// Where the sky turns into meadow, in points from the top of the map.
const skyHeight = 230;

// The lessons of a module along a winding road over a countryside, as in
// docs/design/trilha-modulo-spec.md. Everything is placed from `mapLayout`, so any number
// of lessons works.
export function TrailMap({ lessons, onOpenLesson }: TrailMapProps) {
  const { width } = useWindowDimensions();
  const layout = mapLayout(lessons, width);
  const current = layout.currentIndex === null ? null : lessons[layout.currentIndex];
  const currentPoint = layout.currentIndex === null ? null : layout.points[layout.currentIndex];

  // The lesson to do now is brought into view once, when the screen opens; later reloads
  // of the home keep the learner's scroll. Both the visible height and the content must be
  // measured first.
  const scrollRef = useRef<ScrollView>(null);
  const viewportHeight = useRef<number | null>(null);
  const contentReady = useRef(false);
  const scrolled = useRef(false);

  function scrollToCurrent() {
    if (scrolled.current || viewportHeight.current === null || !contentReady.current) return;
    scrolled.current = true;
    const y = initialScrollY(layout, lessons, viewportHeight.current);
    if (y > 0) scrollRef.current?.scrollTo({ y, animated: false });
  }

  return (
    <ScrollView
      ref={scrollRef}
      onLayout={(event) => {
        viewportHeight.current = event.nativeEvent.layout.height;
        scrollToCurrent();
      }}
      onContentSizeChange={() => {
        contentReady.current = true;
        scrollToCurrent();
      }}
      showsVerticalScrollIndicator={false}
      style={styles.scroll}
    >
      <View style={{ width, height: layout.height }}>
        <Svg
          width={width}
          height={layout.height}
          style={StyleSheet.absoluteFill}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <SkyGradient id="trail-sky" width={width} height={layout.height} skyHeight={skyHeight} />
          <TrailScenery width={width} tiles={layout.sceneryTiles} />
          <TrailRoad road={layout.road} done={layout.roadDone} />
        </Svg>
        {lessons.map((lesson, index) => {
          const center = layout.points[index];
          if (!center) return null;
          return (
            <Fragment key={lesson.id}>
              <TrailNodeLabel lesson={lesson} number={index + 1} center={center} />
              <TrailNode
                lesson={lesson}
                number={index + 1}
                center={center}
                onPress={() => onOpenLesson(lesson.id)}
              />
            </Fragment>
          );
        })}
        {current && currentPoint && (
          <TrailBalloon
            center={currentPoint}
            lessonTitle={current.title}
            onPress={() => onOpenLesson(current.id)}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Shown past the ends of the map when the list bounces, and under a short module.
  scroll: {
    flex: 1,
    backgroundColor: trailColors.meadowEnd,
  },
});
