import type { Plugin } from 'vite'
import { createHash } from 'node:crypto'

/**
 * Plugin de build du host : injecte une import map ESM *inline* dans index.html.
 *
 * Les modules (buildés séparément) importent `react`, `zustand`, `@kubuno/sdk`,
 * `@ui`… en `external`. Au runtime, le navigateur résout ces specifiers via
 * cette map vers les chunks partagés UNIQUES du host → une seule instance de
 * React, des stores zustand, des registries, d'i18next. C'est l'invariant qui
 * fait fonctionner le partage de singletons.
 *
 * La map est régénérée à CHAQUE build et inline dans le HTML (jamais cachée
 * séparément) : elle versionne donc toujours avec le SPA servi.
 */

// Specifier (vu par les modules) -> nom du chunk partagé émis par le host.
const SPECIFIER_TO_CHUNK: Record<string, string> = {
  'react':                  'vendor-react',
  'react-dom':              'vendor-react-dom',
  'react-dom/client':       'vendor-react-dom',
  'react/jsx-runtime':      'vendor-react-jsx',
  'react/jsx-dev-runtime':  'vendor-react-jsx',
  'react-router-dom':       'vendor-router',
  '@tanstack/react-query':  'vendor-query',
  'zustand':                'vendor-zustand',
  'react-i18next':          'vendor-react-i18next',
  'i18next':                'vendor-i18next',
  '@kubuno/sdk':            'kubuno-shared',
  '@kubuno/drive':          'drive-shared',
  '@ui':                    'kubuno-shared',
  '@radix-ui/react-dropdown-menu': 'vendor-radix-menu',
}

export function importMapPlugin(base = '/'): Plugin {
  let mapJson = '{"imports":{}}'

  return {
    name: 'kubuno-importmap',
    apply: 'build',

    generateBundle(_opts, bundle) {
      const byName = new Map<string, string>()
      for (const file of Object.values(bundle)) {
        if ((file as { type?: string }).type === 'chunk') {
          const c = file as { name?: string; fileName: string }
          if (c.name && !byName.has(c.name)) byName.set(c.name, c.fileName)
        }
      }
      const imports: Record<string, string> = {}
      for (const [spec, chunkName] of Object.entries(SPECIFIER_TO_CHUNK)) {
        const fileName = byName.get(chunkName)
        if (fileName) {
          imports[spec] = base.replace(/\/$/, '') + '/' + fileName
        } else {
          this.warn(`[importmap] chunk "${chunkName}" introuvable pour "${spec}"`)
        }
      }
      // Contenu EXACT injecté dans le <script> (le navigateur en hashe le texte).
      mapJson = JSON.stringify({ imports }, null, 2)

      // La CSP du core interdit l'inline sans hash. On émet le hash sha256 de
      // l'import map ; le core le lit au démarrage et l'ajoute à `script-src`.
      const hash = createHash('sha256').update(mapJson, 'utf8').digest('base64')
      this.emitFile({ type: 'asset', fileName: 'importmap.sha256', source: `sha256-${hash}` })
    },

    transformIndexHtml(html: string) {
      // `drive-shared` (=@kubuno/drive) est une ENTRÉE de build (pour préserver
      // tous ses exports), donc Vite la modulepreload comme les autres entrées.
      // Mais on la veut LAZY (chargée seulement à l'ouverture de /drive ou d'un
      // consommateur) → on retire ses liens modulepreload de index.html.
      const stripped = html.replace(
        /\s*<link(?=[^>]*rel="modulepreload")(?=[^>]*drive-shared)[^>]*>/g,
        '',
      )
      return {
        html: stripped,
        tags: [
          {
            tag: 'script',
            attrs: { type: 'importmap' as const },
            children: mapJson,
            // DOIT précéder le <script type="module"> de l'app.
            injectTo: 'head-prepend' as const,
          },
        ],
      }
    },
  }
}
