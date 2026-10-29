import type { HomeResponse } from '@libras/contracts';
import { create } from 'zustand';

import { isNetworkError } from '@/shared/api/client';
import type { LoadErrorReason } from '@/shared/ui';

import { getHome } from '../api/getHome';

type HomeStatus = 'idle' | 'loading' | 'ready' | 'error';

type HomeState = {
  status: HomeStatus;
  home: HomeResponse | null;
  /** Why the first load failed; null otherwise. */
  errorReason: LoadErrorReason | null;
  refreshing: boolean;
  load: () => Promise<void>;
  refresh: () => Promise<void>;
};

export const useHomeStore = create<HomeState>()((set, get) => ({
  status: 'idle',
  home: null,
  errorReason: null,
  refreshing: false,

  load: async () => {
    if (!get().home) set({ status: 'loading', errorReason: null });

    try {
      set({ status: 'ready', home: await getHome(), errorReason: null });
    } catch (error) {
      // A failed reload keeps the last home on screen; the error state is only for a first load.
      if (get().home) return;
      set({ status: 'error', errorReason: isNetworkError(error) ? 'offline' : 'server' });
    }
  },

  refresh: async () => {
    set({ refreshing: true });
    await get().load();
    set({ refreshing: false });
  },
}));
