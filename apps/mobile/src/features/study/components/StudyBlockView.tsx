import type { StudyBlock } from '@libras/contracts';
import { StyleSheet, View } from 'react-native';

import { colors, radius, sizes, spacing } from '@/shared/theme';
import { AppText, Card, Icon, SignImage } from '@/shared/ui';

import { signFrameSize } from './studyView';

const signPadding = spacing.xl;
const frameGap = spacing.xs;

type StudyBlockViewProps = {
  block: StudyBlock;
  /** Width of a single-frame sign card; those sit two per row. */
  columnWidth: number;
  /** Width of the page content: text, tips, headings and signs with several frames. */
  fullWidth: number;
};

// New block types need a schema in contracts and a case here; the switch has no default,
// so the typecheck points at this file when one is missing.
export function StudyBlockView({ block, columnWidth, fullWidth }: StudyBlockViewProps) {
  switch (block.type) {
    case 'heading':
      return (
        <View style={[styles.fullWidth, styles.heading]}>
          <AppText variant="heading" accessibilityRole="header">
            {block.text}
          </AppText>
        </View>
      );
    case 'text':
      return (
        <View style={styles.fullWidth}>
          <AppText variant="body">{block.body}</AppText>
        </View>
      );
    case 'sign':
      return <SignCard block={block} columnWidth={columnWidth} fullWidth={fullWidth} />;
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
  columnWidth: number;
  fullWidth: number;
};

// A sign with movement is a series of frames, shown side by side in order across the whole
// width, at the same size as the frames of the single-frame signs around it. The description
// covers the whole sign, so it comes once, below all of the frames.
function SignCard({ block, columnWidth, fullWidth }: SignCardProps) {
  const frameCount = block.images.length;
  const width = frameCount > 1 ? fullWidth : columnWidth;
  const frameSize = signFrameSize({
    columnInner: columnWidth - signPadding * 2,
    fullInner: fullWidth - signPadding * 2,
    frameCount,
    frameGap,
    maxFrame: sizes.handSignFrame,
  });

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
      {block.description && (
        <AppText variant="caption" align="center">
          {block.description}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fullWidth: {
    width: '100%',
  },
  heading: {
    marginTop: spacing.md,
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
    padding: signPadding,
    borderRadius: radius['2xl'],
    backgroundColor: colors.accentSoft,
  },
  frames: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: frameGap,
  },
});
