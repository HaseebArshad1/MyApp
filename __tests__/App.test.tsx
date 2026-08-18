/**
 * @format
 */

import 'react-native';
import React from 'react';
import App from '../App';

// Note: import explicitly to use the types shipped with jest.
import {it} from '@jest/globals';

// Note: test renderer must be required after react-native.
import {act, create} from 'react-test-renderer';

it('renders correctly', async () => {
  await act(async () => {
    create(<App />);
  });
  // App mounts a counter that hydrates from async storage; flush that
  // pending work inside act() so the update isn't reported as unwrapped.
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
  });
});
