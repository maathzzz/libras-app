import { useState } from 'react';
import { StyleSheet, View, type BoxShadowValue } from 'react-native';
import Svg from 'react-native-svg';

import {
  borderWidth,
  colors,
  depth,
  radius,
  raised,
  sizes,
  spacing,
  trailColors,
} from '@/shared/theme';
import { AppText, Cloud, Flower, Hill, Icon, Pill, SkyGradient, Tree } from '@/shared/ui';

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

// The app has no profile picture yet, so the avatar is the design's placeholder silhouette,
// standing on a strip of the module map's countryside.
export function IdentityCard({ name, level }: IdentityCardProps) {
  return (
    <View style={[styles.card, raised(colors.border, depth.md, colors.borderSubtle)]}>
      <Banner />
      <View style={styles.body}>
        <View
          style={[styles.avatar, { boxShadow: avatarRings }]}
          accessibilityElementsHidden
          importantForAccessibility="no"
        >
          <Icon name="person" size="xl" color="locked" />
        </View>
        <AppText variant="headingStrong" align="center" accessibilityRole="header">
          {name}
        </AppText>
        {/* The pill aligns itself to the start; a centered row puts it under the name. */}
        <View style={styles.levelRow}>
          <Pill label={level} icon="chart" accessibilityLabel={`Nível: ${level}`} />
        </View>
      </View>
    </View>
  );
}

const [orange, , teal, yellow] = trailColors.flowers;

// Decorative; drawn once its width is known.
function Banner() {
  const [width, setWidth] = useState(0);
  const h = sizes.profileBanner;

  return (
    <View
      style={styles.banner}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      {width > 0 && (
        <Svg width={width} height={h}>
          <SkyGradient id="profile-sky" width={width} height={h} skyHeight={h * 0.45} />
          <Cloud x={width * 0.2} y={30} scale={0.7} />
          <Cloud x={width - 64} y={24} scale={0.9} />
          <Hill cx={20} cy={h + 14} rx={110} ry={46} />
          <Hill cx={width - 10} cy={h + 18} rx={120} ry={52} />
          <Hill cx={width - 30} cy={h + 26} rx={80} ry={40} inner />
          <Tree x={36} y={h - 30} scale={0.85} />
          <Tree x={70} y={h - 18} scale={0.6} />
          <Tree x={width - 44} y={h - 40} scale={1} />
          <Tree x={width - 82} y={h - 22} scale={0.65} />
          <Flower x={104} y={h - 12} color={orange} />
          <Flower x={width - 120} y={h - 10} color={yellow} />
          <Flower x={14} y={h - 8} color={teal} />
        </Svg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius['4xl'],
    backgroundColor: colors.surface,
  },
  // Rounded and clipped on its own instead of clipping the card, which would also clip the
  // card's edge.
  banner: {
    height: sizes.profileBanner,
    overflow: 'hidden',
    borderTopLeftRadius: radius['4xl'],
    borderTopRightRadius: radius['4xl'],
    backgroundColor: trailColors.meadow,
  },
  body: {
    alignItems: 'center',
    gap: spacing.lg,
    // Pulls the avatar up so its top half sits on the band.
    marginTop: -sizes.profileAvatar / 2,
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing['3xl'],
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'center',
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
