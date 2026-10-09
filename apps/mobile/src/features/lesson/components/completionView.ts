import type { CompleteLessonResponse } from '@libras/contracts';

const plural = (count: number, one: string, many: string) =>
  `${count} ${count === 1 ? one : many}`;

export function daysLabel(count: number): string {
  return plural(count, 'dia', 'dias');
}

function splitDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  return { minutes: Math.floor(totalSeconds / 60), seconds: totalSeconds % 60 };
}

// "2:14", as in the design's TEMPO tile.
export function formatDuration(ms: number): string {
  const { minutes, seconds } = splitDuration(ms);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function durationAccessibilityLabel(ms: number): string {
  const { minutes, seconds } = splitDuration(ms);
  const secondsLabel = plural(seconds, 'segundo', 'segundos');
  if (minutes === 0) return secondsLabel;
  return `${plural(minutes, 'minuto', 'minutos')} e ${secondsLabel}`;
}

export function streakResultCopy({ streak, streakIncreased }: CompleteLessonResponse) {
  return {
    title: `Sequência de ${daysLabel(streak.current)}`,
    hint: streakIncreased ? null : 'A lição de hoje já contou para a sequência.',
  };
}

// Read aloud by screen readers when the result arrives, since it replaces a spinner.
export function resultAnnouncement({ xpEarned, streak, streakIncreased }: CompleteLessonResponse) {
  const xp = `Você ganhou ${xpEarned} pontos de experiência.`;
  if (!streakIncreased) return `Lição concluída. ${xp}`;
  return `Lição concluída. ${xp} Sua sequência aumentou para ${daysLabel(streak.current)}.`;
}

export const pendingMessage = {
  title: 'Sem conexão agora',
  body: 'Sua lição foi guardada e será enviada quando você voltar ao app.',
};

export const failedMessage = {
  title: 'Não foi possível salvar esta lição',
  body: 'Seus acertos aparecem aqui, mas não contaram para o XP e a sequência.',
};
