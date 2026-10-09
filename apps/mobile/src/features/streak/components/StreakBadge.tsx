import { Pill } from '@/shared/ui';

type StreakBadgeProps = {
  days: number;
};

export function StreakBadge({ days }: StreakBadgeProps) {
  const label = `Sequência de ${days} ${days === 1 ? 'dia' : 'dias'}`;

  return <Pill label={String(days)} icon="streak" tone="warning" accessibilityLabel={label} />;
}
