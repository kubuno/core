/**
 * Build of `@kubuno/host-runtime` (`npm run build:design-host`): the design surface page of `.kbview` web views in
 * **bundled** mode (`src/views/design/entry.bundled.tsx`) as a static site with relative URLs, so it can be served
 * from any origin or folder (Visual Studio maps it to `https://kubuno-design.invalid/`). Output:
 * `packages/host-runtime/dist/` (not committed): `index.html`, `entry.js`, `assets/`, the production fonts with their
 * licence texts (`fonts/`, byte-identical copies of `public/fonts`) and the light / dark Kubuno themes (`themes/`).
 */
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
// The core's own views and user controls are compiled like in the app's build (the host imports some of them).
import { kbview } from './packages/views-compiler/dist/index.js'

const here = (p: string): string => fileURLToPath(new URL(p, import.meta.url))
const OUT = here('./packages/host-runtime/dist')
const STAGE = here('./packages/host-runtime/.build-public')
const THEMES = ['kubuno-reference', 'kubuno-dark']

/** The page's public files: the fonts (and licences) of `public/fonts`, and the themes' `theme.json` + CSS. */
function stagePublic(): void {
  rmSync(STAGE, { recursive: true, force: true })
  mkdirSync(join(STAGE, 'fonts'), { recursive: true })
  cpSync(here('./public/fonts'), join(STAGE, 'fonts'), { recursive: true })
  for (const id of THEMES) {
    const src = here(`../themes/${id}`)
    const dst = join(STAGE, 'themes', id)
    mkdirSync(dst, { recursive: true })
    for (const name of readdirSync(src)) {
      if (name === 'theme.json' || name.endsWith('.css')) cpSync(join(src, name), join(dst, name))
    }
    if (existsSync(join(src, 'modules'))) cpSync(join(src, 'modules'), join(dst, 'modules'), { recursive: true, filter: (f) => !f.endsWith('.js') })
  }
}
stagePublic()

/**
 * The page's HTML is `src/views/design/index.html` under the Vite root (the frontend, so that the views compiler
 * sees the core project): emit it at the output's root, with its relative URLs rebased.
 */
function htmlAtRoot(): Plugin {
  const from = 'src/views/design/index.html'
  return {
    name: 'kubuno-design-host-html',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const html = bundle[from]
      if (!html || html.type !== 'asset') return
      delete bundle[from]
      const source = String(html.source).replace(/(src|href)="(?:\.\.\/)+/g, '$1="./')
      this.emitFile({ type: 'asset', fileName: 'index.html', source })
    },
  }
}

const pkg = JSON.parse(readFileSync(here('./packages/host-runtime/package.json'), 'utf-8')) as { version: string }

export default defineConfig({
  root: here('.'),
  base: './',
  publicDir: STAGE,
  plugins: [kbview({ generateTypes: false, designServer: false }), react(), tailwindcss(), htmlAtRoot()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __APP_BUILD__: JSON.stringify(`host-runtime-${pkg.version}`),
  },
  resolve: {
    alias: {
      '@ui': here('./src/ui'),
      '@kubuno/sdk': here('./src/sdk/index.ts'),
      '@kubuno/drive': here('./src/drive/index.ts'),
      '@kubuno/views': here('./src/views/index.ts'),
    },
  },
  build: {
    outDir: OUT,
    emptyOutDir: true,
    chunkSizeWarningLimit: 20000,
    rollupOptions: {
      input: here('./src/views/design/index.html'),
      output: {
        entryFileNames: 'entry.js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
})
