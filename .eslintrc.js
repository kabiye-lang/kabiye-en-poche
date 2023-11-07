module.exports = {
  root: true,
  extends: [
    'universe/native',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/stylistic',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
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
    'import/order': 'off',
    'react-hooks/exhaustive-deps': 'warn',
    'no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],
  },
}