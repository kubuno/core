import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useThemeStore, type ThemeDef } from '../../store/themeStore'
import { api } from '../../api/client'

function ThemePreview({ theme }: { theme: ThemeDef }) {
  const bg      = theme.vars['--color-surface-1']     ?? '#f8f9fa'
  const surface = theme.vars['--color-surface-0']     ?? '#ffffff'
  const primary = theme.vars['--color-primary']       ?? '#1a73e8'
  const text    = theme.vars['--color-text-primary']  ?? '#202124'
  const textSec = theme.vars['--color-text-secondary'] ?? '#5f6368'
  const border  = theme.vars['--color-border']        ?? '#e0e0e0'
  return (
    <div className="rounded-lg overflow-hidden border" style={{ background: bg, borderColor: border, height: 80 }}>
      <div className="flex items-center gap-1.5 px-2 py-1.5" style={{ background: surface, borderBottom: `1px solid ${border}` }}>
        <div className="rounded-full w-2 h-2" style={{ background: primary }} />
        <div className="rounded h-1.5 w-12" style={{ background: textSec, opacity: 0.3 }} />
        <div className="flex-1" />
        <div className="rounded-full w-4 h-4" style={{ background: primary, opacity: 0.6 }} />
      </div>
      <div className="flex gap-1.5 p-2">
        <div className="flex flex-col gap-1">
          <div className="rounded h-1.5 w-10" style={{ background: primary, opacity: 0.7 }} />
          <div className="rounded h-1.5 w-8"  style={{ background: textSec, opacity: 0.4 }} />
          <div className="rounded h-1.5 w-9"  style={{ background: textSec, opacity: 0.4 }} />
        </div>
        <div className="flex-1 rounded" style={{ background: surface, border: `1px solid ${border}` }}>
          <div className="m-1.5 flex flex-col gap-1">
            <div className="rounded h-1.5 w-14" style={{ background: text, opacity: 0.5 }} />
            <div className="rounded h-1.5 w-10" style={{ background: textSec, opacity: 0.3 }} />
          </div>
        </div>
      </div>
    </div>
  )
}

/** Per-user theme selection, applied live + persisted cross-device. */
export function ThemesTab() {
  const { t } = useTranslation()
  const { user, updateUser } = useAuthStore()
  const { themes, activeThemeId, applyTheme, fetchThemes } = useThemeStore()

  useEffect(() => { if (themes.length === 0) fetchThemes() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const select = async (id: string) => {
    applyTheme(id) // applies CSS vars immediately + remembers in localStorage
    try {
      const { data } = await api.patch<{ user: typeof user }>('/me', { preferences: { theme: id } })
      if (data.user) updateUser(data.user as Parameters<typeof updateUser>[0])
    } catch { /* the theme is already applied visually; persistence is best-effort */ }
  }

  return (
    <div className="max-w-3xl">
      <p className="text-sm text-text-tertiary mb-5">
        {t('settings.themes_desc', { defaultValue: "Choisissez l'apparence de Kubuno. Votre choix vous suit sur tous vos appareils." })}
      </p>
      {themes.length === 0 ? (
        <p className="text-sm text-text-tertiary">{t('settings.themes_loading', { defaultValue: 'Chargement…' })}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {themes.map(theme => {
            const isActive = theme.id === activeThemeId
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => select(theme.id)}
                className={`relative rounded-xl border-2 p-3 text-left transition-all ${
                  isActive ? 'border-primary shadow-sm' : 'border-border hover:border-border-strong'}`}
              >
                <ThemePreview theme={theme} />
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-text-primary truncate pr-1">{theme.name}</span>
                  {isActive && <Check size={14} className="text-primary shrink-0" />}
                </div>
                <span className="text-xs text-text-tertiary capitalize">
                  {theme.color_scheme === 'dark'
                    ? t('settings.themes_dark', { defaultValue: 'Sombre' })
                    : t('settings.themes_light', { defaultValue: 'Clair' })}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
