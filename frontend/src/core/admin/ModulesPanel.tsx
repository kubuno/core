import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import {
  AlertCircle, CircleSlash, Package, Search, Settings, Store, TriangleAlert, X,
} from 'lucide-react'
import { Badge, Button, DataTable, Input, type DataTableColumn, type DataTableRowAction } from '@ui'
import MarketplacePanel from './MarketplacePanel'
import { adminUrl, useAdminAction } from './adminAction'
import type { AdminSectionProps } from './sections/registry'
import { moduleGlyph } from './nav/moduleGlyph'
import {
  useAdminModules, useModuleLiveState, useToggleModule,
  type AdminModule, type ModuleLiveState,
} from './adminModules'

// Applications ▸ Modules installés — the inventory, at `/admin/modules`.
//
// ── A list of services, not a wall of switches ───────────────────────────────
// This used to be a grid of cards, each carrying a bare toggle. A toggle says
// "on" and nothing else: it does not say on FOR WHOM, it does not distinguish a
// service somebody switched off from one that is switched on and answering
// nothing, and a reader scanning twenty of them has to interpret twenty
// switches rather than read twenty sentences.
//
// So the panel is a list, and every row spells its service's state out in
// words — "Activé pour tout le monde", "Désactivé pour tout le monde",
// "Activé — ne répond pas". The state is a sortable column, because "show me
// everything that is off" is the question this page exists to answer. Switching
// a service is a deliberate act in the row's menu, not something a stray click
// on a switch can do while scrolling.
//
// One module's administration is not opened *inside* this panel: it is a place
// of its own (`/admin/modules/<id>`, rendered by `ModuleAdminPage`), which is
// what lets the sidebar list every module as a row and an operator bookmark
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

/**
 * How a service's availability is SAID — the sentence, not the switch.
 *
 * The three states are not degrees of one thing and never share a shape:
 * `disabled` is a decision (neutral), `unreachable` is an incident (a warning),
 * `running` is the normal case and is stated plainly rather than decorated.
 */
const STATUS_KEY: Record<ModuleLiveState, string> = {
  running:     'admin.m_on_everyone',
  unknown:     'admin.m_on_everyone',
  disabled:    'admin.m_off_everyone',
  unreachable: 'admin.m_on_unreachable',
}

/** Sort order of the status column: what needs attention first. */
const STATUS_RANK: Record<ModuleLiveState, number> = {
  unreachable: 0, disabled: 1, running: 2, unknown: 3,
}

function ServiceStatus({ state }: { state: ModuleLiveState }) {
  const { t } = useTranslation()
  const label = t(STATUS_KEY[state])
  const glyph = state === 'disabled'
    ? <CircleSlash size={14} className="shrink-0 text-text-tertiary" />
    : state === 'unreachable'
      ? <TriangleAlert size={14} className="shrink-0 text-warning" />
      : <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-success" />
  const tone = state === 'disabled'
    ? 'text-text-tertiary'
    : state === 'unreachable' ? 'text-warning' : 'text-text-secondary'
  return (
    <span className={`inline-flex items-center gap-2 text-sm ${tone}`}>
      {glyph}
      <span className="truncate">{label}</span>
    </span>
  )
}

