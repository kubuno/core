import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

import { kbview } from './src/vite.js'

// The runtime conformance suite (WEB-VIEWS §7, WV-3): every conformance view rendered compiled (the Vite
// plugin's module, precompiled accessors) and interpreted (the WASM plan as JSON, path walker), with the
// host's real `@ui` components, in React StrictMode; the two DOMs must be identical at every step.
const here = fileURLToPath(new URL('.', import.meta.url))
const frontend = resolve(here, '..', '..')
const root = join(here, 'test', 'conformance')

export default defineConfig({
  root,
  cacheDir: join(tmpdir(), 'kbview-conformance-vitest'),
  // `@ui` reaches the core's stores, which reach the shell (`@kubuno/sdk` exports its header): the shell's own
  // user controls get compiled too, with the core project's registry of custom controls.
  // No generated types: the shell's views lie outside this root, their declarations would land outside
  // `.kubuno/views` (in the package's own `src/`).
  plugins: [kbview({ registries: [join(frontend, 'src', 'core', 'shell', 'menus', 'kbview-controls.json')], generateTypes: false }), react()],
  resolve: {
    alias: {
      '@kubuno/views': join(frontend, 'src', 'views', 'index.ts'),
      '@ui': join(frontend, 'src', 'ui'),
      // @ui reaches into the host's core (intl, registries): the host's own aliases.
      '@kubuno/sdk': join(frontend, 'src', 'sdk', 'index.ts'),
      '@kubuno/drive': join(frontend, 'src', 'drive', 'index.ts'),
    },
  },
  test: {
    include: ['**/*.test.tsx'],
    setupFiles: [join(root, 'setup.ts')],
    environment: 'jsdom',
    // jsdom gives modules an http: import.meta.url: hand the folders over explicitly.
    env: { KBVIEW_CONFORMANCE_DIR: root, KBVIEW_WASM: join(here, 'wasm', 'kubuno-views-web.wasm') },
    testTimeout: 120_000,
  },
})
