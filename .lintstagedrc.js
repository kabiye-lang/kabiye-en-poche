const path = require('path')

const buildEslintCommand = (filenames) =>
  `eslint --fix ${filenames.map((f) => path.relative(process.cwd(), f)).join(' ')}`

const buildAdminEslintCommand = (filenames) =>
  `cd admin && npx eslint --fix ${filenames.map((f) => path.relative('admin', f)).join(' ')}`

const buildWebsiteEslintCommand = (filenames) =>
  `cd website && npx eslint --fix ${filenames.map((f) => path.relative('website', f)).join(' ')}`

module.exports = {
  'admin/**/*.{js,jsx,ts,tsx}': [buildAdminEslintCommand],
  'website/**/*.{js,jsx,ts,tsx}': [buildWebsiteEslintCommand],
  '*.{js,jsx,ts,tsx}': [buildEslintCommand],
  '!(admin|website)/**/*.{js,jsx,ts,tsx}': [buildEslintCommand],
  /**
   * Check this issues
   * https://github.com/okonet/lint-staged/issues/825
   * https://github.com/gustavopch/tsc-files
   * https://github.com/microsoft/TypeScript/issues/27379
   */
  '*.{ts,tsx}': "bash -c 'npm run ts:check'",
}
