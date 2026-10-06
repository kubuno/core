/**
 * Code-behind of `ThemesTab.kbcontrol` (converted from `ThemesTab.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs } from '@kubuno/views'
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useAuthStore } from "../../../store/authStore"
import { useThemeStore } from "../../../store/themeStore"
import { api } from "../../../api/client"

import { ViewBase } from './ThemesTab.kbcontrol'
import * as __parts from './ThemesTab.parts.tsx'

export class ThemesTab extends ViewBase {
  tr!: ThemesTabStores['t']
  user!: ThemesTabStores['user']
  updateUser!: ThemesTabStores['updateUser']
  themes!: ThemesTabStores['themes']
  activeThemeId!: ThemesTabStores['activeThemeId']
  applyTheme!: ThemesTabStores['applyTheme']

  /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
  useStores() {
    const { t } = useTranslation()
    const { user, updateUser } = useAuthStore()
    const { themes, activeThemeId, applyTheme, fetchThemes } = useThemeStore()
    useEffect(() => { if (themes.length === 0) fetchThemes() }, [])
    return { t, user, updateUser, themes, activeThemeId, applyTheme, fetchThemes }
  }

  /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
  use(): void {
    const s = this.useStores()
    this.publish({ tr: s.t, user: s.user, updateUser: s.updateUser, themes: s.themes, activeThemeId: s.activeThemeId, applyTheme: s.applyTheme })
  }

  get show_themes() {
    return this.themes.length === 0
  }

  get show_not_themes() {
    return !(this.themes.length === 0)
  }

  /** `<ThemePreview>`, rendered by a ReactHost. */
  get ThemePreview() {
    if (!(!(this.themes.length === 0))) return undefined as never
    return __parts.ThemePreview
  }

  /** The rows of the Repeater over `themes`. */
  get rows_themes() {
    return this.memo('rows_themes', [this.themes, this.activeThemeId, this.tr], () => {
      if (!(!(this.themes.length === 0))) return undefined as never
      return this.themes.map((theme) => {
      const isActive = theme.id === this.activeThemeId
      return { theme, isActive, button_class: ((!(this.themes.length === 0))) ? (`relative rounded-xl border-2 p-3 text-left transition-all ${
                  isActive ? 'border-primary shadow-sm' : 'border-border hover:border-border-strong'}`) : undefined, theme_preview_props: ((!(this.themes.length === 0))) ? ({ theme: theme }) : undefined, span_text: ((!(this.themes.length === 0))) ? (theme.color_scheme === 'dark'
                    ? this.tr('settings.themes_dark', { defaultValue: 'Sombre' })
                    : this.tr('settings.themes_light', { defaultValue: 'Clair' })) : undefined, key: theme.id }
    })
    })
  }

  async select(id: string) {
    this.applyTheme(id) // applies CSS vars immediately + remembers in localStorage
    try {
      const { data } = await api.patch<{ user: ThemesTab['user'] }>('/me', { preferences: { theme: id } })
      if (data.user) this.updateUser(data.user as Parameters<ThemesTab['updateUser']>[0])
    } catch { /* the theme is already applied visually; persistence is best-effort */ }
  }

  panel_click(_sender: unknown, args: MouseEventArgs) {
    const { theme } = args.row as RowOf_rows_themes
    this.select(theme.id)
  }

}

type RowOf_rows_themes = ThemesTab['rows_themes'][number]

/** What `useStores()` gives (the types of the fields it fills). */
export type ThemesTabStores = ReturnType<ThemesTab['useStores']>

export default ThemesTab.component()
