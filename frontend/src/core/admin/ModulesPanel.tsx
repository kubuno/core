import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { useModulesStore } from '../store/modulesStore'
import { Package, Settings, AlertCircle, X, ArrowLeft } from 'lucide-react'
import { Toggle, Radio } from '@ui'
import ModuleAdminSettings from './ModuleAdminSettings'
import MarketplacePanel from './MarketplacePanel'

interface Module {
  id: string
  display_name: string
  version: string
  description: string | null
  is_enabled: boolean
  installed_at: string
  settings_path: string | null
}

function useDefaultModule() {
  return useQuery({
    queryKey: ['public-config'],
    queryFn: () =>
      api.get<{ config: Record<string, unknown> }>('/config').then((r) => r.data.config),
    staleTime: 60_000,
    select: (config) => {
      const v = config['navigation.default_module']
      return typeof v === 'string' && v.length > 0 ? v : null
    },
  })
}


export default function ModulesPanel() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [infoMsg,  setInfoMsg]  = useState<string | null>(null)
  // When set, the panel shows that module's instance settings IN-PLACE (we stay in
  // the admin console — admins are never sent into the module's own shell).
  const [settingsFor, setSettingsFor] = useState<Module | null>(null)
  const [showMarketplace, setShowMarketplace] = useState(false)

  const { data } = useQuery({
    queryKey: ['admin-modules'],
    queryFn: () => api.get<{ modules: Module[] }>('/admin/modules').then((r) => r.data.modules),
  })

  const { data: defaultModulePath } = useDefaultModule()

  const setDefault = useMutation({
    mutationFn: (path: string | null) =>
      api.patch('/admin/settings', { 'navigation.default_module': path }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-config'] })
    },
    onError: (err) => {
      const msg = (err as { message?: string })?.message ?? String(err)
      setErrorMsg(msg)
    },
  })

  const toggle = useMutation({
    mutationFn: ({ id, is_enabled }: { id: string; is_enabled: boolean }) =>
      api.patch<{ message: string; also_disabled: string[] }>(`/admin/modules/${id}`, { is_enabled })
        .then(r => ({ ...r.data, id, is_enabled })),

    // Flip the toggle in the UI immediately — no spinner, no wait
    onMutate: async ({ id, is_enabled }) => {
      setErrorMsg(null)
      await queryClient.cancelQueries({ queryKey: ['admin-modules'] })
      const previous = queryClient.getQueryData<Module[]>(['admin-modules'])
      queryClient.setQueryData<Module[]>(['admin-modules'], (old) =>
        old?.map((m) => (m.id === id ? { ...m, is_enabled } : m)) ?? []
      )
      return { previous }
    },

    onSuccess: (data) => {
      // Si désactivation en cascade, marquer les dépendants comme désactivés dans l'UI
      if (!data.is_enabled && data.also_disabled.length > 0) {
        queryClient.setQueryData<Module[]>(['admin-modules'], (old) =>
          old?.map((m) => data.also_disabled.includes(m.id) ? { ...m, is_enabled: false } : m) ?? []
        )
        setInfoMsg(t('admin.m_cascade', { list: data.also_disabled.join(', ') }))
      }
    },

    onError: (err, _vars, context) => {
      // Roll back the optimistic update
      if (context?.previous) {
        queryClient.setQueryData(['admin-modules'], context.previous)
      }
      const msg = (err as { message?: string })?.message ?? String(err)
      setErrorMsg(msg)
      console.error('[ModulesPanel] toggle failed:', err)
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-modules'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      useModulesStore.getState().fetchModules()
    },
  })

  if (showMarketplace) {
    return <MarketplacePanel onBack={() => setShowMarketplace(false)} />
  }

  if (settingsFor) {
    return (
      <div>
        <button
          onClick={() => setSettingsFor(null)}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft size={15} />
          {t('admin.m_back', { defaultValue: 'Modules' })}
        </button>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center">
            <Package size={16} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">{settingsFor.display_name}</p>
            <p className="text-xs text-text-tertiary">{t('admin.m_settings', { defaultValue: 'Réglages' })} · v{settingsFor.version}</p>
          </div>
        </div>
        <ModuleAdminSettings moduleId={settingsFor.id} />
      </div>
    )
  }

  return (
    <div>
      {infoMsg && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-warning bg-warning-light px-4 py-3 text-sm text-text-primary">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-warning" />
          <span className="flex-1">{infoMsg}</span>
          <button onClick={() => setInfoMsg(null)} className="flex-shrink-0 text-text-tertiary hover:text-text-primary">
            <X size={14} />
          </button>
        </div>
      )}
      {errorMsg && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-danger bg-danger-light px-4 py-3 text-sm text-danger">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <span className="flex-1">{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="flex-shrink-0">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((mod) => (
          <div key={mod.id} className="bg-white rounded-xl border border-border p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center flex-shrink-0">
                  <Package size={16} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{mod.display_name}</p>
                  <p className="text-xs text-text-tertiary">v{mod.version}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setSettingsFor(mod)}
                  title={t('admin.m_settings')}
                  className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-2 transition-colors"
                >
                  <Settings size={15} />
                </button>
                <Toggle
                  checked={mod.is_enabled}
                  onChange={() => toggle.mutate({ id: mod.id, is_enabled: !mod.is_enabled })}
                />
              </div>
            </div>
            {mod.description && (
              <p className="text-xs text-text-secondary leading-relaxed">{mod.description}</p>
            )}
            <div className="flex items-center justify-between gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                ${mod.is_enabled ? 'bg-success-light text-success' : 'bg-surface-2 text-text-tertiary'}`}>
                {mod.is_enabled ? t('admin.m_enabled') : t('admin.m_disabled')}
              </span>
              <span title={t('admin.m_default_tip')}>
                <Radio
                  checked={defaultModulePath === `/${mod.id}`}
                  disabled={!mod.is_enabled}
                  onChange={c => setDefault.mutate(c ? `/${mod.id}` : null)}
                  label={t('admin.m_default')}
                  labelClassName="text-text-secondary"
                />
              </span>
            </div>
          </div>
        ))}

        {/* Carte marketplace : ouvre le catalogue distant. */}
        <button
          onClick={() => setShowMarketplace(true)}
          className="bg-surface-1 rounded-xl border border-dashed border-border p-4
                     flex flex-col items-center justify-center text-center gap-2 min-h-[120px]
                     hover:border-primary hover:bg-primary-light/40 transition-colors">
          <Package size={24} className="text-primary" />
          <p className="text-sm text-text-primary font-medium">{t('admin.m_marketplace', { defaultValue: 'Marketplace' })}</p>
          <p className="text-xs text-text-tertiary">{t('admin.mk_browse', { defaultValue: 'Parcourir & installer des modules' })}</p>
        </button>
      </div>
    </div>
  )
}
