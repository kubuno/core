import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { defineConfig } from 'vitest/config'

// Node-side tests of the compiler package: WASM, golden plans, emitted modules, kbview-tsc, Vite plugin, HMR
// in a real browser. The runtime conformance suite (jsdom) has its own config: vitest.conformance.config.ts.
export default defineConfig({
  cacheDir: join(tmpdir(), 'kbview-compiler-vitest'),
  test: {
    include: ['test/*.test.ts'],
    environment: 'node',
    pool: 'forks',
    testTimeout: 180_000,
    hookTimeout: 180_000,
  },
})
