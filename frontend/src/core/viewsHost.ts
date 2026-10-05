/**
 * Connects the `.kbview` runtime (`@kubuno/views`, vskubuno docs/WEB-VIEWS.md WV-3) to the host: the
 * `@ui` / `@kubuno/sdk` components that interpreted plans name (compiled plans import theirs), Kubuno icon
 * names, and `{Res}` strings through i18next (a language change re-renders every live view).
 *
 * Imported once by `main.tsx`. Lives in the host's shared chunk, never in `kubuno-views` (the runtime
 * chunk depends on nothing of the host).
 */
import i18n from 'i18next'

import * as ui from '@ui'
import { DockArea, WorkspaceShell } from './shell/workspace'
import { Panel, ReactHost, Repeater, ScrollArea, Stack, TableLayoutPanel, UserControl, interpolationOptions, invalidateResources, registerElements, setIconResolver, setResourceResolver } from '@kubuno/views'

import { findIcon } from './utils/iconMap'

registerElements('@ui', ui as unknown as Record<string, unknown>)
registerElements('@kubuno/sdk', { DockArea, WorkspaceShell })
// The elements the runtime renders itself (layout containers, Repeater), for interpreted plans.
registerElements('@kubuno/views', { Panel, ReactHost, Repeater, ScrollArea, Stack, TableLayoutPanel, UserControl })
setIconResolver((name) => findIcon(name) ?? undefined)
// `{Res key, Count={Binding n}, Name=…}`: the arguments are i18next's interpolation options (`{{count}}`,
// `{{name}}`) and `count` selects the plural form (`key_one`, `key_other`…), exactly as `t(key, { count })`.
setResourceResolver((key, set, args) => {
  const k = set ? `${set}:${key}` : key
  return args ? i18n.t(k, interpolationOptions(args)) : i18n.t(k)
})
i18n.on('languageChanged', () => invalidateResources())
// A module's bundle registered after the first render (`registerModuleTranslations`): its views re-read.
// (`init` may rebuild the store: watch the one it ends with too.)
const watchStore = (): void => { i18n.store?.on('added', () => invalidateResources()) }
watchStore()
i18n.on('initialized', watchStore)
