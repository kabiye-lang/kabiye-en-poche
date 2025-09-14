const path = require('path')

const buildEslintCommand = (filenames) =>
  `eslint --fix ${filenames.map((f) => path.relative(process.cwd(), f)).join(' ')}`

module.exports = {
  '*.{js,jsx,ts,tsx}': [buildEslintCommand],
  /**
   * Check this issues
   * https://github.com/okonet/lint-staged/issues/825
   * https://github.com/gustavopch/tsc-files
   * https://github.com/microsoft/TypeScript/issues/27379
   */
  '*.{ts,tsx}': "bash -c 'npm run ts:check'",
}
