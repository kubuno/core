import { create } from 'zustand'
import axios from 'axios'

export interface ThemeDef {
  id:           string
  name:         string
  color_scheme: 'light' | 'dark' | string
  vars:         Record<string, string>
  builtin?:     boolean
}

interface ThemeState {
  themes:        ThemeDef[]
  activeThemeId: string
  isLoaded:      boolean

  fetchThemes:   () => Promise<void>
  applyTheme:    (id: string) => void
}

const STORAGE_KEY = 'kubuno_theme'

function applyThemeDef(theme: ThemeDef) {
  const root = document.documentElement
  for (const [prop, value] of Object.entries(theme.vars)) {
    root.style.setProperty(prop, value)
  }
  root.style.colorScheme = theme.color_scheme
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  themes:        [],
  activeThemeId: localStorage.getItem(STORAGE_KEY) ?? 'kubuno-light',
  isLoaded:      false,

  fetchThemes: async () => {
    try {
      const [themesRes, configRes] = await Promise.all([
        axios.get<{ themes: ThemeDef[] }>('/api/v1/themes'),
        axios.get<{ settings: Record<string, unknown> }>('/api/v1/config').catch(() => ({ data: { settings: {} } })),
      ])

      const themes = themesRes.data.themes
      const settings: Record<string, unknown> = (configRes.data.settings as Record<string, unknown>) ?? {}
      const serverThemeId = (settings['appearance.theme'] as string | undefined) ?? 'kubuno-light'

      const localId   = localStorage.getItem(STORAGE_KEY)
      const targetId  = localId ?? serverThemeId
      const active = themes.find(t => t.id === targetId) ?? themes.find(t => t.id === 'kubuno-light') ?? themes[0]

      set({ themes, activeThemeId: active?.id ?? targetId, isLoaded: true })
      if (active) applyThemeDef(active)
    } catch {
      set({ isLoaded: true })
    }
  },

  applyTheme: (id: string) => {
    const theme = get().themes.find(t => t.id === id)
    if (!theme) return
    applyThemeDef(theme)
    localStorage.setItem(STORAGE_KEY, id)
    set({ activeThemeId: id })
  },
}))
