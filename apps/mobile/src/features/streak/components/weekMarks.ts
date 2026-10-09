export type WeekMarkState = 'done' | 'today' | 'none';

export type WeekMark = {
  /** Initial shown under the mark, as in the design (S T Q Q S S D). */
  initial: string;
  name: string;
  state: WeekMarkState;
};

// Monday first, as in the design.
const weekDays = [
  { initial: 'S', name: 'segunda' },
  { initial: 'T', name: 'terça' },
  { initial: 'Q', name: 'quarta' },
  { initial: 'Q', name: 'quinta' },
  { initial: 'S', name: 'sexta' },
  { initial: 'S', name: 'sábado' },
  { initial: 'D', name: 'domingo' },
] as const;

// The streak counts consecutive days ending today, so this week's marks follow from its
// length alone. `today` is the device's date; the BFF's day uses the profile's time zone,
// which is the same for a learner at home.
export function weekMarks(streakDays: number, today: Date): WeekMark[] {
  const todayIndex = (today.getDay() + 6) % 7;

  return weekDays.map((day, index) => {
    const daysAgo = todayIndex - index;
    const inStreak = daysAgo >= 0 && daysAgo < streakDays;
    const state: WeekMarkState = !inStreak ? 'none' : daysAgo === 0 ? 'today' : 'done';
    return { ...day, state };
  });
}

export function weekAccessibilityLabel(marks: WeekMark[]): string {
  const days = marks.filter((mark) => mark.state !== 'none').map((mark) => mark.name);
  if (days.length === 0) return 'Nenhuma lição nesta semana';
  return `Dias com lição nesta semana: ${days.join(', ')}`;
}
