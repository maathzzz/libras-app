import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, sizes, spacing } from '@/shared/theme';
import { AppText, Button, Icon, Pill } from '@/shared/ui';

// The design paints the illustration area with an accent → teal gradient; it stays
// solid until gradients are decided (docs/design/tokens.md).
export function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.body}>
        <View style={styles.hero}>
          <Icon name="hand" size="xl" color="accent" />
        </View>
        <View style={styles.text}>
          <AppText variant="hero" accessibilityRole="header">
            Aprenda Libras no seu ritmo
          </AppText>
          <AppText variant="body" color="textMuted">
            Trilhas curtas de sinais reais, do alfabeto manual ao dia a dia. Sem conhecimento
            prévio.
          </AppText>
        </View>
        <View style={styles.tags}>
          <Pill label="5 min por dia" tone="success" />
          <Pill label="Para ouvintes" tone="accent" />
          <Pill label="Sinais do INES" tone="warning" />
        </View>
      </View>
      <View style={styles.actions}>
        <Button label="Começar agora" onPress={() => router.push('/sign-up')} />
        <Button
          label="Já tenho conta"
          variant="secondary"
          onPress={() => router.push('/sign-in')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing['3xl'],
    paddingHorizontal: spacing['4xl'],
  },
  hero: {
    height: sizes.welcomeHero,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius['4xl'],
    backgroundColor: colors.accentSoft,
  },
  text: {
    gap: spacing.md,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  actions: {
    gap: spacing.md,
    paddingHorizontal: spacing['4xl'],
    paddingBottom: spacing['2xl'],
  },
});
