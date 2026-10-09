import type { HomeResponse, TrailUnit } from '@libras/contracts';

// Mirrors the two home states of the design ("Trilhas" and "Trilhas, novo usuário").
// The "Prova do módulo" node is left out: contracts have no exercise type for it yet.

export const returningUserHome = {
  streak: { current: 7, status: 'at_risk' },
  totalXp: 1240,
  dailyGoal: { target: 1, completedToday: 0 },
  trail: {
    id: 'primeiros-contatos',
    title: 'Primeiros contatos',
    position: 1,
    totalTrails: 6,
    units: [
      {
        id: 'alfabeto-a-f',
        title: 'Alfabeto A–F',
        status: 'done',
        totalLessons: 6,
        completedLessons: 6,
      },
      {
        id: 'saudacoes',
        title: 'Saudações',
        status: 'current',
        totalLessons: 5,
        completedLessons: 1,
      },
      {
        id: 'numeros-0-10',
        title: 'Números 0–10',
        status: 'locked',
        totalLessons: 5,
        completedLessons: 0,
      },
      {
        id: 'cotidiano',
        title: 'Cotidiano',
        status: 'locked',
        totalLessons: 6,
        completedLessons: 0,
      },
    ],
  },
  nextLesson: {
    lessonId: 'saudacoes-2',
    unitTitle: 'Saudações',
    lessonNumber: 2,
    newSignsCount: 6,
    xpReward: 40,
  },
} satisfies HomeResponse;

export const newUserHome = {
  streak: { current: 0, status: 'broken' },
  totalXp: 0,
  dailyGoal: { target: 1, completedToday: 0 },
  trail: {
    ...returningUserHome.trail,
    units: returningUserHome.trail.units.map((unit, index): TrailUnit => ({
      ...unit,
      status: index === 0 ? 'current' : 'locked',
      completedLessons: 0,
    })),
  },
  nextLesson: {
    lessonId: 'alfabeto-a-f-1',
    unitTitle: 'Alfabeto A–F',
    lessonNumber: 1,
    newSignsCount: 6,
    xpReward: 40,
  },
} satisfies HomeResponse;
