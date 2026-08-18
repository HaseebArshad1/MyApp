/**
 * @format
 */

import {useCallback, useEffect, useRef, useState} from 'react';

import {loadCount, saveCount} from './counterStorage';

export type UseTapCounterResult = {
  count: number;
  increment: () => void;
  reset: () => void;
  hydrated: boolean;
};

/**
 * Stateful tap counter backed by local persistent storage.
 *
 * - `increment` uses the functional `setCount` updater so rapid taps never
 *   drop or double-count, even when several taps land in the same React
 *   batch.
 * - The persisted value is only written once the initial `loadCount()` read
 *   has resolved (`hydrated`), so the freshly-mounted initial `0` never races
 *   with, and overwrites, a previously stored value.
 */
export function useTapCounter(): UseTapCounterResult {
  const [count, setCount] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    loadCount().then(storedCount => {
      if (!isMounted.current) {
        return;
      }
      setCount(storedCount);
      setHydrated(true);
    });
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    // Local persistence is best-effort: a failed write must not crash the
    // app or surface as an unhandled promise rejection. The in-memory count
    // keeps working regardless; the next successful write catches up.
    saveCount(count).catch(() => {});
  }, [count, hydrated]);

  const increment = useCallback(() => {
    setCount(c => c + 1);
  }, []);

  const reset = useCallback(() => {
    setCount(0);
  }, []);

  return {count, increment, reset, hydrated};
}
