import path from 'path'

import react from '@vitejs/plugin-react'
// vitest/config re-exports vite's defineConfig with the `test` block typed, so the
// build config and the test config stay in one file and share the `@` alias.
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 3001,
  },
  test: {
    // These suites cover pure logic and fetch/Supabase boundaries, not components,
    // so node is enough — no jsdom. Revisit if component tests are added.
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
