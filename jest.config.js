const preset = require('jest-expo/jest-preset')

module.exports = {
  ...preset,
  setupFiles: [...(preset.setupFiles || []), './jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|phosphor-react-native|sonner-native|uniwind|tailwind-variants|tailwind-merge|@lingui|@messageformat)',
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
