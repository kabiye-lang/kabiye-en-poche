module.exports = {
  locales: ['en', 'fr'],
  sourceLocale: 'en',
  catalogs: [
    {
      path: '<rootDir>/src/locales/{locale}/messages',
      include: ['<rootDir>/src'],
      exclude: ['**/node_modules/**'],
    },
  ],
  format: 'po',
  formatOptions: {
    origins: true,
    lineNumbers: false,
  },
  orderBy: 'messageId',
  fallbackLocales: {
    default: 'en',
  },
}
