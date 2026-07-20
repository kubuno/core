import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useThemeStore, type ThemeDef } from '../store/themeStore'
import { api } from '../api/client'
import { Check, Upload, Trash2, Lock, FileArchive, Code2, AlertTriangle } from 'lucide-react'
import { Button, Toggle } from '@ui'
import ThemeDevicePreview from './ThemeDevicePreview'

/** Compact swatch preview shown in the left-hand theme list. */
function ThemeChip({ theme }: { theme: ThemeDef }) {
  const bg      = theme.vars['--color-surface-1'] ?? '#f8f9fa'
  const surface = theme.vars['--color-surface-0'] ?? '#ffffff'
  const primary = theme.vars['--color-primary']   ?? '#1a73e8'
  const textSec = theme.vars['--color-text-secondary'] ?? '#5f6368'
  const border  = theme.vars['--color-border']    ?? '#e0e0e0'

  return (
    <div className="rounded-md overflow-hidden border flex-shrink-0"
         style={{ background: bg, borderColor: border, width: 56, height: 40 }}>
      <div className="flex items-center gap-1 px-1.5 py-1"
           style={{ background: surface, borderBottom: `1px solid ${border}` }}>
        <div className="rounded-full" style={{ width: 5, height: 5, background: primary }} />
        <div className="rounded flex-1" style={{ height: 3, background: textSec, opacity: 0.3 }} />
      </div>
      <div className="flex gap-1 p-1.5">
        <div className="rounded" style={{ width: 12, height: 4, background: primary, opacity: 0.7 }} />
        <div className="rounded" style={{ width: 16, height: 4, background: textSec, opacity: 0.35 }} />
      </div>
    </div>
  )
}

