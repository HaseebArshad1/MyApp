module.exports = {
  preset: 'react-native',
  // The react-native preset ships its own setupFiles (native module mocks,
  // Turbo module shims, etc.). Local `setupFiles` fully replaces (rather
  // than merges with) the preset's array, so we must spread the preset's
  // setup files back in before adding ours.
  setupFiles: [
    ...require('react-native/jest-preset').setupFiles,
    './jest.setup.js',
  ],
};
