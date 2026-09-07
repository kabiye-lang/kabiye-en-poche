const preset = require('jest-expo/jest-preset')

module.exports = {
  ...preset,
  setupFiles: [...(preset.setupFiles || []), './jest.setup.js'],
  // pnpm stores every package under node_modules/.pnpm/<mangled>/node_modules/<pkg>,
  // so a bare `node_modules/(?!allowed)` matches at the `.pnpm` segment and ends up
  // ignoring the very packages the allowlist is meant to transform. `(?!.*/node_modules/)`
  // pins the match to the last node_modules segment, which is the real package name.
  transformIgnorePatterns: [
    'node_modules/(?!.*/node_modules/)(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|standard-navigation|@sentry/react-native|native-base|react-native-svg|phosphor-react-native|sonner-native|uniwind|tailwind-variants|tailwind-merge|@lingui|@messageformat)',
  ],
  transform: {
    ...preset.transform,
    '\\.mjs$': ['babel-jest', { plugins: ['@babel/plugin-transform-modules-commonjs'] }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    ...(preset.moduleNameMapper || {}),
  },
}
