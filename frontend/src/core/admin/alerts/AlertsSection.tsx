import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Ban, Bookmark, BookmarkPlus, Check, Hand, PartyPopper, RefreshCw, Search,
  SlidersHorizontal, Trash2, X,
} from 'lucide-react'
import {
  Button, Combobox, DataTable, EmptyState, Input, MobileSheet, useToast,
  type ComboboxOption, type DataTableBulkAction, type DataTableColumn, type DataTableRowAction,
} from '@ui'
import { formatAgo, formatWhen } from '../sections/format'
import { PRIV } from '../../authz/types'
import { usePrivileges } from '../../authz/usePrivileges'
import { adminUrl, useAdminAction } from '../adminAction'
import type { AdminSectionProps } from '../sections/registry'
import AlertDetail from './AlertDetail'
import {
  useAlertFacets, useAlerts, useAlertSummary, useAlertVerb, useAlertViews, useBulkAlerts,
  useDeleteAlertView, useSaveAlertView, useScanNow,
} from './useAlerts'
import { alertSummary, alertTitle, kindLabel, severityLabel, skinOf, statusLabel } from './labels'
import { EMPTY_FILTERS, type Alert, type AlertFilters, type AlertStatus } from './types'

/**
 * Security ▸ Alert centre — the queue.
 *
 * ── What makes this not a log ────────────────────────────────────────────────
 * Every row is work with a state and an owner, and every row carries the
 * actions that settle it (computed server-side, already narrowed to what the
 * caller may run). The default view is the OPEN queue: an operator arriving
 * here wants what is left to do, not a history.
 *
 * ── Empty is the good news ───────────────────────────────────────────────────
 * "No alert" is the one empty state worth celebrating, and it says WHEN the
 * instance was last checked — because "nothing to report" and "nothing has
 * looked" are not the same sentence, and only one of them is reassuring.
 *
 * ── Mobile ───────────────────────────────────────────────────────────────────
 * The table becomes cards below 700 px (DataTable does that from the container
 * width), row actions move into a bottom sheet, and the filter row — six
 * controls that would wrap into a four-line toolbar — collapses behind a single
 * "Filters" button opening its own sheet.
 */

// ── Filter controls, shared by the toolbar and the mobile sheet ──────────────

