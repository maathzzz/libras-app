import { Redirect, router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, sizes, spacing } from '@/shared/theme';
import { AppText, BottomSheet, Button, IconButton, SignImage } from '@/shared/ui';

import { findHandSign, type HandSign } from '../content/handSigns';

type HandSignSheetProps = {
  signId: string;
};

const kickers = { letter: 'Datilologia', number: 'Número' } as const;

// Rendered as a transparent-modal route instead of a React Native Modal: on Android the Modal
// window stopped short of the system navigation bar, leaving the sheet floating above it.
export function HandSignSheet({ signId }: HandSignSheetProps) {
  const sign = findHandSign(signId);
  if (!sign) return <Redirect href="/alphabet" />;

  return (
    <View style={styles.screen}>
      {/* Screen readers use the close button instead of this full-screen tap target. */}
      <Pressable
        accessible={false}
        importantForAccessibility="no"
        style={styles.backdrop}
        onPress={close}
      />
      <SheetContent sign={sign} />
    </View>
  );
}

function close() {
  router.back();
}

function SheetContent({ sign }: { sign: HandSign }) {
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
        <IconButton icon="close" accessibilityLabel="Fechar" onPress={close} filled />
      </View>
      <View style={styles.imageArea}>
        <SignImage image={sign.image} size={sizes.handSignFrame} />
      </View>
      <AppText variant="body" color="textMuted">
        {sign.description}
      </AppText>
      <Button label="Entendi" onPress={close} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
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
