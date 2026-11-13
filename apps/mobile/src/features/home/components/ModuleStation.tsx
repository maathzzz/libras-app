import type { TrailUnit } from '@libras/contracts';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  colors,
  depth,
  pressedOffset,
  radius,
  raised,
  sizes,
  spacing,
  type ColorToken,
} from '@/shared/theme';
import { AppText, Medal, PulseRing, type IconName, type MedalTone } from '@/shared/ui';

import { percentLabel, unitKicker, unitProgress, unitStatus, type UnitStatus } from './homeView';
import { LessonSegments } from './LessonSegments';

type ModuleStationProps = {
  unit: TrailUnit;
  index: number;
  onPress: () => void;
};

type StationLook = {
  medal: MedalTone;
  icon: IconName;
  edge: string;
  kickerColor: ColorToken;
  titleColor: ColorToken;
};

// Same states as the nodes of the module map.
const looks: Record<UnitStatus, StationLook> = {
  completed: {
    medal: 'success',
    icon: 'check',
    edge: colors.successSoftEdge,
    kickerColor: 'successText',
    titleColor: 'text',
  },
  current: {
    medal: 'accent',
    icon: 'play',
    edge: colors.accentSoftEdge,
    kickerColor: 'accentDark',
    titleColor: 'text',
  },
  locked: {
    medal: 'locked',
    icon: 'locked',
    edge: colors.border,
    kickerColor: 'textMuted',
    titleColor: 'lockedText',
  },
};

const statusLabels: Record<UnitStatus, string> = {
  completed: 'concluído',
  current: 'em andamento',
  locked: 'bloqueado',
};

// Room around the node for its halo, as in the next lesson card.
const nodeMargin = sizes.trailNodeHalo / 2;
const cardPadding = spacing['2xl'];

// Distance from the left of a station to the center of its node: the module road runs
// down through it.
export const stationNodeCenter = cardPadding + nodeMargin + sizes.trailNode / 2;

// One stop of the home's module road: a single card with the round node (pulsing on the
// current module), the module's name and one bar part per lesson. The whole card is the
// control; locked modules do not open.
export function ModuleStation({ unit, index, onPress }: ModuleStationProps) {
  const status = unitStatus(unit);
  const look = looks[status];
  const progress = unitProgress(unit);
  const percent = percentLabel(progress);
  const accessibilityLabel = `Módulo ${index + 1}, ${unit.title}, ${statusLabels[status]}, ${percent}`;

  const content = (pressed: boolean) => (
    <View
      style={[
        styles.card,
        pressed
          ? [raised(look.edge, depth.pressed), pressedOffset(depth.md)]
          : raised(look.edge, depth.md),
      ]}
    >
      <View style={styles.node}>
        {status === 'current' && <PulseRing />}
        <Medal icon={look.icon} tone={look.medal} size="lg" halo={status === 'current'} />
      </View>
      <View style={styles.text}>
        <AppText variant="statLabel" color={look.kickerColor} numberOfLines={1}>
          {unitKicker(index, unit)}
        </AppText>
        <AppText variant="subtitle" color={look.titleColor} numberOfLines={2}>
          {unit.title}
        </AppText>
        <View style={styles.progress}>
          <View style={styles.bar}>
            <LessonSegments lessons={unit.lessons} progress={progress} />
          </View>
          <AppText variant="label" color={look.kickerColor}>
            {percent}
          </AppText>
        </View>
      </View>
    </View>
  );

  if (status === 'locked') {
    return (
      <View accessible accessibilityLabel={accessibilityLabel}>
        {content(false)}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Abre a trilha do módulo"
      onPress={onPress}
    >
      {({ pressed }) => content(pressed)}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['2xl'],
    paddingVertical: spacing.lg,
    paddingHorizontal: cardPadding,
    borderRadius: radius['2xl'],
    backgroundColor: colors.surface,
  },
  node: {
    width: sizes.trailNode,
    height: sizes.trailNode,
    margin: nodeMargin,
  },
  text: {
    flex: 1,
    gap: spacing['3xs'],
  },
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  bar: {
    flex: 1,
  },
});
