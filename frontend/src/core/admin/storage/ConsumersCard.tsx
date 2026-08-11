import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import { Download, HardDrive, SlidersHorizontal } from 'lucide-react'
import { Button, DataTable, EmptyState, ProgressBar, type DataTableColumn, type DataTableRowAction } from '@ui'
import { PRIV } from '../../authz/types'
import { usePrivileges } from '../../authz/usePrivileges'
import { adminUrl, useAdminAction } from '../adminAction'
import { formatBytes } from '../sections/format'
import AccountUsageDialog from './AccountUsageDialog'
import {
  useStorageConsumers, type Consumer, type ConsumerFilter, type ConsumerSort,
} from './api'

/**
 * The accounts holding the most, and the one thing an administrator can do about
 * it without leaving the page.
 *
 * A page that shows a problem and offers no way to act on it is a report, not an
 * administration screen — so the row carries the verb. It no longer carries a
 * FORM: the ceiling is a field of the account sheet, which displays it, and a
 * third window that set the same value was a third wording of the same edit. The
 * action opens the sheet with its storage card already in edit mode, so the
 * operator lands on the control rather than on a page to search.
 *
 * Clicking a row opens the read-only sheet — where the bytes went, module by
 * module and category by category. Moving the ceiling stays a named action:
 * inspecting is the safe default, and a mis-click should never land in an editor.
 *
 * ## Two orders, because they answer two questions
 *
 * By volume: who holds the bytes — the question asked when the disk is filling.
 * By fill ratio: who is about to be stopped — the question asked when somebody
 * reports they cannot save. A 200 Mo account on a 200 Mo quota is invisible to
 * the first and top of the second, and only the operator knows which they came
 * for.
 */

const FILTERS: { id: ConsumerFilter; key: string }[] = [
  { id: 'all',  key: 'admin.sto_filter_all' },
  { id: 'near', key: 'admin.sto_filter_near' },
  { id: 'full', key: 'admin.sto_filter_full' },
]

const SORTS: { id: ConsumerSort; key: string }[] = [
  { id: 'used',    key: 'admin.sto_sort_used' },
  { id: 'percent', key: 'admin.sto_sort_percent' },
]