export default function ThemesPanel() {
  const { t } = useTranslation()
  const { themes, activeThemeId, applyTheme, fetchThemes, loadThemePreview, clearThemePreview } = useThemeStore()
  const qc = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const zipInputRef = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // The theme shown in the preview pane (selection ≠ application).
  const selected =
    themes.find((th) => th.id === (selectedId ?? activeThemeId)) ?? themes[0] ?? null

  // Load the selected theme's overrides into the isolated preview scope.
  useEffect(() => {
    if (selected) loadThemePreview(selected)
    return () => clearThemePreview()
    // Reload when the previewed theme — or its trust state — changes.
  }, [selected?.id, selected?.scripts_enabled]) // eslint-disable-line react-hooks/exhaustive-deps

  const saveMut = useMutation({
    mutationFn: (id: string) => api.patch('/admin/settings', { 'appearance.theme': id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-settings'] }),
  })

  const importMut = useMutation({
    mutationFn: (theme: ThemeDef) => api.post('/admin/themes', theme),
    onSuccess: () => { setImportError(null); fetchThemes() },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setImportError(msg ?? t('admin.t_import_error'))
    },
  })

  // Import d'un thème empaqueté (.zip) : CSS + JS + assets ciblant modules.
  const importZipMut = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData()
      fd.append('file', file)
      return api.post('/admin/themes/import', fd)
    },
    onSuccess: (res: { data?: { theme?: { id?: string } } }) => {
      setImportError(null)
      const newId = res?.data?.theme?.id
      if (newId) setSelectedId(newId)
      fetchThemes()
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setImportError(msg ?? t('admin.t_import_error'))
    },
  })

  // Confiance des scripts : autoriser/refuser l'exécution du JS d'un thème.
  const trustMut = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      api.patch(`/admin/themes/${id}/trust`, { scripts_enabled: enabled }),
    onSuccess: () => fetchThemes(),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/themes/${id}`),
    onSuccess: (_data, id) => {
      setDeleteConfirmId(null)
      if (activeThemeId === id) { applyTheme('kubuno-reference'); saveMut.mutate('kubuno-reference') }
      if (selectedId === id) setSelectedId('kubuno-reference')
      fetchThemes()
    },
    onError: () => setDeleteConfirmId(null),
  })

  // Application explicite (≠ sélection pour aperçu).
  const handleApply = (theme: ThemeDef) => {
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
          setImportError(t('admin.t_format_invalid')); return
        }
        importMut.mutate(parsed)
      } catch {
        setImportError(t('admin.t_not_json'))
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportError(null)
    importZipMut.mutate(file)
    e.target.value = ''
  }

  const isActive  = selected?.id === activeThemeId
  const isBuiltin = selected?.builtin === true

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h2 className="text-base font-medium text-text-primary mb-1">{t('admin.t_title')}</h2>
          <p className="text-sm text-text-secondary">{t('admin.t_desc')}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="secondary" icon={<Upload size={15} />}
                  onClick={() => fileInputRef.current?.click()} disabled={importMut.isPending}>
            {t('admin.t_import')}
          </Button>
          <Button variant="secondary" icon={<FileArchive size={15} />}
                  onClick={() => zipInputRef.current?.click()} disabled={importZipMut.isPending}>
            {t('admin.t_import_zip', { defaultValue: 'Importer un .zip' })}
          </Button>
        </div>
        <input ref={fileInputRef} type="file" accept=".json,application/json" className="hidden" onChange={handleFileChange} />
        <input ref={zipInputRef} type="file" accept=".zip,application/zip" className="hidden" onChange={handleZipChange} />
      </div>

      {importError && (
        <div className="mb-4 p-3 bg-danger-light border border-danger/20 rounded-lg text-sm text-danger">{importError}</div>
      )}
      {(importMut.isPending || importZipMut.isPending) && (
        <p className="mb-4 text-sm text-text-secondary">{t('admin.t_importing')}</p>
      )}
      {themes.length === 0 && <p className="text-sm text-text-secondary">{t('admin.t_loading')}</p>}

      <div className="flex gap-6 items-start">
        {/* ── Liste des thèmes (clic = sélection pour aperçu) ── */}
        <div className="w-64 flex-shrink-0 space-y-1.5">
          {themes.map((theme) => {
            const sel    = theme.id === selected?.id
            const active = theme.id === activeThemeId
            return (
              <button
                key={theme.id}
                onClick={() => setSelectedId(theme.id)}
                className={`w-full flex items-center gap-3 p-2 rounded-lg border text-left transition-all
                  ${sel ? 'border-primary bg-primary-light/40' : 'border-border hover:border-border-strong hover:bg-surface-1'}`}
              >
                <ThemeChip theme={theme} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium text-text-primary truncate">{theme.name}</span>
                    {active && <Check size={13} className="text-primary flex-shrink-0" />}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[11px] text-text-tertiary capitalize">
                      {theme.color_scheme === 'dark' ? t('admin.t_dark') : t('admin.t_light')}
                    </span>
                    {theme.builtin && (
                      <span className="flex items-center gap-0.5 text-[10px] text-text-tertiary">
                        <Lock size={9} />{t('admin.t_builtin')}
                      </span>
                    )}
                    {theme.has_scripts && (
                      <span className="flex items-center gap-0.5 text-[10px] text-warning">
                        <Code2 size={10} />{t('admin.t_has_scripts', { defaultValue: 'scripts' })}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* ── Détail / aperçu du thème sélectionné ── */}
        <div className="flex-1 min-w-0">
          {selected ? (
            <>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="min-w-0">
                  <h3 className="text-base font-medium text-text-primary truncate">{selected.name}</h3>
                  <p className="text-xs text-text-tertiary mt-0.5">
                    {t('admin.t_prev_hint', { defaultValue: 'Aperçu — non appliqué tant que vous n’avez pas cliqué sur Appliquer' })}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!isBuiltin && (
                    deleteConfirmId === selected.id ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-text-secondary">{t('admin.t_confirm')}</span>
                        <Button variant="danger" size="sm" loading={deleteMut.isPending}
                                onClick={() => deleteMut.mutate(selected.id)}>
                          {t('common.delete')}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmId(null)}>
                          {t('common.cancel')}
                        </Button>
                      </div>
                    ) : (
                      <Button variant="ghost" size="sm" icon={<Trash2 size={14} />}
                              onClick={() => setDeleteConfirmId(selected.id)} />
                    )
                  )}
                  <Button variant="primary" onClick={() => handleApply(selected)} disabled={isActive}>
                    {isActive
                      ? t('admin.t_active', { defaultValue: 'Thème actif' })
                      : t('admin.t_apply', { defaultValue: 'Appliquer' })}
                  </Button>
                </div>
              </div>

              {/* Confiance des scripts (thèmes qui en livrent) */}
              {selected.has_scripts && (
                <div className="mb-3 p-3 rounded-lg bg-surface-1 border border-border">
                  <Toggle
                    checked={selected.scripts_enabled === true}
                    disabled={trustMut.isPending}
                    onChange={(e) => trustMut.mutate({ id: selected.id, enabled: e.target.checked })}
                    label={t('admin.t_allow_scripts', { defaultValue: 'Autoriser les scripts' })}
                  />
                  <span className="flex items-center gap-1 text-[11px] text-warning mt-1">
                    <AlertTriangle size={11} className="flex-shrink-0" />
                    {selected.scripts_enabled
                      ? t('admin.t_scripts_warning', { defaultValue: 'Exécute le JS du thème chez tous les utilisateurs' })
                      : t('admin.t_scripts_preview_hint', { defaultValue: 'Activez les scripts pour prévisualiser les composants surchargés du thème' })}
                  </span>
                </div>
              )}

              <ThemeDevicePreview theme={selected} />
            </>
          ) : (
            <p className="text-sm text-text-tertiary">{t('admin.t_loading')}</p>
          )}
        </div>
      </div>

      {saveMut.isError && <p className="mt-4 text-sm text-danger">{t('admin.t_save_error')}</p>}

      <div className="mt-6 p-4 bg-surface-1 rounded-lg border border-border">
        <p className="text-xs text-text-secondary font-medium mb-1">{t('admin.t_format_title')}</p>
        <pre className="text-xs text-text-tertiary overflow-x-auto">{`{
  "id":           "mon-theme",
  "name":         "Mon Thème",
  "color_scheme": "light",
  "vars": { "--color-primary": "#1a73e8", "--color-surface-0": "#ffffff", ... },
  "global":  { "css": "global.css", "script": "global.js" },
  "modules": { "drive": { "css": "modules/drive.css", "script": "modules/drive.js" } }
}`}</pre>
      </div>
    </div>
  )
}
