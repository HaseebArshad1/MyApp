/**
 * @format
 */

import React from 'react';
import {beforeEach, describe, expect, it, jest} from '@jest/globals';
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

  function Harness() {
    latest = useTapCounter();
    return null;
  }

  it('starts at 0 and hydrates when nothing is stored', async () => {
    await act(async () => {
      renderer.create(<Harness />);
      await flush();
    });

    expect(latest.count).toBe(0);
    expect(latest.hydrated).toBe(true);
  });

  it('increments by exactly one per call', async () => {
    await act(async () => {
      renderer.create(<Harness />);
      await flush();
    });

    act(() => {
      latest.increment();
    });

    expect(latest.count).toBe(1);
  });

  it('does not drop or double-count rapid increments', async () => {
    await act(async () => {
      renderer.create(<Harness />);
      await flush();
    });

    const taps = 20;
    act(() => {
      for (let i = 0; i < taps; i += 1) {
        latest.increment();
      }
    });

    expect(latest.count).toBe(taps);
  });

  it('resets the count to 0 after incrementing', async () => {
    await act(async () => {
      renderer.create(<Harness />);
      await flush();
    });

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

    await act(async () => {
      renderer.create(<Harness />);
      await flush();
    });

    expect(latest.count).toBe(5);
  });

  it('does not write to storage before hydration completes', async () => {
    const setItemSpy = jest.spyOn(AsyncStorage, 'setItem');

    act(() => {
      renderer.create(<Harness />);
    });

    expect(setItemSpy).not.toHaveBeenCalled();

    await act(async () => {
      await flush();
    });

    setItemSpy.mockRestore();
  });
});
