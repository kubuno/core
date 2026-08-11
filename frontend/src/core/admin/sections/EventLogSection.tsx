import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Activity, ChevronDown, ChevronRight, Radio } from 'lucide-react'
import { Button, Callout, Combobox, DataTable, EmptyState, type ComboboxOption, type DataTableColumn } from '@ui'
import { api } from '../../api/client'
import { formatWhen } from './format'

/** Rows fetched per request. The route caps `limit` at 200 server-side. */
const PAGE = 50

interface EventRow {
  id:            number
  event_type:    string
  source_module: string | null
  payload:       Record<string, unknown>
  created_at:    string
}

interface EventPage { events: EventRow[]; limit: number; offset: number }

/**
 * Module event bus (`core.event_log`), 30-day retention.
 *
 * NOT the administrative audit trail: entries here have no actor and record
 * what the SYSTEM did (a file uploaded, an event created), whereas the audit
 * trail records who changed the configuration. Both screens live under
 * "Reporting" and are routinely confused, hence the callout.
 *
 * ── What the route actually offers ───────────────────────────────────────────
 * `GET /admin/event-log` accepts `limit` (≤ 200), `offset` and an EXACT
 * `event_type`. It returns no total and no cursor, so:
 *   • pagination is "load more" over `offset` — a page count would be a lie
 *     without a total, and a page *selector* would let the user jump into a
 *     window whose size nobody knows;
 *   • the type filter is fed from the types actually seen in what has been
 *     loaded (the route exposes no facets endpoint), which is stated in the UI
 *     rather than passed off as an exhaustive catalogue.
 */
