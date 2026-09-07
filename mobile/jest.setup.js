// Workaround for expo/expo#36831 — expo's installGlobal sets up lazy getters
// whose require() calls fail in jest's runtime scope.
// Mock the problematic modules so the lazy require calls succeed.
// See: https://github.com/expo/expo/issues/36831

jest.mock('expo/src/winter/ImportMetaRegistry', () => ({
  ImportMetaRegistry: {
    get url() {
      return null
    },
  },
}))

jest.mock('@ungap/structured-clone', () => ({
  default: (obj) => JSON.parse(JSON.stringify(obj)),
}))

// Expo 56: runtime.native.ts installs a lazy getter for `fetch` that
// requires expo/src/winter/fetch which loads a native module (ExpoFetchModule).
// Mock it to prevent the "file outside scope" error in Jest.
jest.mock('expo/src/winter/fetch', () => ({
  fetch: jest.fn(),
}))

// Reanimated drives every entering animation in the app. Its native module cannot load
// under Jest ("Cannot read properties of undefined (reading 'loadUnpackers')"), which
// fails the whole suite the moment a screen under test imports it -- so any screen that
// gains an animation would otherwise break its own test. The library ships a mock for
// exactly this; it renders the views and makes the animations no-ops.
jest.mock('react-native-reanimated')
