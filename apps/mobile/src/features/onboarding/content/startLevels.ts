import type { StartLevel } from '@libras/contracts';

import type { IconName } from '@/shared/ui';

export const startLevelOptions: readonly {
  level: StartLevel;
  title: string;
  description: string;
  tag: string;
  icon: IconName;
}[] = [
  {
    level: 'beginner',
    title: 'Nunca estudei',
    description: 'Primeiro contato com a língua de sinais.',
    tag: 'Começa no alfabeto manual',
    icon: 'add',
  },
  {
    level: 'basic',
    title: 'Sei o básico',
    description: 'Reconheço o alfabeto e algumas saudações.',
    tag: 'Começa em saudações',
    icon: 'check',
  },
  {
    level: 'conversational',
    title: 'Já converso um pouco',
    description: 'Formo frases curtas sobre o dia a dia.',
    tag: 'Começa no cotidiano',
    icon: 'chart',
  },
];
