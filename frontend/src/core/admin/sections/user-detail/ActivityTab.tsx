import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, ChevronRight, History, ShieldAlert, TriangleAlert } from 'lucide-react'
import { Card, DataTable, EmptyState, type DataTableColumn } from '@ui'
import { api } from '../../../api/client'
import type { User } from '../../../types'
import { AUDIT_OUTCOME_STYLE, type AuditEntry } from '../auditTypes'
import { formatWhen } from '../format'

/** How many trail entries each of the two queries pulls. */
const SCOPE_LIMIT = 100

interface AuditPage { entries: AuditEntry[]; next_cursor: string | null }

/**
 * Activity tab — the audit entries that concern this account.
 *
 * ── Why two queries ──────────────────────────────────────────────────────────
 * `GET /admin/audit` filters by `actor_id`, `action`, `target_type`, `outcome`,
 * dates and free text — but NOT by `target_id`. There is therefore no single
 * server-side filter that returns "everything about this account", so the tab
 * combines the two narrowings the route does support:
 *
 *   • `actor_id=<id>`                   — exact: what this account DID;
 *   • `target_type=user&q=<email>`      — what was done TO it. Every entry the
 *     admin handlers write about a user labels its target `"<name> <email>"`,
 *     so the email is a reliable needle.
 *
 * Both results are then filtered EXACTLY on `target_id === id || actor_id === id`
 * before display: `q` is a substring match and could otherwise drag in a
 * homonym. Adding `target_id` to the route would collapse this to one call.
 */
