import type { HomeResponse } from '@libras/contracts';
import { create } from 'zustand';

import { getHome } from '../api/getHome';

type HomeStatus = 'idle' | 'loading' | 'ready' | 'error';

type HomeState = {
  status: HomeStatus;
  home: HomeResponse | null;
  refreshing: boolean;
  load: () => Promise<void>;
  refresh: () => Promise<void>;
};

export const useHomeStore = create<HomeState>()((set, get) => ({
  status: 'idle',
  home: null,
  refreshing: false,

  load: async () => {
    if (!get().home) set({ status: 'loading' });

    try {
      set({ status: 'ready', home: await getHome() });
    } catch {
      // A failed reload keeps the last home on screen; the error state is only for a first load.
      if (!get().home) set({ status: 'error' });
    }
  },

  refresh: async () => {
    set({ refreshing: true });
    await get().load();
    set({ refreshing: false });
  },
}));
