// Per-tab (sessionStorage), per-application persistence of the left/right panel
// expand state. `sessionStorage` is scoped to a single tab and survives a reload
// (F5), which matches the requirement: each tab remembers, per application, the
// last expanded/collapsed state of both panels — restored on reload or when
// returning to the application later within the same tab.

const KEY = 'kubuno.panelPrefs.v1'

export interface AppPanelPrefs {
  /** Left sidebar collapsed. */
  left?: boolean
  /** Right panel: id of the open module panel, or `null` when closed. */
  right?: string | null
}

type Store = Record<string, AppPanelPrefs>

function read(): Store {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || '{}') as Store
  } catch {
    return {}
  }
}

function write(store: Store): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(store))
  } catch {
    // Ignore quota / private-mode failures: persistence is best-effort.
  }
}

/** Identify the current "application" by the first path segment ('home' for '/'). */
export function appIdFromPath(pathname: string): string {
  return pathname.split('/').filter(Boolean)[0] || 'home'
}

export const panelPrefs = {
  get(appId: string): AppPanelPrefs {
    return read()[appId] ?? {}
  },
  setLeft(appId: string, collapsed: boolean): void {
    const s = read()
    s[appId] = { ...s[appId], left: collapsed }
    write(s)
  },
  setRight(appId: string, moduleId: string | null): void {
    const s = read()
    s[appId] = { ...s[appId], right: moduleId }
    write(s)
  },
}
