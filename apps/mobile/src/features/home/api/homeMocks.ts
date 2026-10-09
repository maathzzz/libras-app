import type { HomeResponse, StreakStatus, StreakSummary, Trail } from '@libras/contracts';

// To check one streak status on the device, pin it here (e.g. 'broken'). With `null`,
// every load (opening the tab or pulling to refresh) moves on to the next status.
const pinnedStreakStatus: StreakStatus | null = null;

const mockStreaks: Record<StreakStatus, StreakSummary> = {
  at_risk: { current: 7, longest: 12, status: 'at_risk' },
  done_today: { current: 8, longest: 12, status: 'done_today' },
  broken: { current: 0, longest: 12, status: 'broken' },
};

const statusCycle: readonly StreakStatus[] = ['at_risk', 'done_today', 'broken'];
let loadCount = 0;

function nextMockStatus(): StreakStatus {
  if (pinnedStreakStatus) return pinnedStreakStatus;

  const status = statusCycle[loadCount % statusCycle.length] ?? 'at_risk';
  loadCount += 1;
  return status;
}

// Mirrors the design's "Primeiros contatos" trail. The "Prova do módulo" node is left
// out: contracts have no exercise type for it yet.
export const mockTrail = {
  id: 'primeiros-contatos',
  title: 'Primeiros contatos',
  position: 1,
  totalTrails: 6,
  units: [
    {
      id: 'alfabeto-a-f',
      title: 'Alfabeto A–F',
      lessons: [
        { id: 'alfabeto-a-b', title: 'A e B', status: 'completed' },
        { id: 'alfabeto-c-d', title: 'C e D', status: 'completed' },
        { id: 'alfabeto-e-f', title: 'E e F', status: 'completed' },
      ],
    },
    {
      id: 'saudacoes',
      title: 'Saudações',
      lessons: [
        { id: 'saudacoes-oi-tchau', title: 'Oi e tchau', status: 'completed' },
        { id: 'saudacoes-bom-dia', title: 'Bom dia', status: 'available' },
        { id: 'saudacoes-obrigado', title: 'Obrigado', status: 'locked' },
        { id: 'saudacoes-por-favor', title: 'Por favor', status: 'locked' },
      ],
    },
    {
      id: 'numeros-0-10',
      title: 'Números 0–10',
      lessons: [
        { id: 'numeros-0-5', title: '0 a 5', status: 'locked' },
        { id: 'numeros-6-10', title: '6 a 10', status: 'locked' },
      ],
    },
    {
      id: 'cotidiano',
      title: 'Cotidiano',
      lessons: [
        { id: 'cotidiano-comer-beber', title: 'Comer e beber', status: 'locked' },
        { id: 'cotidiano-casa', title: 'Casa', status: 'locked' },
      ],
    },
  ],
} satisfies Trail;

export function mockHome(): HomeResponse {
  return { trail: mockTrail, streak: mockStreaks[nextMockStatus()], totalXp: 1240 };
}
