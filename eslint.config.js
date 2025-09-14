// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config')
const expoConfig = require('eslint-config-expo/flat')
const reactCompiler = require('eslint-plugin-react-compiler')
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended')

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
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
])
