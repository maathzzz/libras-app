'use client';

import { useCallback, useEffect, useState } from 'react';

export type DataState<T> =
  { status: 'loading' } | { status: 'error'; error: unknown } | { status: 'ready'; data: T };

// Loads data from the BFF when the screen opens. `reload` fetches again after a change and
// keeps showing the current data meanwhile, so the screen does not flash "Carregando…".
// `load` must be stable (a module function or a useCallback).
export function useApiData<T>(load: () => Promise<T>) {
  const [state, setState] = useState<DataState<T>>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let current = true;
    load().then(
      (data) => {
        if (current) setState({ status: 'ready', data });
      },
      (error: unknown) => {
        if (current) setState({ status: 'error', error });
      },
    );
    return () => {
      current = false;
    };
  }, [load, attempt]);

  const reload = useCallback(() => setAttempt((value) => value + 1), []);

  return { state, reload };
}
