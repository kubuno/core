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
import { Panel, ReactHost, Repeater, ScrollArea, Stack, TableLayoutPanel, UserControl, interpolationOptions, invalidateResources, registerElements, setIconResolver, setResourceResolver, setTranslator } from '@kubuno/views'

import { findIcon } from './utils/iconMap'

registerElements('@ui', ui as unknown as Record<string, unknown>)
// The `@ui` elements whose `className` lands on their root element: a view's `Class` on them is passed as that prop,
// with no layout wrapper among their parent's children (where `space-y-*`, `divide-y` or `> *` selectors would land
// on an undrawn `display: contents` box). Set here, where the host's single `@ui` instance is wired to the views.
for (const c of [ui.Card, ui.Callout, ui.EmptyState, ui.Badge, ui.Separator, ui.Spinner, ui.ProgressBar, ui.Toggle]) {
  ;(c as unknown as { kbRootClass?: boolean }).kbRootClass = true
}
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
// `HostStrings="true"` on an `@ui` element: its own strings (a close button's name, a default « Cancel ») from the
// host's catalogue, as the `t` of `useTranslation()` (default namespace) a TSX screen passes.
setTranslator((key, options) => (options ? i18n.t(key, options) : i18n.t(key)))
i18n.on('languageChanged', () => invalidateResources())
// A module's bundle registered after the first render (`registerModuleTranslations`): its views re-read.
// (`init` may rebuild the store: watch the one it ends with too.)
const watchStore = (): void => { i18n.store?.on('added', () => invalidateResources()) }
watchStore()
i18n.on('initialized', watchStore)
