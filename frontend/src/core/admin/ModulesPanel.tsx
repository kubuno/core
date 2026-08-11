import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { Package, Settings, AlertCircle, X, CircleSlash, TriangleAlert } from 'lucide-react'
import { Toggle, Radio } from '@ui'
import MarketplacePanel from './MarketplacePanel'
import { adminUrl, useAdminAction } from './adminAction'
import type { AdminSectionProps } from './sections/registry'
import {
  LIVE_STATE_KEY, useAdminModules, useModuleLiveState, useToggleModule, type ModuleLiveState,
} from './adminModules'

// Applications ▸ Modules installés — the inventory, at `/admin/modules`.
//
// One module's administration is no longer opened *inside* this panel: it is a
// place of its own (`/admin/modules/<id>`, rendered by `ModuleAdminPage`), which
// is what lets the sidebar list every module as a row and an operator bookmark
// one. This panel therefore only navigates; it never holds a "currently open
// module" of its own.

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

/** Status chip — the same three-state vocabulary as the sidebar and the page. */
function StateChip({ state }: { state: ModuleLiveState }) {
  const { t } = useTranslation()
  const skin: Record<ModuleLiveState, string> = {
    running:     'bg-success-light text-success',
    unknown:     'bg-surface-2 text-text-secondary',
    disabled:    'bg-surface-2 text-text-tertiary',
    unreachable: 'bg-warning-light text-warning',
  }
  const icon = state === 'disabled' ? <CircleSlash size={12} />
    : state === 'unreachable' ? <TriangleAlert size={12} />
      : null
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${skin[state]}`}
      style={{ fontSize: 'var(--kb-text-micro)' }}>
      {icon}
      {t(LIVE_STATE_KEY[state])}
    </span>
  )
}

export default function ModulesPanel({ navigate }: AdminSectionProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [infoMsg,  setInfoMsg]  = useState<string | null>(null)
  const [showMarketplace, setShowMarketplace] = useState(false)

  const { data } = useAdminModules()
  const liveState = useModuleLiveState()

  // `/admin/modules?action=settings&id=<module>` is the historic spelling minted
  // by the admin search and by alerts. It now RESOLVES to the module's own page
  // rather than opening a panel in place.
  useAdminAction('settings', (id) => {
    if (id) navigate(adminUrl({ tab: 'modules', params: { module: id } }), { replace: true })
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

  const toggle = useToggleModule()

  const flip = (id: string, is_enabled: boolean) => {
    setErrorMsg(null)
    toggle.mutate({ id, is_enabled }, {
      onSuccess: (result) => {
        if (!result.is_enabled && result.also_disabled.length > 0) {
          setInfoMsg(t('admin.m_cascade', { list: result.also_disabled.join(', ') }))
        }
      },
      onError: (err) => {
        const msg = (err as { message?: string })?.message ?? String(err)
        setErrorMsg(msg)
        console.error('[ModulesPanel] toggle failed:', err)
      },
    })
  }

  if (showMarketplace) {
    return <MarketplacePanel onBack={() => setShowMarketplace(false)} />
  }

  return (
    <div className="min-w-0">
      <div className="mb-3 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
        <h1 className="min-w-0 text-text-primary" style={{ fontSize: 'var(--kb-text-page)' }}>
          {t('admin.nav_installed_modules')}
        </h1>
        {data && (
          <span className="text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
            {t('admin.m_count', { count: data.length })}
          </span>
        )}
      </div>

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
        {data?.map((mod) => {
          const href = adminUrl({ tab: 'modules', params: { module: mod.id } })
          return (
            <div key={mod.id} className="bg-white rounded-xl border border-border p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center flex-shrink-0">
                    <Package size={16} className="text-primary" />
                  </div>
                  <div className="min-w-0">
                    {/* A real anchor: the card's title IS the way into the module. */}
                    <a
                      href={href}
                      onClick={e => { e.preventDefault(); navigate(href) }}
                      className="block truncate text-sm text-text-primary hover:text-primary"
                    >
                      {mod.display_name}
                    </a>
                    <p className="text-sm text-text-tertiary">v{mod.version}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a
                    href={href}
                    onClick={e => { e.preventDefault(); navigate(href) }}
                    title={t('admin.m_settings')}
                    aria-label={t('admin.m_settings')}
                    className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-2 transition-colors"
                  >
                    <Settings size={15} />
                  </a>
                  <Toggle
                    checked={mod.is_enabled}
                    onChange={() => flip(mod.id, !mod.is_enabled)}
                  />
                </div>
              </div>
              {mod.description && (
                <p className="text-sm text-text-secondary leading-relaxed">{mod.description}</p>
              )}
              <div className="flex items-center justify-between gap-2">
                <StateChip state={liveState(mod)} />
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
          )
        })}

        {/* Carte marketplace : ouvre le catalogue distant. */}
        <button
          onClick={() => setShowMarketplace(true)}
          className="bg-surface-1 rounded-xl border border-dashed border-border p-4
                     flex flex-col items-center justify-center text-center gap-2 min-h-[120px]
                     hover:border-primary hover:bg-primary-light transition-colors">
          <Package size={24} className="text-primary" />
          <p className="text-sm text-text-primary font-medium">{t('admin.m_marketplace', { defaultValue: 'Marketplace' })}</p>
          <p className="text-sm text-text-tertiary">{t('admin.mk_browse', { defaultValue: 'Parcourir & installer des modules' })}</p>
        </button>
      </div>
    </div>
  )
}
