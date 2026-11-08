import type { StudyGroup, StudyGuide } from '@libras/contracts';
import { create } from 'zustand';

import { prefetchImages } from '@/shared/lib/prefetchImages';

import { getStudies } from '../api/getStudies';
import { getStudy } from '../api/getStudy';

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

// Past this, the study opens anyway; images still missing load (or fail) when shown.
const prefetchTimeoutMs = 5000;

type StudyState = {
  listStatus: LoadStatus;
  groups: StudyGroup[];
  guideStatus: LoadStatus;
  guide: StudyGuide | null;
  pageIndex: number;
  /** Bumped on every open or close, so a late response of a study left behind is dropped. */
  openRequest: number;
  loadStudies: () => Promise<void>;
  openStudy: (studyId: string) => Promise<void>;
  nextPage: () => 'next' | 'finished';
  previousPage: () => void;
  closeStudy: () => void;
};

function guideImageUrls(guide: StudyGuide): string[] {
  return guide.pages
    .flatMap((page) => page.blocks)
    .flatMap((block) => (block.type === 'sign' ? block.images : []))
    .map((image) => image.url);
}

export const useStudyStore = create<StudyState>()((set, get) => ({
  listStatus: 'idle',
  groups: [],
  guideStatus: 'idle',
  guide: null,
  pageIndex: 0,
  openRequest: 0,

  loadStudies: async () => {
    const hasList = get().listStatus === 'ready';
    if (!hasList) set({ listStatus: 'loading' });

    try {
      const { groups } = await getStudies();
      set({ listStatus: 'ready', groups });
    } catch {
      // A failed reload keeps the last list on screen; the error state is only for a first load.
      if (!hasList) set({ listStatus: 'error' });
    }
  },

  openStudy: async (studyId) => {
    const request = get().openRequest + 1;
    set({ openRequest: request, guideStatus: 'loading', guide: null, pageIndex: 0 });
    const isCurrent = () => get().openRequest === request;

    let guide: StudyGuide;
    try {
      guide = await getStudy(studyId);
    } catch {
      if (isCurrent()) set({ guideStatus: 'error' });
      return;
    }
    if (!isCurrent()) return;

    await prefetchImages(guideImageUrls(guide), prefetchTimeoutMs);
    if (isCurrent()) set({ guideStatus: 'ready', guide });
  },

  nextPage: () => {
    const { guide, pageIndex } = get();
    if (!guide || pageIndex >= guide.pages.length - 1) return 'finished';

    set({ pageIndex: pageIndex + 1 });
    return 'next';
  },

  previousPage: () => {
    set({ pageIndex: Math.max(0, get().pageIndex - 1) });
  },

  closeStudy: () => {
    set({ openRequest: get().openRequest + 1, guideStatus: 'idle', guide: null, pageIndex: 0 });
  },
}));
