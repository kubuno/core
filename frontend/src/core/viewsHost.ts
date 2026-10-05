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
import { Panel, Repeater, ScrollArea, Stack, TableLayoutPanel, UserControl, invalidateResources, registerElements, setIconResolver, setResourceResolver } from '@kubuno/views'

import { findIcon } from './utils/iconMap'

registerElements('@ui', ui as unknown as Record<string, unknown>)
registerElements('@kubuno/sdk', { DockArea, WorkspaceShell })
// The elements the runtime renders itself (layout containers, Repeater), for interpreted plans.
registerElements('@kubuno/views', { Panel, Repeater, ScrollArea, Stack, TableLayoutPanel, UserControl })
setIconResolver((name) => findIcon(name) ?? undefined)
setResourceResolver((key, set) => i18n.t(set ? `${set}:${key}` : key))
i18n.on('languageChanged', () => invalidateResources())
