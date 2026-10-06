/**
 * The host's shared modules: one build entry per chunk the import map points at (`importmap-plugin.ts`,
 * `SPECIFIER_TO_CHUNK`). Used by the host's build (`vite.config.ts`) and by the project-mode build of
 * `@kubuno/host-runtime` (`vite.design-host.config.ts`), which gives module projects the same modules in the Visual
 * Studio designer. Paths are relative to the frontend folder.
 */
import { resolve } from 'node:path'

export const SHARED_ENTRIES: Readonly<Record<string, string>> = {
  // Build-only entry: materialises the shared chunk with the WHOLE @ui + @kubuno/sdk surface
  // (preserveEntrySignatures keeps the exports the host does not use but a remote module needs).
  'kubuno-shared': 'src/sdk/shared-entry.ts',
  // The files platform service (@kubuno/drive): a stable chunk, NOT eager (the main entry does not import it, it is
  // loaded on demand).
  'drive-shared': 'src/drive/shared-entry.ts',
  // Runtime of .kbview views (@kubuno/views): its own stable chunk, so a module's views and the host's share one
  // binding engine and one live-view registry.
  'kubuno-views': 'src/views/index.ts',
  // Stable ESM facades, one per singleton package: they guarantee a dedicated chunk at a fixed URL (rolldown merges
  // small packages otherwise). The import map points the bare specifiers at these files; they re-export the single
  // instance (even when it physically lives in kubuno-shared).
  'vendor-react': 'src/sdk/shared/react.ts',
  'vendor-react-dom': 'src/sdk/shared/react-dom.ts',
  'vendor-react-jsx': 'src/sdk/shared/react-jsx.ts',
  'vendor-router': 'src/sdk/shared/router.ts',
  'vendor-query': 'src/sdk/shared/query.ts',
  'vendor-zustand': 'src/sdk/shared/zustand.ts',
  'vendor-react-i18next': 'src/sdk/shared/react-i18next.ts',
  'vendor-i18next': 'src/sdk/shared/i18next.ts',
  // Radix DropdownMenu: a MANDATORY singleton (Root↔Item context across bundles, cf. the shell's « New » button and
  // the modules' new-actions slots).
  'vendor-radix-menu': 'src/sdk/shared/radix-dropdown-menu.ts',
}

/** `SHARED_ENTRIES` as Rollup inputs (absolute paths), for the frontend folder `frontendDir`. */
export function sharedEntryInputs(frontendDir: string): Record<string, string> {
  return Object.fromEntries(Object.entries(SHARED_ENTRIES).map(([name, file]) => [name, resolve(frontendDir, file)]))
}
