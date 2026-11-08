import { describe, expect, it } from 'vitest';

import { StudiesResponse, StudyGuide } from './study';

const page = (id: string) => ({
  id,
  title: 'Letras A a F',
  blocks: [
    { type: 'text', body: 'Cada letra tem uma configuração de mão.' },
    {
      type: 'sign',
      label: 'A',
      images: [{ url: 'https://cdn.example/a.png', alt: 'Configuração de mão da letra A' }],
      description: 'Mão fechada, polegar ao lado do indicador.',
    },
    { type: 'tip', body: 'Use a mão dominante.' },
  ],
});

const guide = {
  id: 'alfabeto-manual',
  groupId: 'primeiros-passos',
  title: 'Alfabeto manual',
  description: 'Aprenda as letras antes de praticar.',
  pages: [page('p1'), page('p2')],
};

describe('StudyGuide', () => {
  it('accepts a valid study', () => {
    expect(StudyGuide.parse(guide)).toEqual(guide);
  });

  it('accepts a sign block without a description', () => {
    const sign = {
      type: 'sign',
      label: 'B',
      images: [{ url: 'https://cdn.example/b.png', alt: 'Configuração de mão da letra B' }],
    };
    const result = StudyGuide.safeParse({
      ...guide,
      pages: [{ id: 'p1', title: 'B', blocks: [sign] }],
    });

    expect(result.success).toBe(true);
  });

  it('accepts a sign block with frames side by side', () => {
    const sign = {
      type: 'sign',
      label: 'H',
      images: [
        { url: 'https://cdn.example/h-1.png', alt: 'Início do sinal da letra H' },
        { url: 'https://cdn.example/h-2.png', alt: 'Fim do sinal da letra H' },
      ],
    };
    const result = StudyGuide.safeParse({
      ...guide,
      pages: [{ id: 'p1', title: 'H', blocks: [sign] }],
    });

    expect(result.success).toBe(true);
  });

  it('accepts a heading block', () => {
    const result = StudyGuide.safeParse({
      ...guide,
      pages: [{ id: 'p1', title: 'Seções', blocks: [{ type: 'heading', text: 'Vogais' }] }],
    });

    expect(result.success).toBe(true);
  });

  it('rejects an empty heading', () => {
    const result = StudyGuide.safeParse({
      ...guide,
      pages: [{ id: 'p1', title: 'Seções', blocks: [{ type: 'heading', text: '' }] }],
    });

    expect(result.success).toBe(false);
  });

  it('rejects a study without pages', () => {
    expect(StudyGuide.safeParse({ ...guide, pages: [] }).success).toBe(false);
  });

  it('rejects a page without blocks', () => {
    expect(
      StudyGuide.safeParse({ ...guide, pages: [{ id: 'p1', title: 'Vazia', blocks: [] }] }).success,
    ).toBe(false);
  });

  it('rejects an unknown block type', () => {
    const result = StudyGuide.safeParse({
      ...guide,
      pages: [{ id: 'p1', title: 'Vídeo', blocks: [{ type: 'video', url: 'https://x/v.mp4' }] }],
    });

    expect(result.success).toBe(false);
  });

  it('rejects a sign block without images', () => {
    const result = StudyGuide.safeParse({
      ...guide,
      pages: [{ id: 'p1', title: 'A', blocks: [{ type: 'sign', label: 'A', images: [] }] }],
    });

    expect(result.success).toBe(false);
  });

  it('rejects repeated page ids', () => {
    const result = StudyGuide.safeParse({ ...guide, pages: [page('p1'), page('p1')] });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['pages', 1, 'id']);
  });
});

describe('StudiesResponse', () => {
  const response = {
    groups: [
      {
        id: 'primeiros-passos',
        title: 'Primeiros passos',
        studies: [
          { id: 'alfabeto-manual', title: 'Alfabeto manual', description: 'Letras', pageCount: 6 },
        ],
      },
    ],
  };

  it('accepts a valid list', () => {
    expect(StudiesResponse.parse(response)).toEqual(response);
  });

  it('accepts no groups', () => {
    expect(StudiesResponse.parse({ groups: [] })).toEqual({ groups: [] });
  });

  it('rejects a study without pages', () => {
    const [group] = response.groups;
    const result = StudiesResponse.safeParse({
      groups: [{ ...group, studies: [{ ...group?.studies[0], pageCount: 0 }] }],
    });

    expect(result.success).toBe(false);
  });
});
