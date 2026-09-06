// https://docs.expo.dev/guides/using-eslint/
import tsParser from '@typescript-eslint/parser'
import expoConfig from 'eslint-config-expo/flat.js'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import reactYouMightNotNeedAnEffect from 'eslint-plugin-react-you-might-not-need-an-effect'
import refined from 'eslint-plugin-refined'
import { defineConfig } from 'eslint/config'

// eslint-config-expo registers @typescript-eslint itself, at its own version (8.67
// where this package depends on 8.61), so pnpm resolves two distinct plugin objects.
// Registering the second one is "Cannot redefine plugin" in ESLint 10, and simply
// dropping it means the @typescript-eslint/* rules below have no plugin in their own
// config object to resolve against. Reuse Expo's instance for both.
const tsEslint = (Array.isArray(expoConfig) ? expoConfig : [expoConfig]).find(
  (entry) => entry?.plugins?.['@typescript-eslint']
)?.plugins['@typescript-eslint']

export default defineConfig([
  // 1. Base / Third-party configs first
  expoConfig,
  reactYouMightNotNeedAnEffect.configs.recommended,
  eslintPluginPrettierRecommended, // Loaded here so your custom overrides below win

  // 2. Global Ignores
  {
    ignores: ['dist/*', '**/.expo/', 'node_modules', 'admin', 'supabase', 'website', 'index.js', '__mocks__'],
  },

  // 3. Your Custom Rules & Overrides
  {
    plugins: { refined, '@typescript-eslint': tsEslint },
    rules: {
      ...refined.configs.strict.rules,
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'posthog-react-native',
              message:
                'Import from shared/lib/analytics instead. Direct PostHog SDK imports are banned outside the analytics module.',
            },
          ],
        },
      ],
      'import/order': 'off',

      // FIXED: Turn off base rule for TS files, turn on TS-specific version
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],

      '@typescript-eslint/no-explicit-any': 'error',
      'react-hooks/rules-of-hooks': 'error',

      'no-restricted-syntax': [
        'warn',
        {
          selector:
            ":matches(CallExpression[callee.object.name='React'][callee.property.name='useEffect'], CallExpression[callee.name='useEffect']) > :matches(ArrowFunctionExpression, FunctionExpression:not([id]))",
          message:
            "Functions passed to 'useEffect' must be named to document intent. More info: https://x.com/housecor/status/1750980809874436431.",
        },
      ],

      // FIXED: Placed after the recommended plugin so these custom settings apply
      'prettier/prettier': [
        'error',
        {
          plugins: ['@ianvs/prettier-plugin-sort-imports'],
          trailingComma: 'es5',
          tabWidth: 2,
          printWidth: 120,
          semi: false,
          singleQuote: true,
          pluginSearchDirs: false,
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

  // 4. Test-specific overrides (Must come after general rules)
  {
    files: ['**/*.test.ts', '**/*.spec.ts', '**/*.test.tsx', '**/*.spec.tsx', '**/__tests__/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // 4b. Jest setup file globals
  {
    files: ['jest.setup.js', 'jest.setup.ts'],
    languageOptions: {
      globals: {
        jest: 'readonly',
        expect: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
  },

  // 4c. Scripts — allow modern syntax (import attributes)
  {
    files: ['scripts/**/*.js'],
    languageOptions: {
      ecmaVersion: 2025,
    },
  },

  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // 5. Global Settings
  {
    settings: {
      react: { version: '19' },
    },
  },
])
