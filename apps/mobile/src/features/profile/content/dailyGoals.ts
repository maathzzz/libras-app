import type { DailyGoal } from '@libras/contracts';

export const dailyGoalOptions: readonly { goal: DailyGoal; title: string }[] = [
  { goal: 1, title: 'Casual' },
  { goal: 3, title: 'Regular' },
  { goal: 5, title: 'Sério' },
  { goal: 8, title: 'Intenso' },
];

export function dailyGoalLabel(goal: DailyGoal): string {
  return `${goal} ${goal === 1 ? 'lição' : 'lições'} por dia`;
}