export default function EventLogSection() {
  const { t, i18n } = useTranslation()
  const [type, setType] = useState('')
  const [open, setOpen] = useState<number | null>(null)

  const { data, fetchNextPage, hasNextPage, isFetching, isLoading, isError, refetch } = useInfiniteQuery({
    queryKey: ['admin-event-log', type],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => api
      .get<EventPage>('/admin/event-log', {
        params: { limit: PAGE, offset: pageParam, ...(type ? { event_type: type } : {}) },
      })
      .then(r => r.data),
    // No total and no cursor: a short page is the only end-of-list signal.
    getNextPageParam: (last, all) =>
      last.events.length < PAGE ? undefined : all.length * PAGE,
  })

  const rows = useMemo(() => (data?.pages ?? []).flatMap(p => p.events), [data])

  // Types observed so far — the honest substitute for a facets endpoint.
  const typeOptions: ComboboxOption[] = useMemo(() => {
    const seen = new Map<string, number>()
    for (const e of rows) seen.set(e.event_type, (seen.get(e.event_type) ?? 0) + 1)
    const options: ComboboxOption[] = [...seen.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([value, count]) => ({ value, label: value, description: t('admin.el_type_count', { total: count }) }))
    // Keep the active filter selectable even once its rows scrolled out.
    if (type && !seen.has(type)) options.unshift({ value: type, label: type })
    return [{ value: '', label: t('admin.el_filter_all_types') }, ...options]
  }, [rows, type, t])

  const columns: DataTableColumn<EventRow>[] = [
    {
      id: 'when',
      header: t('admin.audit_col_when'),
      headerText: t('admin.audit_col_when'),
      minWidth: 170,
      sortValue: e => new Date(e.created_at),
      cell: e => (
        <span className="whitespace-nowrap tabular-nums text-text-secondary">
          {formatWhen(e.created_at, i18n.language)}
        </span>
      ),
    },
    {
      id: 'type',
      header: t('admin.el_col_type'),
      headerText: t('admin.el_col_type'),
      primary: true,
      minWidth: 200,
      sortValue: e => e.event_type,
      cell: (e) => {
        const sub = subType(e)
        return (
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-mono text-text-primary">{e.event_type}</span>
            {sub && (
              <span className="truncate text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
                {sub}
              </span>
            )}
          </span>
        )
      },
    },
    {
      id: 'module',
      header: t('admin.el_col_module'),
      headerText: t('admin.el_col_module'),
      minWidth: 130,
      sortValue: e => sourceModule(e) ?? '',
      cell: (e) => {
        const mod = sourceModule(e)
        if (!mod) return <span className="text-text-tertiary">—</span>
        return (
          <span className="flex items-center gap-1.5">
            <span className="truncate text-text-primary">{mod}</span>
            {e.source_module == null && (
              // The column is NULL in the database for every row the core
              // writes; the module is then read back out of the payload.
              <span
                className="rounded-full bg-surface-2 px-1.5 py-0.5 text-text-tertiary"
                style={{ fontSize: 'var(--kb-text-micro)' }}
                title={t('admin.el_module_derived')}
              >
                {t('admin.el_module_derived_short')}
              </span>
            )}
          </span>
        )
      },
    },
    {
      id: 'payload',
      header: t('admin.el_col_payload'),
      headerText: t('admin.el_col_payload'),
      minWidth: 280,
      cell: (e) => {
        const expanded = open === e.id
        const json = JSON.stringify(e.payload, null, 2)
        return (
          // Hard width cap: a table cell is sized by its content, so an
          // unbounded <pre> would widen the whole table and make expanding a
          // payload scroll the columns out of view.
          <div className="min-w-0" style={{ maxWidth: 420 }}>
            <button
              type="button"
              onClick={() => setOpen(expanded ? null : e.id)}
              aria-expanded={expanded}
              className="flex w-full min-w-0 items-center gap-1 rounded-sm text-left text-text-secondary
                         transition-colors hover:text-text-primary
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              style={{ fontSize: 'var(--kb-text-meta)' }}
            >
              {expanded ? <ChevronDown size={13} className="shrink-0" /> : <ChevronRight size={13} className="shrink-0" />}
              <span className="min-w-0 truncate font-mono">
                {expanded ? t('admin.el_collapse') : preview(e.payload)}
              </span>
            </button>
            {expanded && (
              <pre className="mt-1.5 max-h-72 overflow-auto rounded-md border border-border bg-surface-1 p-2
                              font-mono text-text-primary"
                   style={{ fontSize: 'var(--kb-text-meta)' }}>
                {json}
              </pre>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {/* No card title here: AdminPage already paints "Event log" as the page
          heading, and repeating it inside the box says nothing twice. */}
      <p className="flex items-center gap-2 text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>
        <Radio size={15} className="shrink-0 text-text-tertiary" aria-hidden />
        {t('admin.el_desc')}
      </p>

      <Callout t={t} variant="info" title={t('admin.el_vs_audit_title')}>
        {t('admin.el_vs_audit_desc')}
      </Callout>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
            <Combobox
              t={t}
              value={type || ''}
              onChange={setType}
              options={typeOptions}
              width={260}
              aria-label={t('admin.el_filter_type')}
              placeholder={t('admin.el_filter_all_types')}
              searchPlaceholder={t('admin.el_filter_type')}
            />
            <span className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
              {t('admin.el_types_hint')}
            </span>
            <span className="ml-auto text-text-secondary tabular-nums" style={{ fontSize: 'var(--kb-text-meta)' }}>
              {t('admin.el_loaded', { total: rows.length })}
            </span>
          </div>

          <DataTable
            t={t}
            rows={rows}
            columns={columns}
            rowKey={e => String(e.id)}
            loading={isLoading}
            skeletonRows={8}
            error={isError ? t('admin.el_error') : undefined}
            onRetry={() => void refetch()}
            filtered={Boolean(type)}
            onClearFilters={() => setType('')}
            // The server already returns newest-first and paginates; sorting or
            // paging locally would only reorder the window that happens to be
            // loaded and would silently contradict the "load more" below.
            manualSort
            pageSize={0}
            configurableColumns
            minTableWidth={820}
            emptyState={(
              <EmptyState
                t={t}
                variant="first-use"
                icon={<Activity size={24} />}
                title={t('admin.el_empty')}
                description={t('admin.el_empty_desc')}
              />
            )}
          />

          {hasNextPage && (
            <div className="text-center">
              <Button variant="secondary" onClick={() => void fetchNextPage()} disabled={isFetching}>
                {isFetching ? t('common.loading') : t('admin.el_load_more')}
              </Button>
            </div>
          )}
      </div>
    </div>
  )
}

// ── Payload helpers ──────────────────────────────────────────────────────────

/** Inner `payload` of the `{ type, payload }` envelope the bus serialises. */
function inner(e: EventRow): Record<string, unknown> | null {
  const p = e.payload?.payload
  return p && typeof p === 'object' && !Array.isArray(p) ? (p as Record<string, unknown>) : null
}

/**
 * `Custom` is a single enum variant carrying the real name in its payload, so
 * the column would otherwise read "Custom" for the bulk of the table.
 */
function subType(e: EventRow): string | null {
  const v = inner(e)?.event_type
  return typeof v === 'string' && v !== e.event_type ? v : null
}

/**
 * `core.event_log.source_module` is never written by the core (the INSERT in
 * `EventBus::publish_and_log` omits the column), so the module is recovered
 * from the payload when it carries one.
 */
function sourceModule(e: EventRow): string | null {
  if (e.source_module) return e.source_module
  const v = inner(e)?.module_id
  return typeof v === 'string' && v ? v : null
}

/** One-line summary shown while the payload is collapsed. */
function preview(payload: Record<string, unknown>): string {
  const json = JSON.stringify(payload)
  return json.length > 120 ? `${json.slice(0, 120)}…` : json
}
