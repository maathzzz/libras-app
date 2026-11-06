import type { StudyBlock } from '@libras/contracts';

import { pagesLabel, signFrameSize, studyRows, studySteps } from './studyView';

const sign = (label: string, frames = 1): StudyBlock => ({
  type: 'sign',
  label,
  images: Array.from({ length: frames }, (_, index) => ({
    url: `https://cdn.example/${label}-${index}.png`,
    alt: `Quadro ${index + 1} do sinal`,
  })),
});

const labels = (rows: ReturnType<typeof studyRows>) =>
  rows.map((row) =>
    row.kind === 'full'
      ? row.block.type === 'sign'
        ? `full:${row.block.label}`
        : `full:${row.block.type}`
      : row.signs.map((block) => block.label).join('+'),
  );

describe('studyRows', () => {
  it('pairs single-frame signs', () => {
    expect(labels(studyRows([sign('A'), sign('B'), sign('C'), sign('D'), sign('E')]))).toEqual([
      'A+B',
      'C+D',
      'E',
    ]);
  });

  it('gives a sign with several frames a row of its own, keeping the order', () => {
    const blocks = [sign('G'), sign('H', 2), sign('I'), sign('J', 2), sign('K', 2), sign('L')];

    expect(labels(studyRows(blocks))).toEqual(['G', 'full:H', 'I', 'full:J', 'full:K', 'L']);
  });

  it('does not pair signs across other blocks', () => {
    const blocks: StudyBlock[] = [
      sign('A'),
      { type: 'heading', text: 'Vogais' },
      sign('E'),
      sign('I'),
      { type: 'text', body: 'Agora as consoantes.' },
      sign('B'),
    ];

    expect(labels(studyRows(blocks))).toEqual(['A', 'full:heading', 'E+I', 'full:text', 'B']);
  });
});

describe('signFrameSize', () => {
  const base = { columnInner: 146, fullInner: 330, frameGap: 6, maxFrame: 140 };

  it('caps a single frame at the largest size', () => {
    expect(signFrameSize({ ...base, frameCount: 1 })).toBe(140);
  });

  it('fills a narrow column', () => {
    expect(signFrameSize({ ...base, columnInner: 120, frameCount: 1 })).toBe(120);
  });

  it('keeps two frames at the size of a single one when they fit', () => {
    expect(signFrameSize({ ...base, frameCount: 2 })).toBe(140);
  });

  it('shrinks the frames that would not fit side by side', () => {
    expect(signFrameSize({ ...base, frameCount: 3 })).toBe(106);
  });
});

describe('pagesLabel', () => {
  it('uses the singular for one page', () => {
    expect(pagesLabel(1)).toBe('1 página');
  });

  it('uses the plural for more pages', () => {
    expect(pagesLabel(6)).toBe('6 páginas');
  });
});

describe('studySteps', () => {
  it('fills the pages up to the current one', () => {
    expect(studySteps(4, 1)).toEqual([1, 1, 0, 0]);
  });

  it('fills every page on the last one', () => {
    expect(studySteps(3, 2)).toEqual([1, 1, 1]);
  });
});
