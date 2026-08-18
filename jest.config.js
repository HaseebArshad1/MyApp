module.exports = {
  preset: 'react-native',
  // Clear jest.fn() call/instance history before every test. The
  // AsyncStorage jest mock defines getItem/setItem as jest.fn()s that live
  // for the whole test file, so without this their call counts leak across
  // tests (e.g. a getItem/setItem call-count assertion in one test can pick
  // up calls made by an earlier test). `clearMocks` only clears call
  // history — unlike `resetMocks`/`restoreMocks` it leaves the mock's
  // actual storage-backed implementation intact.
  clearMocks: true,
  // The react-native preset ships its own setupFiles (native module mocks,
  // Turbo module shims, etc.). Local `setupFiles` fully replaces (rather
  // than merges with) the preset's array, so we must spread the preset's
  // setup files back in before adding ours.
  setupFiles: [
    ...require('react-native/jest-preset').setupFiles,
    './jest.setup.js',
  ],
};
