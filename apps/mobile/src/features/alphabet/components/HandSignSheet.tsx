import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, sizes, spacing } from '@/shared/theme';
import { AppText, BottomSheet, Button, IconButton, SignImage } from '@/shared/ui';

import type { HandSign } from '../content/handSigns';

type HandSignSheetProps = {
  sign: HandSign | null;
  onClose: () => void;
};

const kickers = { letter: 'Datilologia', number: 'Número' } as const;

// A modal rather than a plain BottomSheet so the panel and its backdrop also cover the tab bar.
export function HandSignSheet({ sign, onClose }: HandSignSheetProps) {
  return (
    <Modal
      visible={sign !== null}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      {/* Screen readers use the close button instead of this full-screen tap target. */}
      <Pressable
        accessible={false}
        importantForAccessibility="no"
        style={styles.backdrop}
        onPress={onClose}
      />
      {sign && <SheetContent sign={sign} onClose={onClose} />}
    </Modal>
  );
}

function SheetContent({ sign, onClose }: { sign: HandSign; onClose: () => void }) {
  return (
    <BottomSheet>
      <View style={styles.titleRow}>
        <View>
          <AppText variant="kicker" color="accent">
            {kickers[sign.kind]}
          </AppText>
          <AppText variant="hero" accessibilityRole="header">
            {sign.label}
          </AppText>
        </View>
        <IconButton icon="close" accessibilityLabel="Fechar" onPress={onClose} filled />
      </View>
      <View style={styles.imageArea}>
        <SignImage image={sign.image} size={sizes.handSignFrame} />
      </View>
      <AppText variant="body" color="textMuted">
        {sign.hint}
      </AppText>
      <Button label="Entendi" onPress={onClose} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  imageArea: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius['2xl'],
    backgroundColor: colors.accentSoft,
  },
});