export default function ActivityTab({ user }: { user: User }) {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState<number | null>(null)

  const asTarget = useQuery({
    queryKey: ['admin-audit-user-target', user.id],
    queryFn: () => api
      .get<AuditPage>('/admin/audit', {
        params: { target_type: 'user', q: user.email, limit: SCOPE_LIMIT },
      })
      .then(r => r.data),
  })

  const asActor = useQuery({
    queryKey: ['admin-audit-user-actor', user.id],
    queryFn: () => api
      .get<AuditPage>('/admin/audit', { params: { actor_id: user.id, limit: SCOPE_LIMIT } })
      .then(r => r.data),
  })

  const rows = useMemo(() => {
    const merged = new Map<number, AuditEntry>()
    for (const e of [...(asTarget.data?.entries ?? []), ...(asActor.data?.entries ?? [])]) {
      // Exact ownership test — `q` above is only a pre-filter.
      if (e.target_id === user.id || e.actor_id === user.id) merged.set(e.id, e)
    }
    return [...merged.values()].sort(
      (a, b) => b.occurred_at.localeCompare(a.occurred_at) || b.id - a.id,
    )
  }, [asTarget.data, asActor.data, user.id])

  const isLoading = asTarget.isLoading || asActor.isLoading
  const isError   = asTarget.isError || asActor.isError
  const truncated =
    (asTarget.data?.entries.length ?? 0) >= SCOPE_LIMIT ||
    (asActor.data?.entries.length ?? 0) >= SCOPE_LIMIT

  const columns: DataTableColumn<AuditEntry>[] = [
    {
      id: 'when',
      header: t('admin.audit_col_when'),
      headerText: t('admin.audit_col_when'),
      minWidth: 170,
      sortValue: e => new Date(e.occurred_at),
      cell: e => <span className="whitespace-nowrap tabular-nums text-text-secondary">{formatWhen(e.occurred_at, i18n.language)}</span>,
    },
    {
      id: 'action',
      header: t('admin.audit_col_action'),
      headerText: t('admin.audit_col_action'),
      primary: true,
      minWidth: 180,
      sortValue: e => e.action,
      cell: e => <span className="font-mono">{e.action}</span>,
    },
    {
      id: 'role',
      header: t('admin.ud_act_col_role'),
      headerText: t('admin.ud_act_col_role'),
      minWidth: 110,
      sortValue: e => (e.actor_id === user.id ? 'actor' : 'target'),
      cell: e => (
        <span className="text-text-secondary">
          {e.actor_id === user.id ? t('admin.ud_act_role_actor') : t('admin.ud_act_role_target')}
        </span>
      ),
    },
    {
      id: 'actor',
      header: t('admin.audit_col_actor'),
      headerText: t('admin.audit_col_actor'),
      minWidth: 180,
      defaultHidden: true,
      sortValue: e => e.actor_label,
      cell: e => <span className="text-text-secondary">{e.actor_label}</span>,
    },
    {
      id: 'outcome',
      header: t('admin.audit_col_outcome'),
      headerText: t('admin.audit_col_outcome'),
      minWidth: 110,
      sortValue: e => e.outcome,
      cell: e => (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${AUDIT_OUTCOME_STYLE[e.outcome]}`}
          style={{ fontSize: 'var(--kb-text-meta)' }}
        >
          {e.outcome === 'denied' && <ShieldAlert size={11} />}
          {e.outcome === 'error' && <TriangleAlert size={11} />}
          {t(`admin.audit_outcome_${e.outcome}`)}
        </span>
      ),
    },
    {
      id: 'ip',
      header: t('admin.audit_col_ip'),
      headerText: t('admin.audit_col_ip'),
      minWidth: 120,
      defaultHidden: true,
      sortValue: e => e.ip_address ?? '',
      cell: e => <span className="whitespace-nowrap font-mono text-text-tertiary">{e.ip_address ?? '—'}</span>,
    },
    {
      id: 'detail',
      header: t('admin.ud_act_col_detail'),
      headerText: t('admin.ud_act_col_detail'),
      minWidth: 220,
      // Disclosure inside the cell: the table has no row-expansion API, and a
      // side panel would hide the row the operator is comparing against.
      cell: (e) => {
        const expanded = open === e.id
        const hasBody = e.detail != null || e.before != null || e.after != null
        if (!hasBody) return <span className="text-text-tertiary">—</span>
        return (
          // Capped: a cell is sized by its content, so an unbounded <pre> would
          // widen the table and push the other columns out of view.
          <div className="min-w-0" style={{ maxWidth: 460 }}>
            <button
              type="button"
              onClick={(ev) => { ev.stopPropagation(); setOpen(expanded ? null : e.id) }}
              aria-expanded={expanded}
              className="flex items-center gap-1 rounded-sm text-text-secondary transition-colors
                         hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              style={{ fontSize: 'var(--kb-text-meta)' }}
            >
              {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              {expanded ? t('admin.ud_act_hide') : (e.detail ?? t('admin.ud_act_show'))}
            </button>
            {expanded && (
              <pre className="mt-1.5 max-h-56 overflow-auto rounded-md border border-border bg-surface-1 p-2
                              font-mono text-text-primary"
                   style={{ fontSize: 'var(--kb-text-meta)' }}>
                {JSON.stringify({ detail: e.detail, before: e.before, after: e.after }, null, 2)}
              </pre>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <Card
      title={t('admin.ud_act_title')}
      icon={<History size={16} />}
      subtitle={truncated ? t('admin.ud_act_truncated', { total: SCOPE_LIMIT }) : t('admin.ud_act_desc')}
      flush
    >
      <DataTable
        t={t}
        rows={rows}
        columns={columns}
        rowKey={e => String(e.id)}
        loading={isLoading}
        error={isError ? t('admin.ud_act_error') : undefined}
        onRetry={() => { void asTarget.refetch(); void asActor.refetch() }}
        defaultSort={{ columnId: 'when', direction: 'desc' }}
        pageSize={25}
        pageSizeOptions={[10, 25, 50]}
        configurableColumns
        minTableWidth={760}
        className="p-3"
        emptyState={(
          <EmptyState
            t={t}
            compact
            variant="first-use"
            icon={<History size={22} />}
            title={t('admin.ud_act_empty')}
            description={t('admin.ud_act_empty_desc')}
          />
        )}
      />
    </Card>
  )
}
