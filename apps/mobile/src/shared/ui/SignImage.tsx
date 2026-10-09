import type { SignImage as SignImageData } from '@libras/contracts';
import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/shared/theme';

import { AppText } from './AppText';

type SignImageProps = {
  image: SignImageData;
  size: number;
  // Small frames have no room for the alt text: the placeholder is only the gray square,
  // and the alt still reaches screen readers through the label.
  compact?: boolean;
};

type LoadState = 'loading' | 'loaded' | 'failed';

// Every sign image in the app goes through here, so a missing or broken picture still
// leaves a square of the same size that says, through its alt text, which sign it is.
export function SignImage({ image, size, compact = false }: SignImageProps) {
  // Keyed by url so a new image starts loading from scratch instead of keeping the old state.
  return <SignImageFrame key={image.url} image={image} size={size} compact={compact} />;
}

function SignImageFrame({ image, size, compact }: SignImageProps) {
  const [state, setState] = useState<LoadState>('loading');

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={image.alt}
      style={[
        styles.frame,
        { width: size, height: size },
        state !== 'loaded' && styles.placeholder,
      ]}
    >
      {state !== 'loaded' && !compact && (
        <AppText variant="caption" color="textMuted" align="center">
          {image.alt}
        </AppText>
      )}
      {state !== 'failed' && (
        <Image
          source={{ uri: image.url }}
          cachePolicy="memory-disk"
          contentFit="contain"
          style={StyleSheet.absoluteFill}
          onLoad={() => setState('loaded')}
          onError={() => setState('failed')}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: radius.md,
  },
  placeholder: {
    padding: spacing.sm,
    backgroundColor: colors.imagePlaceholder,
  },
});