function FilterControls({ filters, set, facets, stacked }: {
  filters: AlertFilters
  set:     <K extends keyof AlertFilters>(k: K, v: AlertFilters[K]) => void
  facets:  { kinds: string[]; all_kinds: string[]; assignees: { id: string; label: string }[] } | undefined
  stacked: boolean
}) {
  const { t } = useTranslation()

  const statuses: ComboboxOption[] = [
    { value: '', label: t('admin.al_filter_open') },
    { value: 'new', label: statusLabel(t, 'new') },
    { value: 'acknowledged', label: statusLabel(t, 'acknowledged') },
    { value: 'resolved', label: statusLabel(t, 'resolved') },
    { value: 'ignored', label: statusLabel(t, 'ignored') },
    { value: 'new,acknowledged,resolved,ignored', label: t('admin.al_filter_all_statuses') },
  ]
  const severities: ComboboxOption[] = [
    { value: '', label: t('admin.al_filter_all_severities') },
    { value: 'critical', label: severityLabel(t, 'critical') },
    { value: 'warning', label: severityLabel(t, 'warning') },
    { value: 'info', label: severityLabel(t, 'info') },
  ]
  // The whole catalogue, not only what the instance has already produced: an
  // operator filtering on "module unavailable" wants to know it is empty.
  const kinds: ComboboxOption[] = [
    { value: '', label: t('admin.al_filter_all_kinds') },
    ...(facets?.all_kinds ?? facets?.kinds ?? []).map(k => ({ value: k, label: kindLabel(t, k) })),
  ]
  const assignees: ComboboxOption[] = [
    { value: '', label: t('admin.al_filter_all_assignees') },
    { value: 'me', label: t('admin.al_filter_mine') },
    { value: 'none', label: t('admin.al_filter_unassigned') },
    ...(facets?.assignees ?? []).map(a => ({ value: a.id, label: a.label })),
  ]

  const field = stacked ? 'w-full' : ''
  const dateField = `h-9 rounded-md border border-border bg-surface-0 px-2 text-text-primary ${stacked ? 'w-full' : 'w-[8.5rem]'}`

  return (
    <>
      <Combobox value={filters.status || ''} onChange={v => set('status', v)} options={statuses}
        width={stacked ? undefined : 180} className={field} aria-label={t('admin.al_col_status')} />
      <Combobox value={filters.severity || ''} onChange={v => set('severity', v)} options={severities}
        width={stacked ? undefined : 160} className={field} aria-label={t('admin.al_col_severity')} />
      <Combobox value={filters.kind || ''} onChange={v => set('kind', v)} options={kinds}
        width={stacked ? undefined : 220} className={field} aria-label={t('admin.al_col_kind')} />
      <Combobox value={filters.assignee || ''} onChange={v => set('assignee', v)} options={assignees}
        width={stacked ? undefined : 200} className={field} aria-label={t('admin.al_col_assignee')} />
      <div className={`flex items-center gap-1.5 ${stacked ? 'w-full' : ''}`}>
        <span className="shrink-0 text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
          {t('admin.al_filter_from')}
        </span>
        <input type="date" aria-label={t('admin.al_filter_from')} value={filters.from}
          onChange={e => set('from', e.target.value)} className={dateField}
          style={{ fontSize: 'var(--kb-text-meta)' }} />
        <span className="shrink-0 text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
          {t('admin.al_filter_to')}
        </span>
        <input type="date" aria-label={t('admin.al_filter_to')} value={filters.to}
          onChange={e => set('to', e.target.value)} className={dateField}
          style={{ fontSize: 'var(--kb-text-meta)' }} />
      </div>
    </>
  )
}

// ── Section ──────────────────────────────────────────────────────────────────

