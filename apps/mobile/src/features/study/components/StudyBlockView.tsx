import type { StudyBlock } from '@libras/contracts';
import { StyleSheet, View } from 'react-native';

import { colors, radius, sizes, spacing } from '@/shared/theme';
import { AppText, Card, Icon, SignImage } from '@/shared/ui';

type StudyBlockViewProps = {
  block: StudyBlock;
  /** Width of a sign card; signs sit two per row, text and tips take the whole line. */
  signWidth: number;
};

// New block types need a schema in contracts and a case here; the switch has no default,
// so the typecheck points at this file when one is missing.
export function StudyBlockView({ block, signWidth }: StudyBlockViewProps) {
  switch (block.type) {
    case 'text':
      return (
        <View style={styles.fullWidth}>
          <AppText variant="body">{block.body}</AppText>
        </View>
      );
    case 'sign':
      return <SignCard block={block} width={signWidth} />;
    case 'tip':
      return (
        <View style={styles.fullWidth}>
          <Card tone="warning">
            <View style={styles.tipRow}>
              <Icon name="tip" color="warning" />
              <View style={styles.tipText}>
                <AppText variant="body">{block.body}</AppText>
              </View>
            </View>
          </Card>
        </View>
      );
  }
}

type SignCardProps = {
  block: Extract<StudyBlock, { type: 'sign' }>;
  width: number;
};

// A sign with movement is a series of frames, shown side by side in order.
function SignCard({ block, width }: SignCardProps) {
  const inner = width - spacing.xl * 2;
  const gaps = spacing.xs * (block.images.length - 1);
  const frameSize = Math.min(sizes.handSignFrame, (inner - gaps) / block.images.length);

  return (
    <View style={[styles.sign, { width }]}>
      <AppText variant="heading" color="accent" align="center">
        {block.label}
      </AppText>
      <View style={styles.frames}>
        {block.images.map((image, index) => (
          <SignImage key={`${index}-${image.url}`} image={image} size={frameSize} />
        ))}
      </View>
      {block.hint && (
        <AppText variant="caption" align="center">
          {block.hint}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fullWidth: {
    width: '100%',
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  tipText: {
    flex: 1,
  },
  sign: {
    gap: spacing.sm,
    padding: spacing.xl,
    borderRadius: radius['2xl'],
    backgroundColor: colors.accentSoft,
  },
  frames: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
});
