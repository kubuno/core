import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useThemeStore, type ThemeDef } from '../store/themeStore'
import { api } from '../api/client'
import { Check, Upload, Trash2, Lock } from 'lucide-react'
import { Button } from '@ui'

function ThemePreview({ theme }: { theme: ThemeDef }) {
  const bg      = theme.vars['--color-surface-1'] ?? '#f8f9fa'
  const surface = theme.vars['--color-surface-0'] ?? '#ffffff'
  const primary = theme.vars['--color-primary']   ?? '#1a73e8'
  const text    = theme.vars['--color-text-primary']   ?? '#202124'
  const textSec = theme.vars['--color-text-secondary'] ?? '#5f6368'
  const border  = theme.vars['--color-border']    ?? '#e0e0e0'

  return (
    <div
      className="rounded-lg overflow-hidden border"
      style={{ background: bg, borderColor: border, height: 80 }}
    >
      <div className="flex items-center gap-1.5 px-2 py-1.5"
           style={{ background: surface, borderBottom: `1px solid ${border}` }}>
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

export default function ThemesPanel() {
  const { t } = useTranslation()
  const { themes, activeThemeId, applyTheme, fetchThemes } = useThemeStore()
  const qc = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const saveMut = useMutation({
    mutationFn: (id: string) =>
      api.patch('/admin/settings', { 'appearance.theme': id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-settings'] }),
  })

  const importMut = useMutation({
    mutationFn: (theme: ThemeDef) => api.post('/admin/themes', theme),
    onSuccess: () => {
      setImportError(null)
      fetchThemes()
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setImportError(msg ?? t('admin.t_import_error'))
    },
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/themes/${id}`),
    onSuccess: (_data, id) => {
      setDeleteConfirmId(null)
      // Si le thème supprimé était actif, repasser au thème par défaut
      if (activeThemeId === id) {
        applyTheme('kubuno-light')
        saveMut.mutate('kubuno-light')
      }
      fetchThemes()
    },
    onError: () => setDeleteConfirmId(null),
  })

  const handleSelect = (theme: ThemeDef) => {
    applyTheme(theme.id)
    saveMut.mutate(theme.id)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportError(null)

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string) as ThemeDef
        if (!parsed.id || !parsed.name || !parsed.vars || typeof parsed.vars !== 'object') {
          setImportError(t('admin.t_format_invalid'))
          return
        }
        importMut.mutate(parsed)
      } catch {
        setImportError(t('admin.t_not_json'))
      }
    }
    reader.readAsText(file)
    // Réinitialiser pour permettre un second import du même fichier
    e.target.value = ''
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-base font-medium text-text-primary mb-1">{t('admin.t_title')}</h2>
          <p className="text-sm text-text-secondary">
            {t('admin.t_desc')}
          </p>
        </div>
        <Button
          variant="secondary"
          icon={<Upload size={15} />}
          onClick={() => fileInputRef.current?.click()}
          disabled={importMut.isPending}
          className="flex-shrink-0"
        >
          {t('admin.t_import')}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {importError && (
        <div className="mb-4 p-3 bg-danger-light border border-danger/20 rounded-lg text-sm text-danger">
          {importError}
        </div>
      )}

      {importMut.isPending && (
        <p className="mb-4 text-sm text-text-secondary">{t('admin.t_importing')}</p>
      )}

      {themes.length === 0 && (
        <p className="text-sm text-text-secondary">{t('admin.t_loading')}</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {themes.map((theme) => {
          const isActive   = theme.id === activeThemeId
          const isBuiltin  = theme.builtin === true
          const isDeleting = deleteConfirmId === theme.id

          return (
            <div
              key={theme.id}
              className={`
                relative rounded-xl border-2 p-3 transition-all
                ${isActive
                  ? 'border-primary shadow-sm'
                  : 'border-border hover:border-border-strong'}
              `}
            >
              {/* Clic pour sélectionner */}
              <button className="block w-full text-left" onClick={() => handleSelect(theme)}>
                <ThemePreview theme={theme} />

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-text-primary truncate pr-1">
                    {theme.name}
                  </span>
                  {isActive && <Check size={14} className="text-primary flex-shrink-0" />}
                </div>

                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs text-text-tertiary capitalize">
                    {theme.color_scheme === 'dark' ? t('admin.t_dark') : t('admin.t_light')}
                  </span>
                  {isBuiltin && (
                    <span className="flex items-center gap-0.5 text-[10px] text-text-tertiary">
                      <Lock size={9} />
                      {t('admin.t_builtin')}
                    </span>
                  )}
                </div>
              </button>

              {/* Bouton supprimer — uniquement sur les thèmes non intégrés */}
              {!isBuiltin && (
                <div className="mt-2 pt-2 border-t border-border">
                  {isDeleting ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-text-secondary flex-1">{t('admin.t_confirm')}</span>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => deleteMut.mutate(theme.id)}
                        loading={deleteMut.isPending}
                      >
                        {t('common.delete')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirmId(null)}
                      >
                        {t('common.cancel')}
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(theme.id)}
                      className="flex items-center gap-1 text-xs text-text-tertiary
                                 hover:text-danger transition-colors"
                    >
                      <Trash2 size={11} />
                      {t('common.delete')}
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {saveMut.isError && (
        <p className="mt-4 text-sm text-danger">
          {t('admin.t_save_error')}
        </p>
      )}

      <div className="mt-6 p-4 bg-surface-1 rounded-lg border border-border">
        <p className="text-xs text-text-secondary font-medium mb-1">{t('admin.t_format_title')}</p>
        <pre className="text-xs text-text-tertiary overflow-x-auto">{`{
  "id":           "mon-theme",
  "name":         "Mon Thème",
  "color_scheme": "light",
  "vars": {
    "--color-primary":      "#1a73e8",
    "--color-surface-0":    "#ffffff",
    "--color-text-primary": "#202124",
    "--body-bg":            "#f1f4f8",
    ...
  }
}`}</pre>
      </div>
    </div>
  )
}
