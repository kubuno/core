import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  cacheDir: join(tmpdir(), 'kbview-migrate-vitest'),
  test: { include: ['test/*.test.ts'], environment: 'node', pool: 'forks', testTimeout: 180_000 },
})
