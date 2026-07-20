import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { useModulesStore } from '../store/modulesStore'
import { Package, ArrowLeft, Check, Download, RefreshCw, AlertCircle, X, Star, ExternalLink, Trash2 } from 'lucide-react'

interface MarketModule {
  id:                string
  name:              string
  version:           string
  author?:           string | null
  official:          boolean
  category?:         string | null
  accent?:           string | null
  summary?:          string | null
  description?:      string | null
  license?:          string | null
  tags:              string[]
  rating?:           number | null
  updated?:          string | null
  links?:            { repo?: string | null; html?: string | null }
  installed:         boolean
  installed_version: string | null
  enabled?:          boolean | null
  removable:         boolean
}

/** Panneau Marketplace : parcourir le catalogue distant et installer des modules. */
export default function MarketplacePanel({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [okMsg, setOkMsg] = useState<string | null>(null)
  const [errMsg, setErrMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [phase, setPhase] = useState<Record<string, string>>({})

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-marketplace'],
    queryFn: () => api.get<{ modules: MarketModule[] }>('/admin/marketplace').then((r) => r.data.modules),
  })

  // L'installation est asynchrone : POST lance la tâche (202), puis on interroge
  // `/status` jusqu'à l'état terminal (done/error), en affichant la phase courante.
  interface Report { name: string; version: string; started: boolean }
  const install = useMutation({
    mutationFn: async (id: string): Promise<Report> => {
      await api.post(`/admin/marketplace/${id}/install`)
      for (let i = 0; i < 600; i++) {
        await new Promise((r) => setTimeout(r, 1000))
        const { data } = await api.get<{ progress: { phase: string; message: string; report?: Report; error?: string } | null }>(
          `/admin/marketplace/${id}/status`,
        )
        const p = data.progress
        if (!p) continue
        setPhase((prev) => ({ ...prev, [id]: p.message || p.phase }))
        if (p.phase === 'done') return p.report as Report
        if (p.phase === 'error') throw new Error(p.error || t('admin.mk_install_failed', { defaultValue: "L'installation a échoué." }))
      }
      throw new Error(t('admin.mk_timeout', { defaultValue: 'Délai d’installation dépassé.' }))
    },
    onMutate: (id) => { setBusy(id); setOkMsg(null); setErrMsg(null); setPhase((p) => ({ ...p, [id]: '…' })) },
    onSuccess: (report) => {
      setOkMsg(t('admin.mk_installed', {
        defaultValue: '« {{name}} » v{{version}} installé' + (report.started ? ' et démarré.' : '.'),
        name: report.name, version: report.version,
      }))
      qc.invalidateQueries({ queryKey: ['admin-marketplace'] })
      qc.invalidateQueries({ queryKey: ['admin-modules'] })
      useModulesStore.getState().fetchModules()
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message
        || (e as { message?: string })?.message
      setErrMsg(msg || t('admin.mk_install_failed', { defaultValue: "L'installation a échoué." }))
    },
    onSettled: (_d, _e, id) => { setBusy(null); setPhase((p) => { const n = { ...p }; delete n[id]; return n }) },
  })

  const uninstall = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/marketplace/${id}`).then((r) => r.data),
    onMutate: (id) => { setBusy(id); setOkMsg(null); setErrMsg(null) },
    onSuccess: () => {
      setOkMsg(t('admin.mk_uninstalled', { defaultValue: 'Module désinstallé.' }))
      qc.invalidateQueries({ queryKey: ['admin-marketplace'] })
      qc.invalidateQueries({ queryKey: ['admin-modules'] })
      useModulesStore.getState().fetchModules()
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      setErrMsg(msg || t('admin.mk_uninstall_failed', { defaultValue: 'La désinstallation a échoué.' }))
    },
    onSettled: () => setBusy(null),
  })

  const categories = [...new Set((data ?? []).map((m) => m.category || 'Autres'))]

  return (
    <div>
      <button onClick={onBack}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary">
        <ArrowLeft size={15} />
        {t('admin.m_back', { defaultValue: 'Modules' })}
      </button>

      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center">
          <Package size={16} className="text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">{t('admin.m_marketplace', { defaultValue: 'Marketplace' })}</p>
          <p className="text-xs text-text-tertiary">{t('admin.mk_subtitle', { defaultValue: 'Installer des modules officiels' })}</p>
        </div>
      </div>

      {okMsg && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-success bg-success-light px-4 py-3 text-sm text-text-primary">
          <Check size={16} className="mt-0.5 flex-shrink-0 text-success" />
          <span className="flex-1">{okMsg}</span>
          <button onClick={() => setOkMsg(null)} className="flex-shrink-0"><X size={14} /></button>
        </div>
      )}
      {errMsg && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-danger bg-danger-light px-4 py-3 text-sm text-danger">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <span className="flex-1">{errMsg}</span>
          <button onClick={() => setErrMsg(null)} className="flex-shrink-0"><X size={14} /></button>
        </div>
      )}

      {isLoading && <p className="text-sm text-text-tertiary">{t('admin.mk_loading', { defaultValue: 'Chargement du catalogue…' })}</p>}
      {isError && <p className="text-sm text-danger">{t('admin.mk_catalog_error', { defaultValue: 'Catalogue indisponible (connexion à kubuno.com requise).' })}</p>}

      {categories.map((cat) => (
        <div key={cat} className="mb-6">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-text-tertiary mb-2">{cat}</h4>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(data ?? []).filter((m) => (m.category || 'Autres') === cat).map((mod) => {
              const upToDate = mod.installed && mod.installed_version === mod.version
              const canUpdate = mod.installed && mod.installed_version !== mod.version
              const isBusy = busy === mod.id
              return (
                <div key={mod.id} className="bg-white rounded-xl border border-border p-4 flex flex-col gap-3">
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white"
                         style={{ backgroundColor: mod.accent || '#1a73e8' }}>
                      <Package size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-text-primary truncate">{mod.name}</p>
                        {mod.official && (
                          <span className="text-[10px] px-1.5 py-px rounded-full bg-primary-light text-primary font-medium">
                            {t('admin.mk_official', { defaultValue: 'Officiel' })}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-tertiary flex items-center gap-2">
                        v{mod.version}
                        {typeof mod.rating === 'number' && mod.rating > 0 && (
                          <span className="inline-flex items-center gap-0.5"><Star size={11} className="text-warning" fill="currentColor" />{mod.rating}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  {mod.summary && <p className="text-xs text-text-secondary leading-relaxed line-clamp-3">{mod.summary}</p>}
                  <div className="mt-auto flex items-center justify-between gap-2">
                    {mod.links?.repo
                      ? <a href={mod.links.repo} target="_blank" rel="noreferrer"
                           className="text-xs text-text-tertiary hover:text-primary inline-flex items-center gap-1">
                          <ExternalLink size={12} /> {t('admin.mk_source', { defaultValue: 'Source' })}
                        </a>
                      : <span />}
                    <div className="flex items-center gap-1.5">
                      {mod.removable && (
                        <button
                          onClick={() => uninstall.mutate(mod.id)}
                          disabled={isBusy}
                          title={t('admin.mk_uninstall', { defaultValue: 'Désinstaller' })}
                          className="p-1.5 rounded-lg text-text-tertiary hover:text-danger hover:bg-danger-light disabled:opacity-60 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      )}
                      {upToDate ? (
                        <span className="text-xs px-2.5 py-1 rounded-lg bg-success-light text-success font-medium inline-flex items-center gap-1">
                          <Check size={13} /> {t('admin.mk_installed_badge', { defaultValue: 'Installé' })}
                        </span>
                      ) : (
                        <button
                          onClick={() => install.mutate(mod.id)}
                          disabled={isBusy}
                          className="text-xs px-3 py-1.5 rounded-lg bg-primary text-white font-medium inline-flex items-center gap-1.5 hover:bg-primary-hover disabled:opacity-60 transition-colors">
                          {isBusy
                            ? <><RefreshCw size={13} className="animate-spin" /> {phase[mod.id] || t('admin.mk_installing', { defaultValue: 'Installation…' })}</>
                            : canUpdate
                              ? <><RefreshCw size={13} /> {t('admin.mk_update', { defaultValue: 'Mettre à jour' })}</>
                              : <><Download size={13} /> {t('admin.mk_install', { defaultValue: 'Installer' })}</>}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
