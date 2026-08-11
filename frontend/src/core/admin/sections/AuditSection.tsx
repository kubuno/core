import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import {
  ChevronDown, ChevronRight, Download, Monitor, RotateCcw, Search, Server, ShieldAlert,
  Terminal, TriangleAlert,
} from 'lucide-react'
import { Button, Dropdown, Input, type DropdownOption } from '@ui'
import { api } from '../../api/client'
import { AUDIT_OUTCOME_STYLE as OUTCOME_STYLE, type AuditEntry, type AuditDiffRow as DiffRow } from './auditTypes'
import { formatWhen } from './format'
import type { AdminSectionProps } from './registry'

interface Facets {
  actions:      string[]
  target_types: string[]
  actors:       { id: string; label: string }[]
  outcomes:     string[]
}
interface Filters {
  q: string; action: string; target_type: string; outcome: string; actor_id: string
  from: string; to: string
}

const EMPTY_FILTERS: Filters = { q: '', action: '', target_type: '', outcome: '', actor_id: '', from: '', to: '' }

/** Only non-empty filters reach the query string, so the cache key stays stable. */
function toParams(f: Filters): Record<string, string> {
  const out: Record<string, string> = {}
  if (f.q)           out.q = f.q
  if (f.action)      out.action = f.action
  if (f.target_type) out.target_type = f.target_type
  if (f.outcome)     out.outcome = f.outcome
  if (f.actor_id)    out.actor_id = f.actor_id
  // <input type="date"> yields YYYY-MM-DD; the backend expects RFC 3339.
  if (f.from)        out.from = `${f.from}T00:00:00Z`
  if (f.to)          out.to = `${f.to}T23:59:59Z`
  return out
}

const ORIGIN_ICON = {
  session:   Monitor,
  api_token: Terminal,
  internal:  Server,
  system:    Server,
} as const

function renderValue(v: unknown): string {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'string') return v
  return JSON.stringify(v)
}

// ── Expanded row: the diff plus the request context ───────────────────────────

