import path from 'path'

import { cloudflare } from '@cloudflare/vite-plugin'
import react from '@vitejs/plugin-react'
// vitest/config re-exports vite's defineConfig with the `test` block typed, so the
// build config and the test config stay in one file and share the `@` alias.
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // The Cloudflare plugin builds the Worker for `cf build` / `cf deploy`; vitest runs without it.
  plugins: [react(), ...(process.env.VITEST ? [] : [cloudflare()])],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 3001,
  },
  test: {
    // Node by default. Component suites (*.test.tsx) opt into jsdom with a
    // `// @vitest-environment jsdom` docblock.
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
