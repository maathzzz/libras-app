import type { HomeResponse, Trail } from '@libras/contracts';

import { getMockStats } from '@/shared/api/mockServer';

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

// Streak and XP come from the mock shared with the lesson completion, so finishing a
// lesson shows up here. The starting streak status is set in shared/api/mockServer.ts.
export function mockHome(): HomeResponse {
  const { streak, totalXp } = getMockStats();
  return { trail: mockTrail, streak, totalXp };
}
