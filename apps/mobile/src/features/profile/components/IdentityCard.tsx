import { StyleSheet, View, type BoxShadowValue } from 'react-native';

import { borderWidth, colors, depth, radius, raised, sizes, spacing } from '@/shared/theme';
import { AppText, Icon, Pill } from '@/shared/ui';

type IdentityCardProps = {
  name: string;
  level: string;
};

// A white ring that separates the avatar from the band, then a thin outer line.
const avatarRings: BoxShadowValue[] = [
  {
    offsetX: 0,
    offsetY: 0,
    blurRadius: 0,
    spreadDistance: sizes.profileAvatarRing,
    color: colors.surface,
  },
  {
    offsetX: 0,
    offsetY: 0,
    blurRadius: 0,
    spreadDistance: sizes.profileAvatarRing + borderWidth.hairline * 2,
    color: colors.border,
  },
];

// The app has no profile picture yet, so the avatar is the design's placeholder silhouette.
// The design paints the band with a gradient; it stays solid until gradients are decided
// (docs/design/tokens.md).
export function IdentityCard({ name, level }: IdentityCardProps) {
  return (
    <View style={[styles.card, raised(colors.border, depth.md, colors.borderSubtle)]}>
      <View style={styles.banner} />
      <View style={styles.body}>
        <View
          style={[styles.avatar, { boxShadow: avatarRings }]}
          accessibilityElementsHidden
          importantForAccessibility="no"
        >
          <Icon name="person" size="xl" color="locked" />
        </View>
        <AppText variant="heading" align="center" accessibilityRole="header">
          {name}
        </AppText>
        <Pill label={level} icon="chart" accessibilityLabel={`Nível: ${level}`} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius['4xl'],
    backgroundColor: colors.surface,
  },
  // Rounded on its own instead of clipping the card, which would also clip the card's edge.
  banner: {
    height: sizes.profileBanner,
    borderTopLeftRadius: radius['4xl'],
    borderTopRightRadius: radius['4xl'],
    backgroundColor: colors.accentSoft,
  },
  body: {
    alignItems: 'center',
    gap: spacing.lg,
    // Pulls the avatar up so its top half sits on the band.
    marginTop: -sizes.profileAvatar / 2,
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing['3xl'],
  },
  avatar: {
    width: sizes.profileAvatar,
    height: sizes.profileAvatar,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.lockedSurface,
  },
});
