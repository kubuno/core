import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/** The package root (packages/views-compiler). */
export const PKG = resolve(dirname(fileURLToPath(import.meta.url)), '..')
/** core/web (the host app). */
export const FRONTEND = resolve(PKG, '..', '..')
/** The real host registry (`@kubuno/ui`). */
export const UI_REGISTRY = join(FRONTEND, 'packages', 'ui', 'kbview-registry.web.json')
/** The runtime sources (`@kubuno/views`). */
export const VIEWS_SRC = join(FRONTEND, 'src', 'views', 'index.ts')
export const FIXTURES = join(PKG, 'test', 'fixtures')
