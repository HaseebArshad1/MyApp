/**
 * @format
 */

import 'react-native';
import React from 'react';
import App from '../App';

// Note: import explicitly to use the types shipped with jest.
import {it} from '@jest/globals';

// Note: test renderer must be required after react-native.
import renderer, {act} from 'react-test-renderer';

// App now mounts the tap counter, which hydrates from storage
// asynchronously; flush that effect inside act() so the render is
// fully settled (and React doesn't warn about updates outside act()).
const flush = () => new Promise<void>(resolve => setTimeout(resolve, 0));

it('renders correctly', async () => {
  await act(async () => {
    renderer.create(<App />);
    await flush();
  });
});
