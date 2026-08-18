/**
 * Hook that exposes the persisted tap counter used on the home screen.
 *
 * @format
 */

import {useCallback, useEffect, useState} from 'react';

import {loadCount, saveCount} from './counterStorage';

export type UseTapCounterResult = {
  count: number;
  increment: () => void;
  reset: () => void;
  hydrated: boolean;
};

export function useTapCounter(): UseTapCounterResult {
  const [count, setCount] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    loadCount().then(storedCount => {
      if (isMounted) {
        setCount(storedCount);
        setHydrated(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    saveCount(count);
  }, [count, hydrated]);

  const increment = useCallback(() => {
    // Functional updater so rapid, same-tick taps each apply their own +1
    // instead of batching into a single stale `count + 1`.
    setCount(c => c + 1);
  }, []);

  const reset = useCallback(() => {
    setCount(0);
  }, []);

  return {count, increment, reset, hydrated};
}
