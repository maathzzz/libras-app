import { lessonSteps } from './lessonProgress';

describe('lessonSteps', () => {
  it('starts with every segment empty', () => {
    expect(lessonSteps(3, 0, false)).toEqual([0, 0, 0]);
  });

  it('fills the current segment once it is checked', () => {
    expect(lessonSteps(3, 1, false)).toEqual([1, 0, 0]);
    expect(lessonSteps(3, 1, true)).toEqual([1, 1, 0]);
  });

  it('is full after the last exercise is checked', () => {
    expect(lessonSteps(3, 2, true)).toEqual([1, 1, 1]);
  });
});
