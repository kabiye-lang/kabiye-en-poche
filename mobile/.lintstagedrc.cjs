module.exports = {
  '*.{js,jsx,ts,tsx}': 'bash -c "pnpm run lint"',
  /**
   * Check this issues
   * https://github.com/okonet/lint-staged/issues/825
   * https://github.com/gustavopch/tsc-files
   * https://github.com/microsoft/TypeScript/issues/27379
   */
  '*.{ts,tsx}': "bash -c 'pnpm run check-types'",
}
