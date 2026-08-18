/**
 * @format
 */

import React from 'react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import renderer, {act} from 'react-test-renderer';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  loadCount,
  saveCount,
  STORAGE_KEY,
} from '../src/counter/counterStorage';
import {
  useTapCounter,
  UseTapCounterResult,
} from '../src/counter/useTapCounter';

// Resolves once the current microtask queue (e.g. the getItem/then chain
// inside useTapCounter's hydration effect) has fully drained.
const flush = () => new Promise<void>(resolve => setTimeout(resolve, 0));

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('counterStorage', () => {
  it('returns 0 when nothing is stored', async () => {
    await expect(loadCount()).resolves.toBe(0);
  });

  it('round-trips a saved value', async () => {
    await saveCount(7);
    await expect(loadCount()).resolves.toBe(7);
  });

  it('returns 0 for a non-numeric stored value', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, 'not-a-number');
    await expect(loadCount()).resolves.toBe(0);
  });
});

describe('useTapCounter', () => {
  let latest: UseTapCounterResult;
  let currentRenderer: ReturnType<typeof renderer.create> | null = null;

  function Harness() {
    latest = useTapCounter();
    return null;
  }

  // Mounts a fresh Harness and waits for its hydration effect to settle.
  // `currentRenderer` is always torn down in `afterEach` below so no
  // component (and no pending effect) from one test is ever still alive
  // when the next test starts.
  async function mountHarness(): Promise<void> {
    await act(async () => {
      currentRenderer = renderer.create(<Harness />);
      await flush();
    });
  }

  afterEach(() => {
    if (currentRenderer) {
      const toUnmount = currentRenderer;
      currentRenderer = null;
      act(() => {
        toUnmount.unmount();
      });
    }
  });

  it('starts at 0 and hydrates when nothing is stored', async () => {
    await mountHarness();

    expect(latest.count).toBe(0);
    expect(latest.hydrated).toBe(true);
  });

  it('increments by exactly one per call', async () => {
    await mountHarness();

    act(() => {
      latest.increment();
    });

    expect(latest.count).toBe(1);
  });

  it('does not drop or double-count rapid increments', async () => {
    await mountHarness();

    const taps = 20;
    act(() => {
      for (let i = 0; i < taps; i += 1) {
        latest.increment();
      }
    });

    expect(latest.count).toBe(taps);
  });

  it('resets the count to 0 after incrementing', async () => {
    await mountHarness();

    act(() => {
      latest.increment();
      latest.increment();
    });
    expect(latest.count).toBe(2);

    act(() => {
      latest.reset();
    });
    expect(latest.count).toBe(0);
  });

  it('hydrates from a pre-seeded stored value instead of 0', async () => {
    await saveCount(5);

    await mountHarness();

    expect(latest.count).toBe(5);
  });

  it('reads storage before it ever writes, and writes nothing before hydration completes', async () => {
    const getItemSpy = jest.spyOn(AsyncStorage, 'getItem');
    const setItemSpy = jest.spyOn(AsyncStorage, 'setItem');

    act(() => {
      currentRenderer = renderer.create(<Harness />);
    });

    // The hydration `getItem` call is in flight but its promise has not
    // resolved yet, so nothing should have been persisted synchronously.
    expect(setItemSpy).not.toHaveBeenCalled();

    await act(async () => {
      await flush();
    });

    // Hydration has now completed and persisted the (still-0) count, but
    // only *after* reading the existing value first. Asserting relative
    // call order (rather than an absolute call count) keeps this
    // assertion meaningful and immune to how many times AsyncStorage was
    // touched by any other test.
    expect(getItemSpy).toHaveBeenCalled();
    expect(setItemSpy).toHaveBeenCalled();
    expect(getItemSpy.mock.invocationCallOrder[0]).toBeLessThan(
      setItemSpy.mock.invocationCallOrder[0],
    );

    getItemSpy.mockRestore();
    setItemSpy.mockRestore();
  });
});
