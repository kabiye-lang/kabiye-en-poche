// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config')
const expoConfig = require('eslint-config-expo/flat')
const reactCompiler = require('eslint-plugin-react-compiler')
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended')

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist', 'admin', 'supabase', 'website'],
  },
  {
    rules: {
      'react-compiler/react-compiler': 'error',
      'prettier/prettier': [
        'error',
        {
          plugins: ['@ianvs/prettier-plugin-sort-imports', 'prettier-plugin-tailwindcss'],
          tailwindFunctions: ['tv'],
          trailingComma: 'es5',
          tabWidth: 2,
          printWidth: 120,
          semi: false,
          singleQuote: true,
          importOrder: [
            '<TYPES>',
            '<TYPES>^[.]',
            '',
            '^react',
            '^react-native',
            '',
            '^shared',
            '',
            '^@next',
            '^next',
            '^next/.*$',
            '^expo',
            '^expo/.*$',
            '',
            '<BUILT_IN_MODULES>',
            '',
            '<THIRD_PARTY_MODULES>',
            '',
            '^@/.*$',
            '',
            '^[.]',
          ],
        },
      ],
    },
  },
  reactCompiler.configs.recommended,
  eslintPluginPrettierRecommended,
  {
    files: ['jest.setup.js', '**/__tests__/**/*', '**/__mocks__/**/*'],
    languageOptions: {
      globals: {
        jest: 'readonly',
        expect: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        beforeAll: 'readonly',
        beforeEach: 'readonly',
        afterAll: 'readonly',
        afterEach: 'readonly',
      },
    },
  },
  {
    settings: {
      // Fix for ESLint 10+: eslint-plugin-react uses context.getFilename() (legacy API)
      // which was removed in ESLint 10 flat config. Declaring the version explicitly
      // prevents the plugin from trying to auto-detect it and failing.
      react: { version: '19' },
    },
  },
])