export default function AlertsSection({ params, navigate }: AdminSectionProps) {
  const { t, i18n } = useTranslation()
  const { can } = usePrivileges()
  const toast = useToast()

  // Seeded from the URL so a deep link — "my alerts", a saved bookmark, an
  // action offered by the search — opens the queue already narrowed. Read once
  // at mount: after that the operator owns the controls, and a re-render must
  // not drag them back to what the link said.
  const [filters, setFilters] = useState<AlertFilters>(() => ({
    ...EMPTY_FILTERS,
    status:   params.get('status') ?? '',
    severity: params.get('severity') ?? '',
    kind:     params.get('kind') ?? '',
    assignee: params.get('assignee') ?? '',
    q:        params.get('q') ?? '',
  }))
  const [draft, setDraft]     = useState(() => params.get('q') ?? '')
  const [selected, setSelected] = useState<string[]>([])
  const [sheet, setSheet]     = useState(false)
  const [saving, setSaving]   = useState(false)
  const [viewName, setViewName] = useState('')

  const canManage = can(PRIV.ALERTS_MANAGE)
  const openId = params.get('alert')

  const { data: summary }  = useAlertSummary()
  const { data: facets }   = useAlertFacets()
  const { data: views }    = useAlertViews()
  const { data, fetchNextPage, hasNextPage, isFetching, isLoading, isError, refetch } =
    useAlerts(filters, !openId)
  const bulk    = useBulkAlerts()
  const verb    = useAlertVerb()
  const scan    = useScanNow()
  const saveView   = useSaveAlertView()
  const deleteView = useDeleteAlertView()

  // The two verbs the alert centre owns. Claimed here so a recommended action
  // built by the server — `/admin/alerts?action=retry-jobs&id=<alert>` — actually
  // runs instead of merely landing on the page.
  const runVerb = (id: string | null, v: 'retry-jobs' | 'discard-jobs') => {
    if (!id) return
    verb.mutate({ id, verb: v }, {
      onSuccess: () => toast.success(t(v === 'retry-jobs' ? 'admin.al_toast_retried' : 'admin.al_toast_discarded')),
      onError:   () => toast.error(t('admin.al_toast_failed')),
    })
  }
  useAdminAction('retry-jobs',   id => runVerb(id, 'retry-jobs'))
  useAdminAction('discard-jobs', id => runVerb(id, 'discard-jobs'))

  const set = <K extends keyof AlertFilters>(key: K, value: AlertFilters[K]) =>
    setFilters(f => ({ ...f, [key]: value }))

  const rows = useMemo(() => (data?.pages ?? []).flatMap(p => p.alerts), [data])
  const anyFilter = Object.values(filters).some(Boolean)

  if (openId) {
    return <AlertDetail id={openId} onBack={() => navigate(adminUrl({ tab: 'alerts' }))} />
  }

  const columns: DataTableColumn<Alert>[] = [
    {
      id: 'title',
      header: t('admin.al_col_alert'),
      primary: true,
      required: true,
      minWidth: 240,
      cell: (a) => {
        const skin = skinOf(a)
        return (
          <div className="flex min-w-0 items-start gap-2">
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${skin.dot}`} aria-hidden />
            {/* Two lines rather than an ellipsis: on a phone the card title IS
                the row, and "Échecs de connexion répé…" identifies nothing.
                `whitespace-normal` is load-bearing — the card layout wraps the
                primary cell in `truncate`, whose `white-space: nowrap` would
                otherwise keep this on one line however it is clamped. */}
            <div className="min-w-0">
              <div className="line-clamp-2 whitespace-normal break-words text-text-primary">
                {alertTitle(t, a)}
              </div>
              <div className="line-clamp-2 whitespace-normal break-words text-text-tertiary"
                style={{ fontSize: 'var(--kb-text-meta)' }}>
                {alertSummary(t, a)}
              </div>
            </div>
          </div>
        )
      },
      sortValue: (a) => a.title,
    },
    {
      id: 'severity',
      header: t('admin.al_col_severity'),
      width: 110,
      cell: (a) => (
        <span className={`inline-block rounded-full px-1.5 py-0.5 ${skinOf(a).chip}`}
          style={{ fontSize: 'var(--kb-text-micro)' }}>
          {severityLabel(t, a.severity)}
        </span>
      ),
      sortValue: (a) => ({ critical: 0, warning: 1, info: 2 })[a.severity],
    },
    {
      id: 'status',
      header: t('admin.al_col_status'),
      width: 110,
      cell: (a) => (
        <span className="text-text-secondary">{statusLabel(t, a.status)}</span>
      ),
      sortValue: (a) => a.status,
    },
    {
      id: 'occurrences',
      header: t('admin.al_col_occurrences'),
      width: 70,
      align: 'right',
      // The counter is the visible proof that the queue deduplicates: one row
      // saying "×212" instead of two hundred and twelve rows.
      cell: (a) => <span className="tabular-nums text-text-secondary">{a.occurrences}</span>,
      sortValue: (a) => a.occurrences,
    },
    {
      id: 'assignee',
      header: t('admin.al_col_assignee'),
      width: 150,
      cell: (a) => <span className="truncate text-text-secondary">{a.assignee_label ?? '—'}</span>,
      sortValue: (a) => a.assignee_label ?? '',
    },
    {
      id: 'last_seen',
      header: t('admin.al_col_last_seen'),
      width: 150,
      cell: (a) => (
        <span className="whitespace-nowrap text-text-secondary" title={formatWhen(a.last_seen_at, i18n.language)}>
          {formatAgo(a.last_seen_at)}
        </span>
      ),
      sortValue: (a) => new Date(a.last_seen_at),
    },
  ]

  const move = (ids: string[], status: AlertStatus) => bulk.mutate(
    { ids, status },
    {
      onSuccess: () => { setSelected([]); toast.success(t('admin.al_toast_bulk', { count: ids.length })) },
      onError:   () => toast.error(t('admin.al_toast_failed')),
    },
  )

  const bulkActions: DataTableBulkAction<Alert>[] = canManage ? [
    { id: 'ack',     label: t('admin.al_take'),    icon: <Hand size={15} />,  onClick: rs => move(rs.map(r => r.id), 'acknowledged') },
    { id: 'resolve', label: t('admin.al_resolve'), icon: <Check size={15} />, onClick: rs => move(rs.map(r => r.id), 'resolved') },
    { id: 'ignore',  label: t('admin.al_ignore'),  icon: <Ban size={15} />,   onClick: rs => move(rs.map(r => r.id), 'ignored') },
  ] : []

  const rowActions: DataTableRowAction<Alert>[] = canManage ? [
    { id: 'ack',     label: t('admin.al_take'),    icon: <Hand size={15} />,  onClick: r => move([r.id], 'acknowledged'), hidden: r => r.status === 'acknowledged' },
    { id: 'resolve', label: t('admin.al_resolve'), icon: <Check size={15} />, onClick: r => move([r.id], 'resolved'),     hidden: r => r.status === 'resolved' },
    { id: 'ignore',  label: t('admin.al_ignore'),  icon: <Ban size={15} />,   onClick: r => move([r.id], 'ignored'),      hidden: r => r.status === 'ignored' },
  ] : []

  const applyView = (name: string) => {
    const view = (views ?? []).find(v => v.name === name)
    if (!view) return
    setFilters({ ...EMPTY_FILTERS, ...view.filters })
    setDraft(view.filters.q ?? '')
  }

  const doSaveView = () => {
    const name = viewName.trim()
    if (!name) return
    saveView.mutate({ name, filters: filters as unknown as Record<string, string> }, {
      onSuccess: () => { setSaving(false); setViewName(''); toast.success(t('admin.al_toast_view_saved')) },
      onError:   () => toast.error(t('admin.al_toast_failed')),
    })
  }

  const toolbar = (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <form className="flex items-center" onSubmit={e => { e.preventDefault(); set('q', draft) }}>
        <Input value={draft} onChange={e => setDraft(e.target.value)}
          placeholder={t('admin.al_search_ph')} leftIcon={<Search size={15} />} className="w-52 pl-9" />
      </form>
      {/* The six selects would wrap into a four-line toolbar on a phone; below
          `sm` they live in a sheet behind one button instead. */}
      <div className="hidden flex-wrap items-center gap-2 sm:flex">
        <FilterControls filters={filters} set={set} facets={facets} stacked={false} />
      </div>
      <Button variant="secondary" size="sm" className="sm:hidden"
        icon={<SlidersHorizontal size={14} />} onClick={() => setSheet(true)}>
        {t('admin.al_filters')}
      </Button>
      {anyFilter && (
        <Button variant="ghost" size="sm" icon={<X size={14} />}
          onClick={() => { setFilters(EMPTY_FILTERS); setDraft('') }}>
          {t('admin.al_reset_filters')}
        </Button>
      )}
    </div>
  )

  return (
    <div className="min-w-0">
      <div className="mb-4 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
        <h1 className="min-w-0 text-text-primary" style={{ fontSize: 'var(--kb-text-page)' }}>
          {t('admin.nav_alerts')}
        </h1>
        {summary && (
          <span className="text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
            {t('admin.al_counts', {
              open: summary.open, critical: summary.critical, mine: summary.mine,
            })}
          </span>
        )}
        <div className="ms-auto flex items-center gap-2">
          {canManage && (
            <Button variant="secondary" size="sm" icon={<RefreshCw size={14} />} loading={scan.isPending}
              onClick={() => scan.mutate(undefined, {
                onSuccess: () => toast.success(t('admin.al_toast_scanned')),
                onError:   () => toast.error(t('admin.al_toast_failed')),
              })}>
              {t('admin.al_scan_now')}
            </Button>
          )}
        </div>
      </div>

      {/* Saved filter sets — personal working sets, applied in one click. */}
      <div className="mb-3 flex min-w-0 flex-wrap items-center gap-2">
        {(views ?? []).map(v => (
          <span key={v.id}
            className="inline-flex items-center gap-1 rounded-full bg-surface-2 ps-2.5 pe-1 py-0.5 text-text-secondary"
            style={{ fontSize: 'var(--kb-text-meta)' }}>
            <button type="button" onClick={() => applyView(v.name)}
              className="inline-flex items-center gap-1 rounded-sm hover:text-text-primary
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <Bookmark size={12} />{v.name}
            </button>
            <button type="button" aria-label={t('admin.al_view_delete', { name: v.name })}
              onClick={() => deleteView.mutate(v.id)}
              className="rounded-full p-0.5 hover:bg-surface-3 hover:text-text-primary
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <Trash2 size={12} />
            </button>
          </span>
        ))}
        {saving ? (
          <span className="inline-flex items-center gap-1.5">
            <Input value={viewName} onChange={e => setViewName(e.target.value)}
              placeholder={t('admin.al_view_name_ph')} className="w-44"
              onKeyDown={e => { if (e.key === 'Enter') doSaveView() }} />
            <Button variant="secondary" size="sm" onClick={doSaveView} disabled={!viewName.trim()}>
              {t('admin.al_view_save')}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSaving(false)}>{t('common.cancel')}</Button>
          </span>
        ) : (
          <Button variant="ghost" size="sm" icon={<BookmarkPlus size={14} />} onClick={() => setSaving(true)}>
            {t('admin.al_view_new')}
          </Button>
        )}
      </div>

      <DataTable
        rows={rows}
        columns={columns}
        rowKey={r => r.id}
        loading={isLoading}
        error={isError ? t('admin.al_error') : undefined}
        onRetry={() => void refetch()}
        filtered={anyFilter}
        onClearFilters={() => { setFilters(EMPTY_FILTERS); setDraft('') }}
        toolbar={toolbar}
        selectable={canManage}
        selectedIds={selected}
        onSelectionChange={setSelected}
        bulkActions={bulkActions}
        rowActions={rowActions}
        onRowClick={r => navigate(adminUrl({ tab: 'alerts', params: { alert: r.id } }))}
        configurableColumns
        pageSize={0}
        t={t}
        emptyState={
          // The ONE empty state worth celebrating — and it says when the
          // instance was last looked at, because silence is only good news
          // when something has been listening.
          <EmptyState
            icon={<PartyPopper size={26} />}
            variant="first-use"
            title={t('admin.al_empty_title')}
            description={
              summary?.last_scan_at
                ? t('admin.al_empty_checked', { when: formatWhen(summary.last_scan_at, i18n.language) })
                : t('admin.al_empty_never_checked')
            }
            action={canManage ? {
              label: t('admin.al_scan_now'),
              variant: 'secondary',
              icon: <RefreshCw size={14} />,
              onClick: () => scan.mutate(undefined, {
                onSuccess: () => toast.success(t('admin.al_toast_scanned')),
                onError:   () => toast.error(t('admin.al_toast_failed')),
              }),
            } : undefined}
          />
        }
      />

      {hasNextPage && (
        <div className="mt-3 text-center">
          <Button variant="secondary" size="sm" disabled={isFetching} onClick={() => void fetchNextPage()}>
            {isFetching ? t('common.loading') : t('admin.al_load_more')}
          </Button>
        </div>
      )}

      <MobileSheet open={sheet} onClose={() => setSheet(false)} title={t('admin.al_filters')}>
        <div className="flex flex-col gap-3 px-4 pb-2">
          <FilterControls filters={filters} set={set} facets={facets} stacked />
          <Button variant="secondary" onClick={() => setSheet(false)}>{t('admin.al_filters_apply')}</Button>
        </div>
      </MobileSheet>
    </div>
  )
}
