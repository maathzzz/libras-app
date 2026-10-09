import { useEffect } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';

import { colors, radius, sizes, spacing, type ColorToken } from '@/shared/theme';
import {
  AppText,
  BottomSheet,
  Button,
  Icon,
  type BottomSheetTone,
  type ButtonVariant,
  type IconName,
} from '@/shared/ui';

import type { Verdict } from '../store/lessonStore';

type VerdictSheetProps = {
  verdict: Verdict;
  onContinue: () => void;
};

type VerdictLook = {
  tone: BottomSheetTone;
  icon: IconName;
  color: ColorToken;
  detailColor: ColorToken;
  title: string;
  detail: string;
  button: ButtonVariant;
};

// No XP here: the prototype shows "+12 XP", but XP is calculated by the BFF.
const looks: Record<Verdict, VerdictLook> = {
  correct: {
    tone: 'success',
    icon: 'check',
    color: 'success',
    detailColor: 'successDark',
    title: 'Isso!',
    detail: 'Muito bem, continue assim.',
    button: 'primary',
  },
  wrong: {
    tone: 'danger',
    icon: 'close',
    color: 'danger',
    detailColor: 'dangerDark',
    title: 'Ainda não',
    detail: 'A resposta certa está marcada.',
    button: 'dangerSolid',
  },
};

export function VerdictSheet({ verdict, onContinue }: VerdictSheetProps) {
  const look = looks[verdict];

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(`${look.title} ${look.detail}`);
  }, [look]);

  return (
    <BottomSheet tone={look.tone}>
      <View style={styles.titleRow}>
        <View style={[styles.badge, { backgroundColor: colors[look.color] }]}>
          <Icon name={look.icon} size="md" color="onColor" />
        </View>
        <AppText variant="heading" color={look.color} accessibilityRole="header">
          {look.title}
        </AppText>
      </View>
      <AppText variant="body" color={look.detailColor}>
        {look.detail}
      </AppText>
      <Button label="Continuar" variant={look.button} onPress={onContinue} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  badge: {
    width: sizes.verdictIcon,
    height: sizes.verdictIcon,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
});
