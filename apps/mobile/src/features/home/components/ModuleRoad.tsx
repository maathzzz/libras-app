import type { Trail } from '@libras/contracts';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg from 'react-native-svg';

import { sizes, spacing } from '@/shared/theme';
import { MapLabel } from '@/shared/ui';

import { moduleRoadPaths, reachedUnitIndex } from './moduleRoadLayout';
import { ModuleStation } from './ModuleStation';
import { TrailRoad } from './TrailRoad';

type ModuleRoadProps = {
  trail: Trail;
  onOpenModule: (unitId: string) => void;
};

const railCenter = sizes.moduleRail / 2;

// The modules of the trail as stops on the module map's road: green up to the module the
// learner is in, dotted after it. The road is drawn once every row has been measured.
export function ModuleRoad({ trail, onOpenModule }: ModuleRoadProps) {
  const [centers, setCenters] = useState<Record<number, number>>({});
  const [height, setHeight] = useState(0);

  const measured = trail.units
    .map((_, index) => centers[index])
    .filter((center): center is number => center !== undefined);
  const paths =
    measured.length === trail.units.length && height > 0
      ? moduleRoadPaths(measured, railCenter, reachedUnitIndex(trail.units))
      : null;

  function measureRow(index: number, center: number) {
    setCenters((previous) =>
      previous[index] === center ? previous : { ...previous, [index]: center },
    );
  }

  return (
    <View style={styles.section}>
      <MapLabel text="Módulos" header />
      <View
        style={styles.stations}
        onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
      >
        {paths && paths.road !== '' && (
          <Svg
            width={sizes.moduleRail}
            height={height}
            style={styles.road}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <TrailRoad road={paths.road} done={paths.done} />
          </Svg>
        )}
        {trail.units.map((unit, index) => (
          <View
            key={unit.id}
            onLayout={(event) => {
              const { y, height: rowHeight } = event.nativeEvent.layout;
              measureRow(index, y + rowHeight / 2);
            }}
          >
            <ModuleStation unit={unit} index={index} onPress={() => onOpenModule(unit.id)} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.xl,
  },
  stations: {
    gap: spacing['5xl'],
  },
  road: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
