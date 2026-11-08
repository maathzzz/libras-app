import type { TrailUnit } from '@libras/contracts';
import type { ReactNode } from 'react';
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
import { AppText, Icon, ProgressBar, type IconName } from '@/shared/ui';

import { percentLabel, unitKicker, unitProgress, unitStatus, type UnitStatus } from './homeView';

type ModuleCardProps = {
  unit: TrailUnit;
  index: number;
  onPress: () => void;
};

type ModuleLook = {
  background: string;
  edge?: string;
  icon: IconName;
  iconBackground: string;
  iconColor: ColorToken;
  kickerColor: ColorToken;
  titleColor: ColorToken;
};

// Same states as the trail nodes.
const looks: Record<UnitStatus, ModuleLook> = {
  completed: {
    background: colors.successSoft,
    edge: colors.successSoftEdge,
    icon: 'check',
    iconBackground: colors.success,
    iconColor: 'onColor',
    kickerColor: 'successDark',
    titleColor: 'text',
  },
  current: {
    background: colors.surface,
    edge: colors.accentSoftEdge,
    icon: 'play',
    iconBackground: colors.accent,
    iconColor: 'onColor',
    kickerColor: 'accent',
    titleColor: 'text',
  },
  locked: {
    background: colors.disabled,
    icon: 'locked',
    iconBackground: colors.locked,
    iconColor: 'textSubtle',
    kickerColor: 'textSubtle',
    titleColor: 'textMuted',
  },
};

const statusLabels: Record<UnitStatus, string> = {
  completed: 'concluído',
  current: 'em andamento',
  locked: 'bloqueado',
};

export function ModuleCard({ unit, index, onPress }: ModuleCardProps) {
  const status = unitStatus(unit);
  const look = looks[status];
  const progress = unitProgress(unit);
  const percent = percentLabel(progress);
  const accessibilityLabel = `Módulo ${index + 1}, ${unit.title}, ${statusLabels[status]}, ${percent}`;

  const content: ReactNode = (
    <>
      <View style={[styles.icon, { backgroundColor: look.iconBackground }]}>
        <Icon name={look.icon} size="lg" color={look.iconColor} />
      </View>
      <View style={styles.body}>
        <AppText variant="kicker" color={look.kickerColor} numberOfLines={1}>
          {unitKicker(index, unit)}
        </AppText>
        <AppText variant="subtitle" color={look.titleColor} numberOfLines={2}>
          {unit.title}
        </AppText>
        <View style={styles.progress}>
          <View style={styles.bar}>
            <ProgressBar value={progress} size="sm" />
          </View>
          <AppText variant="pill" color={status === 'locked' ? 'textSubtle' : look.kickerColor}>
            {percent}
          </AppText>
        </View>
      </View>
    </>
  );

  const { edge } = look;
  if (status === 'locked' || !edge) {
    return (
      <View
        accessible
        accessibilityLabel={accessibilityLabel}
        style={[styles.card, { backgroundColor: look.background }]}
      >
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Abre a trilha do módulo"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: look.background },
        pressed
          ? [raised(edge, depth.pressed), pressedOffset(depth.md)]
          : raised(edge, depth.md),
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.xl,
    borderRadius: radius['2xl'],
  },
  icon: {
    width: sizes.moduleIcon,
    height: sizes.moduleIcon,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
  },
  body: {
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
