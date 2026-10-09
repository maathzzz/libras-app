import { Pressable, StyleSheet } from 'react-native';

import { colors, depth, pressedOffset, radius, raised, spacing } from '@/shared/theme';
import { AppText, SignImage } from '@/shared/ui';

import type { HandSign } from '../content/handSigns';

type HandSignTileProps = {
  sign: HandSign;
  width: number;
  selected: boolean;
  onPress: () => void;
};

const tilePadding = spacing.xs;

const kindNames = { letter: 'Letra', number: 'Número' } as const;

export function HandSignTile({ sign, width, selected, onPress }: HandSignTileProps) {
  const edge = selected ? colors.accentSoftEdge : colors.border;
  const ring = selected ? undefined : colors.borderSubtle;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${kindNames[sign.kind]} ${sign.label}`}
      accessibilityHint="Mostra como fazer o sinal"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        { width, backgroundColor: selected ? colors.accentSoft : colors.surface },
        pressed
          ? [raised(edge, depth.pressed, ring), pressedOffset(depth.sm)]
          : raised(edge, depth.sm, ring),
      ]}
    >
      <SignImage image={sign.image} size={width - tilePadding * 2} compact />
      <AppText variant="subtitle" color={selected ? 'accent' : 'text'} align="center">
        {sign.label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    gap: spacing['2xs'],
    padding: tilePadding,
    borderRadius: radius.xl,
  },
});
