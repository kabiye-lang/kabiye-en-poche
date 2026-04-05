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
