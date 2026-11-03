import { useEffect, useState } from 'react';
import { subscribe } from './store';

/** Loads data and re-loads it after any write anywhere in the app. */
export function useData<T>(load: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const off = subscribe(() => setVersion((v) => v + 1));
    return () => off();
  }, []);
  useEffect(() => {
    let live = true;
    load()
      .then((d) => live && (setData(d), setError(null)))
      .catch((e) => live && setError(e?.message ?? 'Could not load data.'));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version]);
  return { data, error, loading: data === undefined && !error };
}

export function useIsDesktop() {
  const q = '(min-width: 900px)';
  const [m, setM] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const on = () => setM(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return m;
}
