import { pagesLabel, studySteps } from './studyView';

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
