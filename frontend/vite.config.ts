import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { readFileSync } from 'node:fs'
import { importMapPlugin } from './build/importmap-plugin'

// App version, injected at build time as `__APP_VERSION__` (see src/vite-env.d.ts).
const pkg = JSON.parse(
  readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf-8'),
) as { version: string }

// Nom de chunk -> noms de fichiers stables (sans hash) pour les modules partagés
// ciblés par l'import map. Tout le reste garde un hash de cache normal.
const SHARED_CHUNK = (name: string | undefined) =>
  name === 'kubuno-shared' || name === 'drive-shared' || (name?.startsWith('vendor-') ?? false)

export default defineConfig({
  plugins: [react(), tailwindcss(), importMapPlugin()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  resolve: {
    alias: {
      '@ui': fileURLToPath(new URL('./src/ui', import.meta.url)),
      '@kubuno/sdk': fileURLToPath(new URL('./src/sdk/index.ts', import.meta.url)),
      '@kubuno/drive': fileURLToPath(new URL('./src/drive/index.ts', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      input: {
        index: fileURLToPath(new URL('./index.html', import.meta.url)),
        // Entrée build-only : matérialise le chunk partagé avec TOUTE la surface
        // @ui + @kubuno/sdk (preserveEntrySignatures évite le tree-shaking des
        // exports non utilisés par le host mais requis par un module distant).
        'kubuno-shared': fileURLToPath(new URL('./src/sdk/shared-entry.ts', import.meta.url)),
        // Service plateforme fichiers (@kubuno/drive) — chunk stable, NON-eager
        // (le main entry ne l'importe pas → chargé à la demande).
        'drive-shared': fileURLToPath(new URL('./src/drive/shared-entry.ts', import.meta.url)),
        // Facades ESM stables par paquet singleton : garantissent un chunk dédié
        // à URL fixe (rolldown fusionne sinon les petits paquets). L'import map
        // pointe les bare specifiers vers ces fichiers ; ils ré-exportent
        // l'instance unique (même si elle vit physiquement dans kubuno-shared).
        'vendor-react':         fileURLToPath(new URL('./src/sdk/shared/react.ts', import.meta.url)),
        'vendor-react-dom':     fileURLToPath(new URL('./src/sdk/shared/react-dom.ts', import.meta.url)),
        'vendor-react-jsx':     fileURLToPath(new URL('./src/sdk/shared/react-jsx.ts', import.meta.url)),
        'vendor-router':        fileURLToPath(new URL('./src/sdk/shared/router.ts', import.meta.url)),
        'vendor-query':         fileURLToPath(new URL('./src/sdk/shared/query.ts', import.meta.url)),
        'vendor-zustand':       fileURLToPath(new URL('./src/sdk/shared/zustand.ts', import.meta.url)),
        'vendor-react-i18next': fileURLToPath(new URL('./src/sdk/shared/react-i18next.ts', import.meta.url)),
        'vendor-i18next':       fileURLToPath(new URL('./src/sdk/shared/i18next.ts', import.meta.url)),
        // Radix DropdownMenu : singleton OBLIGATOIRE (contexte Root↔Item cross-bundle,
        // cf. bouton « Nouveau » du shell + slots new-actions des modules).
        'vendor-radix-menu':    fileURLToPath(new URL('./src/sdk/shared/radix-dropdown-menu.ts', import.meta.url)),
      },
      // Garde tous les exports de l'entrée kubuno-shared adressables par les modules.
      preserveEntrySignatures: 'strict',
      output: {
        // Consolide la surface partagée (registries/stores/i18n/@ui/SDK) dans UN
        // seul chunk, pour que host ET modules en partagent une seule instance.
        // Les paquets vendor (react, zustand…) sont gérés par les entrées-facades.
        manualChunks(id: string) {
          // Capture vocale : chargée à la demande (import dynamique) → la garder
          // hors du chunk eager kubuno-shared. AVANT la règle /src/core/.
          if (/\/src\/core\/shell\/voiceStt/.test(id)) return undefined
          if (/\/src\/sdk\//.test(id)) return 'kubuno-shared'
          if (/\/src\/ui\//.test(id)) return 'kubuno-shared'
          // core/components peut tirer du lourd (PdfViewerModal→pdfjs) : ne pas
          // le forcer dans le chunk eager.
          if (/\/src\/core\/components\//.test(id)) return undefined
          // TOUT le reste de core (i18n, stores, registries, hooks, api, shell…)
          // → kubuno-shared (instance unique partagée). AVANT la règle drive pour
          //   qu'aucun singleton core ne fuie dans le chunk drive-shared.
          if (/\/src\/core\//.test(id)) return 'kubuno-shared'
          if (/\/src\/drive\//.test(id)) return 'drive-shared'
          return undefined
        },
        entryFileNames(chunk: { name?: string }) {
          return SHARED_CHUNK(chunk.name) ? 'shared/[name].js' : 'assets/[name]-[hash].js'
        },
        chunkFileNames(chunk: { name?: string }) {
          return SHARED_CHUNK(chunk.name) ? 'shared/[name].js' : 'assets/[name]-[hash].js'
        },
      },
    },
  },
  server: {
    proxy: {
      '/api':      'http://localhost:8080',
      '/ws':       { target: 'ws://localhost:8080', ws: true },
      '/internal': 'http://localhost:8080',
      '/modules':  'http://localhost:8080',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**'],
    },
  },
})
