import { z } from 'zod';

import { SignImageSequence } from './signImage';

// Studies are reading material shown before a trail's lessons. They are never graded,
// so there are no answers here: only what each page shows.

export const TextBlock = z.object({
  type: z.literal('text'),
  body: z.string().min(1),
});

export const SignBlock = z.object({
  type: z.literal('sign'),
  /** The letter, number or word the sign stands for. */
  label: z.string().min(1),
  images: SignImageSequence,
  hint: z.string().min(1).optional(),
});

export const TipBlock = z.object({
  type: z.literal('tip'),
  body: z.string().min(1),
});

export const StudyBlock = z.discriminatedUnion('type', [TextBlock, SignBlock, TipBlock]);
export type StudyBlock = z.infer<typeof StudyBlock>;
export type StudyBlockType = StudyBlock['type'];

export const StudyPage = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  blocks: z.array(StudyBlock).min(1),
});
export type StudyPage = z.infer<typeof StudyPage>;

// GET /v1/studies/:studyId
export const StudyGuide = z
  .object({
    id: z.string().min(1),
    trailId: z.string().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
    pages: z.array(StudyPage).min(1),
  })
  .superRefine((guide, ctx) => {
    // The app keys the rendered pages by id, so a repeated id would mix two pages.
    const seen = new Set<string>();
    guide.pages.forEach((page, index) => {
      if (seen.has(page.id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['pages', index, 'id'],
          message: 'page ids must be unique within a study',
        });
      }
      seen.add(page.id);
    });
  });
export type StudyGuide = z.infer<typeof StudyGuide>;

export const StudySummary = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  pageCount: z.number().int().positive(),
});
export type StudySummary = z.infer<typeof StudySummary>;

export const StudyTrail = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  studies: z.array(StudySummary).min(1),
});
export type StudyTrail = z.infer<typeof StudyTrail>;

// GET /v1/studies. Trails without studies yet are left out.
export const StudiesResponse = z.object({
  trails: z.array(StudyTrail),
});
export type StudiesResponse = z.infer<typeof StudiesResponse>;
