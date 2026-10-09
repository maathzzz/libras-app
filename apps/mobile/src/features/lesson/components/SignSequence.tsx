import type { SignImageSequence } from '@libras/contracts';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/shared/theme';
import { SignImage } from '@/shared/ui';

type SignSequenceProps = {
  images: SignImageSequence;
  /** Width available for the whole sequence. */
  width: number;
  maxFrameSize?: number;
};

// A sign with movement is a series of frames; they are shown side by side, in order.
export function SignSequence({ images, width, maxFrameSize = width }: SignSequenceProps) {
  const gaps = spacing.xs * (images.length - 1);
  const frameSize = Math.min(maxFrameSize, (width - gaps) / images.length);

  return (
    <View style={styles.row}>
      {images.map((image, index) => (
        <SignImage key={`${index}-${image.url}`} image={image} size={frameSize} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
});
