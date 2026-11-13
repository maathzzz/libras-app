import { StyleSheet, View } from 'react-native';

import {
  colors,
  depth,
  radius,
  raised,
  spacing,
  trailColors,
  type ColorToken,
} from '@/shared/theme';

import { AppText } from './AppText';

type MapLabelProps = {
  text: string;
  color?: ColorToken;
  /** Marks the label as the title of its section for screen readers. */
  header?: boolean;
  /** Centers the tag in its column instead of keeping it at the start. */
  centered?: boolean;
};

// The small white tag of the module map ("LIÇÃO 3"), used as a section title over the
// scenery. It sizes to its text.
export function MapLabel({
  text,
  color = 'textMuted',
  header = false,
  centered = false,
}: MapLabelProps) {
  return (
    <View style={[styles.label, centered && styles.centered]}>
      <AppText variant="statLabel" color={color} {...(header && { accessibilityRole: 'header' })}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    alignSelf: 'flex-start',
    paddingVertical: spacing['2xs'],
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    ...raised(trailColors.labelEdge, depth.xs),
  },
  centered: {
    alignSelf: 'center',
  },
});
