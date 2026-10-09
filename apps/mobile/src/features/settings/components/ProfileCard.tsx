import { StyleSheet, View } from 'react-native';

import { daysLabel, formatXp } from '@/features/home';
import { colors, radius, sizes, spacing } from '@/shared/theme';
import { AppText, Card } from '@/shared/ui';

import { PillButton } from './PillButton';

type ProfileCardProps = {
  name: string;
  totalXp: number | null;
  streakDays: number | null;
  onEdit: () => void;
};

function initials(name: string): string {
  const words = name.trim().split(/\s+/);
  const first = words[0]?.[0] ?? '';
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

function statsLine(totalXp: number | null, streakDays: number | null): string | null {
  if (totalXp === null || streakDays === null) return null;
  return `${formatXp(totalXp)} XP · sequência de ${daysLabel(streakDays)}`;
}

// The design paints the avatar with an accent → teal gradient; it stays solid like the
// next lesson card until gradients are decided (docs/design/tokens.md).
export function ProfileCard({ name, totalXp, streakDays, onEdit }: ProfileCardProps) {
  const stats = statsLine(totalXp, streakDays);

  return (
    <Card>
      <View style={styles.row}>
        <View style={styles.avatar} accessibilityElementsHidden importantForAccessibility="no">
          <AppText variant="subtitle" color="onColor">
            {initials(name)}
          </AppText>
        </View>
        <View style={styles.text}>
          <AppText variant="subtitle">{name}</AppText>
          {stats && <AppText variant="caption">{stats}</AppText>}
        </View>
        <PillButton label="Editar" accessibilityLabel="Editar perfil" onPress={onEdit} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  avatar: {
    width: sizes.avatar,
    height: sizes.avatar,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  text: {
    flex: 1,
  },
});