/** A CSV of exactly what is on screen — no second query, no hidden column. */
function exportCsv(rows: Consumer[], headers: string[]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
  const body = rows.map(r => [
    r.display_name?.trim() || r.username,
    r.email,
    r.unit_name ?? '',
    r.used_bytes,
    r.quota_bytes,
    r.quota_bytes > 0 ? Math.round((r.used_bytes / r.quota_bytes) * 100) : '',
  ].map(esc).join(','))
  const csv = [headers.map(esc).join(','), ...body].join('\n')
  // A BOM so a spreadsheet opens the accented names correctly rather than
  // showing mojibake the operator then blames on the export.
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `kubuno-stockage-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function ConsumersCard({
  warnPercent, initialFilter = 'all',
}: {
  warnPercent: number
  /** `/admin/storage?filter=full` — the saturated accounts, addressable directly. */
  initialFilter?: ConsumerFilter
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { can } = usePrivileges()
  const canEdit = can(PRIV.USERS_UPDATE)

  const [filter, setFilter] = useState<ConsumerFilter>(initialFilter)
  const [sort, setSort]     = useState<ConsumerSort>('used')
  const [limit, setLimit]   = useState(25)
  // The read-only sheet. Opening a row inspects; changing the ceiling is an
  // explicit action, so a mis-click never lands in an editor.
  const [inspecting, setInspecting] = useState<Consumer | null>(null)

  const { data, isLoading, isError, refetch } = useStorageConsumers(filter, sort, limit)
  const rows = useMemo(() => data?.consumers ?? [], [data])

  /** The account sheet, storage card open. `set-quota` is claimed there. */
  const openQuota = (id: string) =>
    navigate(adminUrl({
      tab: 'users', action: 'set-quota', id,
      params: { user: id, pane: 'profile' },
    }))

  // `/admin/storage?action=set-quota&id=<user>` — the destination a full-account
  // alert still points at. It is forwarded rather than handled: the editor moved
  // to the sheet, and the alert must not have to know that. No waiting for the
  // row either — the id is all the sheet needs, and the account may well be
  // outside the top 25 this table has loaded.
  useAdminAction('set-quota', id => { if (canEdit && id) openQuota(id) })

  const columns: DataTableColumn<Consumer>[] = [
    {
      id: 'account',
      header: t('admin.sto_col_account'),
      primary: true,
      required: true,
      minWidth: 200,
      sortValue: r => r.display_name?.trim() || r.username,
      cell: r => (
        <div className="min-w-0">
          <div className="truncate text-text-primary">{r.display_name?.trim() || r.username}</div>
          <div className="truncate text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
            {r.email}
          </div>
        </div>
      ),
    },
    {
      id: 'unit',
      header: t('admin.sto_col_unit'),
      sortValue: r => r.unit_name ?? '',
      cell: r => (
        <span className="text-text-secondary">{r.unit_name ?? t('admin.sto_no_unit')}</span>
      ),
    },
    {
      id: 'used',
      header: t('admin.sto_col_used'),
      align: 'right',
      sortValue: r => r.used_bytes,
      cell: r => <span className="tabular-nums text-text-primary">{formatBytes(r.used_bytes)}</span>,
    },
    {
      id: 'quota',
      header: t('admin.sto_col_quota'),
      align: 'right',
      sortValue: r => r.quota_bytes,
      cell: r => <span className="tabular-nums text-text-secondary">{formatBytes(r.quota_bytes)}</span>,
    },
    {
      id: 'fill',
      header: t('admin.sto_col_fill'),
      minWidth: 160,
      sortValue: r => (r.quota_bytes > 0 ? r.used_bytes / r.quota_bytes : 0),
      cell: r => (
        <ProgressBar
          value={r.used_bytes}
          max={Math.max(r.quota_bytes, 1)}
          size="sm"
          showValue
          // The amber/red thresholds are the instance's own, so the colour on
          // this row and the alert in the queue draw the line in one place.
          warnAt={warnPercent / 100}
          dangerAt={1}
          t={t}
        />
      ),
    },
  ]

  const rowActions: DataTableRowAction<Consumer>[] = [
    { id: 'detail', label: t('admin.sto_action_detail'), onClick: r => setInspecting(r) },
    ...(canEdit
      ? [{ id: 'quota', label: t('admin.sto_action_quota'), onClick: (r: Consumer) => openQuota(r.id) }]
      : []),
  ]

  return (
    <>
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={r => r.id}
        loading={isLoading}
        error={isError ? t('admin.sto_load_failed') : undefined}
        onRetry={() => void refetch()}
        rowActions={rowActions}
        onRowClick={r => setInspecting(r)}
        filtered={filter !== 'all'}
        onClearFilters={() => setFilter('all')}
        defaultSort={null}
        pageSize={0}
        minTableWidth={720}
        t={t}
        title={t('admin.sto_consumers_title')}
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex overflow-hidden rounded-md border border-border" role="group">
              {FILTERS.map(f => (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={filter === f.id}
                  onClick={() => setFilter(f.id)}
                  className={clsx(
                    'px-3 py-1.5 transition-colors',
                    filter === f.id ? 'bg-primary-light text-primary' : 'text-text-secondary hover:bg-surface-2',
                  )}
                  style={{ fontSize: 'var(--kb-text-body)' }}
                >
                  {t(f.key)}
                </button>
              ))}
            </div>

            <div className="flex overflow-hidden rounded-md border border-border" role="group">
              {SORTS.map(s => (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={sort === s.id}
                  onClick={() => setSort(s.id)}
                  className={clsx(
                    'flex items-center gap-1.5 px-3 py-1.5 transition-colors',
                    sort === s.id ? 'bg-primary-light text-primary' : 'text-text-secondary hover:bg-surface-2',
                  )}
                  style={{ fontSize: 'var(--kb-text-body)' }}
                >
                  {s.id === 'used' && <SlidersHorizontal size={13} aria-hidden />}
                  {t(s.key)}
                </button>
              ))}
            </div>

            <Button
              variant="ghost"
              size="sm"
              icon={<Download size={14} />}
              disabled={rows.length === 0}
              onClick={() => exportCsv(rows, [
                t('admin.sto_col_account'), t('admin.sto_csv_email'), t('admin.sto_col_unit'),
                t('admin.sto_csv_used_bytes'), t('admin.sto_csv_quota_bytes'), t('admin.sto_csv_fill'),
              ])}
            >
              {t('admin.sto_export')}
            </Button>
          </div>
        }
        emptyState={(
          <EmptyState
            icon={<HardDrive size={26} />}
            variant={filter === 'all' ? 'first-use' : 'no-results'}
            title={filter === 'all' ? t('admin.sto_empty_title') : t('admin.sto_empty_filter_title')}
            description={filter === 'all' ? t('admin.sto_empty_desc') : t('admin.sto_empty_filter_desc')}
            action={filter === 'all' ? undefined : {
              label: t('admin.sto_filter_all'), onClick: () => setFilter('all'), variant: 'secondary',
            }}
            t={t}
          />
        )}
      />

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        {data?.scoped && (
          <p className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
            {t('admin.sto_scoped_notice')}
          </p>
        )}
        {rows.length >= limit && limit < 200 && (
          <Button variant="ghost" size="sm" onClick={() => setLimit(200)}>
            {t('admin.sto_show_more')}
          </Button>
        )}
      </div>

      {inspecting && (
        <AccountUsageDialog
          account={inspecting}
          onClose={() => setInspecting(null)}
          onEditQuota={canEdit
            ? () => { const id = inspecting.id; setInspecting(null); openQuota(id) }
            : undefined}
        />
      )}
    </>
  )
}
