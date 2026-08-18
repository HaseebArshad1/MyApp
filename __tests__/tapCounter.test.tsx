/**
 * @format
 */

import React from 'react';
import {Text} from 'react-native';
import {act, create} from 'react-test-renderer';

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  loadCount,
  saveCount,
  STORAGE_KEY,
} from '../src/counter/counterStorage';
import {useTapCounter} from '../src/counter/useTapCounter';

function flushMicrotasks(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

// The AsyncStorage jest mock exposes persistent jest.fn()s for its methods
// that are shared across every test in this file. jest.spyOn on an
// already-mocked function does not reset that shared call history, so
// without an explicit clear, later tests would see call counts left over
// from earlier ones. Clearing mock call history (not stored data) before
// every test keeps each test's assertions scoped to its own behavior.
beforeEach(() => {
  jest.clearAllMocks();
});

describe('counterStorage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('returns 0 when nothing is stored', async () => {
    expect(await loadCount()).toBe(0);
  });

  it('round-trips a saved value', async () => {
    await saveCount(42);
    expect(await loadCount()).toBe(42);
  });

  it('returns 0 for a non-numeric stored value', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, 'not-a-number');
    expect(await loadCount()).toBe(0);
  });
});

type HarnessState = {
  count: number;
  increment: () => void;
  reset: () => void;
  hydrated: boolean;
};

function Harness({
  onChange,
}: {
  onChange: (state: HarnessState) => void;
}): React.JSX.Element {
  const state = useTapCounter();
  onChange(state);
  return <Text>{state.count}</Text>;
}

async function mountHarness(): Promise<{states: HarnessState[]}> {
  const states: HarnessState[] = [];
  await act(async () => {
    create(<Harness onChange={s => states.push(s)} />);
  });
  // Let the loadCount() promise (and the state update it triggers) settle.
  await act(async () => {
    await flushMicrotasks();
  });
  return {states};
}

describe('useTapCounter', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('starts at 0 and hydrates on mount', async () => {
    const {states} = await mountHarness();
    const last = states[states.length - 1];
    expect(last.count).toBe(0);
    expect(last.hydrated).toBe(true);
  });

  it('increments by exactly one per call', async () => {
    const {states} = await mountHarness();
    await act(async () => {
      states[states.length - 1].increment();
    });
    expect(states[states.length - 1].count).toBe(1);
  });

  it('handles N rapid synchronous increments without dropping or double-counting', async () => {
    const {states} = await mountHarness();
    const N = 20;
    const {increment} = states[states.length - 1];
    await act(async () => {
      for (let i = 0; i < N; i++) {
        increment();
      }
    });
    expect(states[states.length - 1].count).toBe(N);
  });

  it('resets the count back to 0', async () => {
    const {states} = await mountHarness();
    await act(async () => {
      states[states.length - 1].increment();
      states[states.length - 1].increment();
    });
    expect(states[states.length - 1].count).toBe(2);

    await act(async () => {
      states[states.length - 1].reset();
    });
    expect(states[states.length - 1].count).toBe(0);
  });

  it('hydrates to a pre-seeded stored value instead of 0', async () => {
    await saveCount(7);
    const {states} = await mountHarness();
    expect(states[states.length - 1].count).toBe(7);
  });

  it('does not write to storage before hydration completes', async () => {
    // Hold the initial getItem() read pending so we can observe exactly
    // what happens *before* hydration resolves, not just the eventual
    // ordering of calls. If the `hydrated` guard were ever removed, the
    // persist effect would call setItem(0) synchronously on mount, long
    // before this deferred getItem() promise resolves — this test fails
    // in that case.
    let resolveGetItem: (value: string | null) => void = () => {};
    const getItemSpy = jest
      .spyOn(AsyncStorage, 'getItem')
      .mockImplementation(
        () =>
          new Promise<string | null>(resolve => {
            resolveGetItem = resolve;
          }),
      );
    const setItemSpy = jest.spyOn(AsyncStorage, 'setItem');

    let renderer: ReturnType<typeof create> | undefined;
    act(() => {
      renderer = create(<Harness onChange={() => {}} />);
    });

    // Hydration has started (getItem was called) but has not resolved yet:
    // nothing should have been written to storage.
    expect(getItemSpy).toHaveBeenCalledTimes(1);
    expect(setItemSpy).not.toHaveBeenCalled();

    // Resolve the pending read and let hydration complete.
    await act(async () => {
      resolveGetItem(null);
      await flushMicrotasks();
    });

    // Only once hydration has completed does the persist effect run.
    expect(setItemSpy).toHaveBeenCalled();

    renderer?.unmount();
    getItemSpy.mockRestore();
    setItemSpy.mockRestore();
  });
});
