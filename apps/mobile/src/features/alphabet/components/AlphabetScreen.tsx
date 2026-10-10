import { router, useIsFocused } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { borderWidth, colors, fontFamily, fontSize, radius, sizes, spacing } from '@/shared/theme';
import { AppText, ScreenTitle } from '@/shared/ui';

import type { HandSign } from '../content/handSigns';
import { searchHandSigns } from '../content/searchHandSigns';
import { HandSignTile } from './HandSignTile';

const gutter = spacing['2xl'];
const columns = 4;
const gap = spacing.sm;

export function AlphabetScreen() {
  const [query, setQuery] = useState('');
  const [openedSignId, setOpenedSignId] = useState<string | null>(null);
  // The sheet is a separate route: while it is up this screen loses focus, and regains it on close.
  const sheetOpen = !useIsFocused();
  const { width } = useWindowDimensions();
  const tileWidth = (width - gutter * 2 - gap * (columns - 1)) / columns;
  const results = searchHandSigns(query);
  const nothingFound = results.letters.length === 0 && results.numbers.length === 0;

  const grid = (signs: readonly HandSign[]) => (
    <View style={styles.grid}>
      {signs.map((sign, index) => (
        // Index in the key: a searched word repeats letters ("casa" has two A).
        <HandSignTile
          key={`${index}-${sign.id}`}
          sign={sign}
          width={tileWidth}
          selected={sheetOpen && openedSignId === sign.id}
          onPress={() => {
            setOpenedSignId(sign.id);
            router.push({ pathname: '/hand-sign/[signId]', params: { signId: sign.id } });
          }}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <ScreenTitle
          title="Alfabeto manual"
          description="Datilologia — para nomes próprios e palavras sem sinal."
        />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar letra ou palavra"
          placeholderTextColor={colors.textSubtle}
          accessibilityLabel="Buscar letra ou palavra"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          style={styles.search}
        />
        {nothingFound && (
          <AppText variant="body" color="textMuted" align="center">
            Nada encontrado. Busque letras de A a Z ou números de 0 a 10.
          </AppText>
        )}
        {results.letters.length > 0 && grid(results.letters)}
        {results.numbers.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionTitle}>
              <AppText variant="heading" accessibilityRole="header">
                Números
              </AppText>
              <AppText variant="body" color="textMuted">
                De 0 a 10 — quantidades, idade e horários.
              </AppText>
            </View>
            {grid(results.numbers)}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    gap: spacing.xl,
    paddingTop: spacing['3xs'],
    paddingHorizontal: gutter,
    paddingBottom: spacing['5xl'],
  },
  search: {
    height: sizes.minTouchTarget,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: borderWidth.hairline,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSubtle,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.text,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap,
  },
  section: {
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  sectionTitle: {
    gap: spacing['2xs'],
  },
});