function EntryDetail({ entry }: { entry: AuditEntry }) {
  const { t } = useTranslation()
  const { data } = useQuery({
    queryKey: ['admin-audit-entry', entry.id],
    queryFn:  () => api.get<{ entry: AuditEntry; diff: DiffRow[] }>(`/admin/audit/${entry.id}`).then(r => r.data),
    staleTime: 5 * 60_000,
  })
  const diff = data?.diff ?? []

  return (
    <div className="px-5 py-4 bg-surface-1 border-b border-border">
      <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div>
          <h4 className="text-sm font-medium text-text-secondary mb-2">{t('admin.audit_diff_title')}</h4>
          {diff.length === 0 ? (
            <p className="text-sm text-text-tertiary">{t('admin.audit_diff_none')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                <thead>
                  <tr className="text-left text-text-tertiary bg-white">
                    <th className="px-3 py-2 font-medium">{t('admin.audit_diff_field')}</th>
                    <th className="px-3 py-2 font-medium">{t('admin.audit_diff_before')}</th>
                    <th className="px-3 py-2 font-medium">{t('admin.audit_diff_after')}</th>
                  </tr>
                </thead>
                <tbody>
                  {diff.map(d => (
                    <tr key={d.field} className="border-t border-border bg-white">
                      <td className="px-3 py-2 text-text-primary">{d.field}</td>
                      <td className="px-3 py-2 text-text-tertiary break-all">{renderValue(d.before)}</td>
                      <td className="px-3 py-2 text-text-primary break-all">{renderValue(d.after)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <dl className="text-sm space-y-1.5">
          {entry.detail && (
            <div className="flex gap-2">
              <dt className="text-text-tertiary shrink-0">{t('admin.audit_detail')}</dt>
              <dd className="text-text-primary break-all">{entry.detail}</dd>
            </div>
          )}
          {entry.user_agent && (
            <div className="flex gap-2">
              <dt className="text-text-tertiary shrink-0">{t('admin.audit_user_agent')}</dt>
              <dd className="text-text-secondary break-all">{entry.user_agent}</dd>
            </div>
          )}
          {entry.actor_token_id && (
            <div className="flex gap-2">
              <dt className="text-text-tertiary shrink-0">{t('admin.audit_token')}</dt>
              <dd className="text-text-secondary break-all font-mono">{entry.actor_token_id}</dd>
            </div>
          )}
          {entry.target_id && (
            <div className="flex gap-2">
              <dt className="text-text-tertiary shrink-0">{t('admin.audit_target_id')}</dt>
              <dd className="text-text-secondary break-all font-mono">{entry.target_id}</dd>
            </div>
          )}
          {entry.reversible && (
            <div className="flex items-center gap-1.5 text-text-secondary">
              <RotateCcw size={13} />
              <span>{t('admin.audit_reversible')}</span>
            </div>
          )}
          {entry.reverts_entry_id !== null && (
            <div className="text-text-secondary">{t('admin.audit_reverts', { id: entry.reverts_entry_id })}</div>
          )}
          {entry.reverted_by_entry_id !== null && (
            <div className="text-text-secondary">{t('admin.audit_reverted_by', { id: entry.reverted_by_entry_id })}</div>
          )}
        </dl>
      </div>
    </div>
  )
}

// ── Section ───────────────────────────────────────────────────────────────────

/**
 * Initial filters read from the URL.
 *
 * The console's deep actions address a *filtered* trail — an alert saying "five
 * failed sign-ins on this account" links here with the action and the actor
 * already set. Without this the link landed on an unfiltered page and left the
 * operator to rebuild the query by hand, which is exactly the "opens a page
 * instead of the surface" failure `adminAction.ts` exists to avoid.
 *
 * The parameters are prefixed (`audit_action`, `audit_actor`): plain `action`
 * is reserved by the deep-action convention for the VERB, and would be consumed
 * by `useAdminAction` before this section ever saw it.
 */
function filtersFromUrl(params: URLSearchParams): Filters {
  return {
    ...EMPTY_FILTERS,
    q:           params.get('q') ?? '',
    action:      params.get('audit_action') ?? '',
    actor_id:    params.get('audit_actor') ?? '',
    target_type: params.get('audit_target') ?? '',
  }
}

export default function AuditSection({ params }: AdminSectionProps) {
  const { t, i18n } = useTranslation()
  // Read once, at mount: the operator then owns the controls, and a re-render
  // must not drag the filters back to what the link said.
  const [filters, setFilters] = useState<Filters>(() => filtersFromUrl(params))
  const [draft, setDraft]     = useState(() => params.get('q') ?? '')
  const [open, setOpen]       = useState<number | null>(null)

  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters(f => ({ ...f, [key]: value }))

  const { data: facets } = useQuery({
    queryKey: ['admin-audit-facets'],
    queryFn:  () => api.get<Facets>('/admin/audit/facets').then(r => r.data),
    staleTime: 60_000,
  })

  const { data: retention } = useQuery({
    queryKey: ['admin-audit-retention'],
    queryFn:  () => api.get<{ retention_days: number; min_days: number; entries: number }>('/admin/audit/retention').then(r => r.data),
    staleTime: 60_000,
  })

  // Cursor pagination: each page carries the position of the next one, so new
  // entries written while reading never shift the pages already shown.
  const { data, fetchNextPage, hasNextPage, isFetching, isLoading } = useInfiniteQuery({
    queryKey: ['admin-audit', filters],
    initialPageParam: '' as string,
    queryFn: ({ pageParam }) => api
      .get<{ entries: AuditEntry[]; next_cursor: string | null }>('/admin/audit', {
        params: { ...toParams(filters), limit: 50, ...(pageParam ? { cursor: pageParam } : {}) },
      })
      .then(r => r.data),
    getNextPageParam: (last) => last.next_cursor ?? undefined,
  })

  const rows = useMemo(() => (data?.pages ?? []).flatMap(p => p.entries), [data])

  const anyFilter = Object.values(filters).some(Boolean)
  const opt = (values: string[], allLabel: string, label?: (v: string) => string): DropdownOption[] => [
    { value: '', label: allLabel },
    ...values.map(v => ({ value: v, label: label ? label(v) : v })),
  ]

  const exportHref = () => {
    const params = new URLSearchParams(toParams(filters))
    return `/api/v1/admin/audit/export${params.toString() ? `?${params}` : ''}`
  }

  // The CSV route is authenticated like every other call, so it goes through the
  // axios client (which injects the bearer) rather than a bare <a download>.
  const exportCsv = async () => {
    const res = await api.get(exportHref().replace('/api/v1', ''), { responseType: 'blob' })
    const url = URL.createObjectURL(res.data as Blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kubuno-audit-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      {/* Header + retention note */}
      <div className="flex flex-wrap items-baseline gap-2 px-5 py-4 border-b border-border">
        <h2 className="text-base font-medium text-text-primary">{t('admin.audit_title')}</h2>
        {retention && (
          <span className="text-sm text-text-tertiary">
            | {t('admin.audit_retention', { days: retention.retention_days, min: retention.min_days })}
            {' · '}
            {t('admin.audit_entries_count', { count: retention.entries })}
          </span>
        )}
        <div className="ml-auto">
          <Button variant="secondary" onClick={exportCsv}>
            <Download size={15} className="mr-1.5" />
            {t('admin.audit_export')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-2 px-5 py-3 border-b border-border bg-surface-1">
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => { e.preventDefault(); set('q', draft) }}
        >
          <Input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder={t('admin.audit_search_ph')}
            leftIcon={<Search size={15} />}
            className="w-56 pl-9"
          />
        </form>
        <Dropdown
          value={filters.action}
          onChange={v => set('action', v)}
          options={opt(facets?.actions ?? [], t('admin.audit_filter_all_actions'))}
          width={200}
          height={36}
          focusable
        />
        <Dropdown
          value={filters.target_type}
          onChange={v => set('target_type', v)}
          options={opt(facets?.target_types ?? [], t('admin.audit_filter_all_targets'),
            v => t(`admin.audit_target_${v}`, { defaultValue: v }))}
          width={160}
          height={36}
          focusable
        />
        <Dropdown
          value={filters.outcome}
          onChange={v => set('outcome', v)}
          options={opt(facets?.outcomes ?? [], t('admin.audit_filter_all_outcomes'),
            v => t(`admin.audit_outcome_${v}`, { defaultValue: v }))}
          width={140}
          height={36}
          focusable
        />
        <Dropdown
          value={filters.actor_id}
          onChange={v => set('actor_id', v)}
          options={[
            { value: '', label: t('admin.audit_filter_all_actors') },
            ...(facets?.actors ?? []).map(a => ({ value: a.id, label: a.label })),
          ]}
          width={220}
          height={36}
          focusable
        />
        {/* Dates stay on the same row as the selects: labels sit inline rather
            than stacked, which is what pushed the pair onto a second line. */}
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-text-tertiary">{t('admin.audit_filter_from')}</span>
          <input
            type="date"
            aria-label={t('admin.audit_filter_from')}
            value={filters.from}
            onChange={e => set('from', e.target.value)}
            className="h-9 w-[8.5rem] rounded-md border border-border bg-white px-2 text-sm text-text-primary"
          />
          <span className="text-sm text-text-tertiary">{t('admin.audit_filter_to')}</span>
          <input
            type="date"
            aria-label={t('admin.audit_filter_to')}
            value={filters.to}
            onChange={e => set('to', e.target.value)}
            className="h-9 w-[8.5rem] rounded-md border border-border bg-white px-2 text-sm text-text-primary"
          />
        </div>
        {anyFilter && (
          <button
            type="button"
            onClick={() => { setFilters(EMPTY_FILTERS); setDraft('') }}
            className="h-9 px-2 text-sm text-text-tertiary hover:text-text-primary"
          >
            {t('admin.audit_reset_filters')}
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-text-tertiary border-b border-border">
              <th className="w-8" />
              <th className="px-3 py-2.5 font-medium whitespace-nowrap">{t('admin.audit_col_when')}</th>
              <th className="px-3 py-2.5 font-medium">{t('admin.audit_col_actor')}</th>
              <th className="px-3 py-2.5 font-medium">{t('admin.audit_col_action')}</th>
              <th className="px-3 py-2.5 font-medium">{t('admin.audit_col_target')}</th>
              <th className="px-3 py-2.5 font-medium">{t('admin.audit_col_outcome')}</th>
              <th className="px-3 py-2.5 font-medium whitespace-nowrap">{t('admin.audit_col_ip')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !isLoading && (
              <tr><td colSpan={7} className="px-5 py-8 text-center text-sm text-text-tertiary">{t('admin.audit_empty')}</td></tr>
            )}
            {rows.map(e => {
              const OriginIcon = ORIGIN_ICON[e.actor_origin] ?? Monitor
              const expanded = open === e.id
              return [
                <tr
                  key={e.id}
                  onClick={() => setOpen(expanded ? null : e.id)}
                  className="border-b border-border last:border-0 hover:bg-surface-1 transition-colors cursor-pointer"
                >
                  <td className="pl-3 text-text-tertiary">
                    {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                  </td>
                  <td className="px-3 py-2.5 text-text-secondary whitespace-nowrap tabular-nums">
                    {formatWhen(e.occurred_at, i18n.language)}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="flex items-center gap-1.5">
                      <OriginIcon size={13} className="text-text-tertiary shrink-0" />
                      <span className="text-text-primary">{e.actor_label}</span>
                      {e.actor_origin !== 'session' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-2 text-text-tertiary">
                          {t(`admin.audit_origin_${e.actor_origin}`)}
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-text-primary font-mono">{e.action}</td>
                  <td className="px-3 py-2.5 text-text-secondary">{e.target_label || '—'}</td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full ${OUTCOME_STYLE[e.outcome]}`}>
                      {e.outcome === 'denied' && <ShieldAlert size={11} />}
                      {e.outcome === 'error' && <TriangleAlert size={11} />}
                      {t(`admin.audit_outcome_${e.outcome}`)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-text-tertiary whitespace-nowrap font-mono">{e.ip_address || '—'}</td>
                </tr>,
                expanded && (
                  <tr key={`${e.id}-detail`}>
                    <td colSpan={7} className="p-0"><EntryDetail entry={e} /></td>
                  </tr>
                ),
              ]
            })}
          </tbody>
        </table>
      </div>

      {hasNextPage && (
        <div className="px-5 py-3 border-t border-border text-center">
          <Button variant="secondary" onClick={() => void fetchNextPage()} disabled={isFetching}>
            {isFetching ? t('common.loading') : t('admin.audit_load_more')}
          </Button>
        </div>
      )}
    </div>
  )
}