export default function ModulesPanel({ navigate }: AdminSectionProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [infoMsg,  setInfoMsg]  = useState<string | null>(null)
  const [showMarketplace, setShowMarketplace] = useState(false)
  const [query, setQuery] = useState('')

  const { data, isLoading } = useAdminModules()
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

  const open = (mod: AdminModule) =>
    navigate(adminUrl({ tab: 'modules', params: { module: mod.id } }))

  const isDefault = (mod: AdminModule) => defaultModulePath === `/${mod.id}`

  // Matched on the name AND the description: an operator looking for the file
  // browser types "fichiers", not the module's own name.
  const rows = useMemo(() => {
    const all = [...(data ?? [])].sort((a, b) => a.display_name.localeCompare(b.display_name))
    const q = query.trim().toLowerCase()
    if (!q) return all
    return all.filter(m =>
      m.display_name.toLowerCase().includes(q)
      || (m.description ?? '').toLowerCase().includes(q)
      || m.id.toLowerCase().includes(q))
  }, [data, query])

  const columns: DataTableColumn<AdminModule>[] = [
    {
      id:         'app',
      header:     t('admin.m_col_app'),
      headerText: t('admin.m_col_app'),
      required:   true,
      primary:    true,
      minWidth:   260,
      sortValue:  m => m.display_name,
      cell: (m) => {
        const Glyph = moduleGlyph(m)
        const off   = !m.is_enabled
        return (
          <div className="flex min-w-0 items-center gap-3">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg
                              bg-surface-2 ${off ? 'opacity-50' : ''}`}>
              {Glyph
                ? <Glyph size={18} className="text-text-secondary" />
                : <Package size={18} className="text-text-secondary" />}
            </span>
            {/* max-width caps the cell's min-content contribution: without it the
                no-wrap name and description widen the column past the card. */}
            <span className="min-w-0 max-w-[560px]">
              <span className="flex items-center gap-2">
                <span className={`truncate text-sm ${off ? 'text-text-tertiary' : 'text-text-primary'}`}>
                  {m.display_name}
                </span>
                <span className="shrink-0 text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
                  v{m.version}
                </span>
                {isDefault(m) && <Badge size="sm">{t('admin.m_default')}</Badge>}
              </span>
              {m.description && (
                <span className="block truncate text-text-tertiary"
                      style={{ fontSize: 'var(--kb-text-meta)' }}>
                  {m.description}
                </span>
              )}
            </span>
          </div>
        )
      },
    },
    // Two columns, like the list this one is modelled on: what the service is,
    // and whether it is on. The version is not a column of its own — it is a
    // detail OF the service, and a third column would have pushed the one fact
    // the page exists for off to the side.
    {
      id:         'status',
      header:     t('admin.m_col_status'),
      headerText: t('admin.m_col_status'),
      // Narrow enough that the status text is never clipped by the card edge:
      // the app column absorbs the remaining width and truncates instead.
      minWidth:   150,
      width:      190,
      sortValue:  m => STATUS_RANK[liveState(m)],
      cell:       m => <ServiceStatus state={liveState(m)} />,
    },
  ]

  const rowActions: DataTableRowAction<AdminModule>[] = [
    {
      id: 'manage', label: t('admin.card_manage'), icon: <Settings size={15} />,
      onClick: open,
    },
    {
      id: 'enable', label: t('admin.m_turn_on'),
      hidden:  m => m.is_enabled,
      onClick: m => flip(m.id, true),
    },
    {
      id: 'disable', label: t('admin.m_turn_off'),
      hidden:  m => !m.is_enabled,
      onClick: m => flip(m.id, false),
    },
    {
      id: 'default', label: t('admin.m_default_set'),
      // A switched-off service cannot be what the product opens on, and a
      // service that already is offers the opposite action instead.
      hidden:  m => !m.is_enabled || isDefault(m),
      onClick: m => setDefault.mutate(`/${m.id}`),
    },
    {
      id: 'undefault', label: t('admin.m_default_unset'),
      hidden:  m => !isDefault(m),
      onClick: () => setDefault.mutate(null),
    },
  ]

  if (showMarketplace) {
    return <MarketplacePanel onBack={() => setShowMarketplace(false)} />
  }

  return (
    <div className="min-w-0">
      <div className="mb-4 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
        <h1 className="min-w-0 text-text-primary" style={{ fontSize: 'var(--kb-text-page)' }}>
          {t('admin.nav_installed_modules')}
        </h1>
        {data && (
          <span className="text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
            {t('admin.m_count', { count: data.length })}
          </span>
        )}
        <span className="flex-1" />
        <Button variant="secondary" icon={<Store size={15} />} onClick={() => setShowMarketplace(true)}>
          {t('admin.m_marketplace')}
        </Button>
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

      <DataTable
        rows={rows}
        columns={columns}
        rowKey={m => m.id}
        loading={isLoading}
        filtered={query.trim().length > 0}
        onClearFilters={() => setQuery('')}
        rowActions={rowActions}
        onRowClick={open}
        defaultSort={{ columnId: 'app', direction: 'asc' }}
        pageSize={0}
        t={t}
        toolbar={
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('admin.m_filter_ph')}
            aria-label={t('admin.m_filter_ph')}
            leftIcon={<Search size={16} />}
            className="w-64 max-w-full"
          />
        }
      />
    </div>
  )
}
