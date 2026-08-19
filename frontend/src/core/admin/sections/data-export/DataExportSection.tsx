// Exporting an organisation's data out of the instance.
//
// ## What this page is careful to say out loud
//
// An export is the only act in this console that concentrates everything the
// instance holds about everyone into one file, and then hands it to somebody. So
// the page is built around three statements rather than around a button:
//
//   1. **what an archive contains, and what it never contains** — a list served
//      by the server (`covers` / `not_covers`), so the screen cannot go on
//      promising something the code stopped doing;
//   2. **who is told** — every administrator, the moment an export starts,
//      stated before the operator presses anything rather than discovered
//      afterwards;
//   3. **when it can be fetched, and when it disappears** — the hold and the
//      retention, on the run itself, as dates and not as durations.
//
// ## Why the "download" button is often absent
//
// Four conditions govern an archive: the run finished, the hold has elapsed, the
// file has not been deleted, the retention has not passed. The row shows which
// one is currently false — "disponible le 16/08 à 10:00" is a sentence an
// operator can act on, where a greyed button with no explanation is a page they
// report as broken.
//
// ## Portability
//
// The single-account export is not a separate feature and deliberately not a
// separate screen: it is this page with one account picked. Somebody answering
// "what do you hold about me?" uses the same machinery, the same manifest and the
// same redaction rules as somebody answering "we are leaving" — which is the
// only way the narrow errand cannot drift from the wide one.

import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertTriangle, Ban, CheckCircle2, Clock, DatabaseZap, Download,
  FileArchive, ShieldAlert, Trash2, XCircle,
} from 'lucide-react'
import {
  Badge, Button, Callout, Card, DataTable, EmptyState, ProgressBar, Spinner, useToast,
  type DataTableColumn, type DataTableRowAction,
} from '@ui'
import ConfirmDialog from '@ui/ConfirmDialog'
import { useConfirm } from '../../../hooks/useConfirm'
import { usePrivileges } from '../../../authz/usePrivileges'
import { useAdminAction } from '../../adminAction'
import { adminUrlWith } from '../../adminAction'
import type { AdminSectionProps } from '../registry'
import { formatBytes, formatDuration, formatWhen } from '../format'
import { DATA_EXPORT_EXECUTE, DATA_EXPORT_READ } from './privileges'
import ExportRequestDialog from './ExportRequestDialog'
import ExportSubjectsCard from './ExportSubjectsCard'
import {
  errorMessage, downloadUrl, useCancelExport, useDataExport, useDeleteExport,
  type DataExportOverview, type ExportRun,
} from './api'

export default function DataExportSection({ params, navigate }: AdminSectionProps) {
  const { t } = useTranslation()
  const toast = useToast()
  const { can } = usePrivileges()
  const canRead    = can(DATA_EXPORT_READ)
  const canExecute = can(DATA_EXPORT_EXECUTE)

  const { data, isLoading, isError, refetch } = useDataExport()
  const cancel = useCancelExport()
  const remove = useDeleteExport()
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm()

  const [composing, setComposing] = useState(false)
  const selected = params.get('export')
  const open = (id: string | null) =>
    navigate(adminUrlWith('data-export', params, { export: id }))

  // An export finishing is the one event an operator is actually waiting for,
  // and the page polls rather than being told. `wasRunning` is what turns the
  // transition into a sentence instead of a silently changed table.
  const wasRunning = useRef(false)
  useEffect(() => {
    const running = !!data?.active
    if (wasRunning.current && !running) toast.success(t('admin.dx_finished'))
    wasRunning.current = running
  }, [data?.active, toast, t])

  // Deep link from the alert every administrator receives when an export starts.
  useAdminAction('cancel', id => { if (canExecute && id) void askCancel(id) })

  const askCancel = async (id: string) => {
    const ok = await confirm({
      title:        t('admin.dx_cancel_title'),
      message:      t('admin.dx_cancel_msg'),
      confirmLabel: t('admin.dx_cancel_confirm'),
      variant:      'danger',
    })
    if (!ok) return
    cancel.mutate(id, {
      onSuccess: () => toast.success(t('admin.dx_cancelled')),
      onError:   e => toast.error(errorMessage(e, t('admin.dx_cancel_failed'))),
    })
  }

  const askDelete = async (run: ExportRun) => {
    const ok = await confirm({
      title:        t('admin.dx_delete_title'),
      message:      t('admin.dx_delete_msg', { count: run.subjects_total }),
      confirmLabel: t('common.delete'),
      variant:      'danger',
    })
    if (!ok) return
    remove.mutate(run.id, {
      onSuccess: () => toast.success(t('admin.dx_deleted')),
      onError:   e => toast.error(errorMessage(e, t('admin.dx_delete_failed'))),
    })
  }

  if (!canRead) return null
  if (isLoading) return <div className="flex justify-center py-10"><Spinner /></div>
  if (isError || !data) {
    return (
      <EmptyState
        icon={<DatabaseZap size={26} />}
        variant="error"
        title={t('admin.dx_load_failed')}
        description={t('admin.dx_load_failed_desc')}
        action={{ label: t('admin.dx_retry'), onClick: () => void refetch() }}
        t={t}
      />
    )
  }

  return (
    <div className="min-w-0">
      <Card
        icon={<DatabaseZap size={18} />}
        title={t('admin.dx_title')}
        subtitle={t('admin.dx_intro')}
        actions={canExecute && (
          <Button
            size="sm"
            variant="secondary"
            icon={<FileArchive size={15} />}
            disabled={!data.eligibility.ok}
            onClick={() => setComposing(true)}
          >
            {t('admin.dx_new')}
          </Button>
        )}
      >
        <div className="space-y-4">
          <Eligibility data={data} canExecute={canExecute} />
          <ActiveRun data={data} canExecute={canExecute} onCancel={askCancel} busy={cancel.isPending} />
          <Coverage data={data} />
          <PolicySummary data={data} />
        </div>
      </Card>

      <History
        data={data}
        canExecute={canExecute}
        onOpen={open}
        onCancel={askCancel}
        onDelete={askDelete}
      />

      {selected && (
        <ExportSubjectsCard exportId={selected} onClose={() => open(null)} />
      )}

      {composing && (
        <ExportRequestDialog
          overview={data}
          onClose={() => setComposing(false)}
          onRequested={id => {
            setComposing(false)
            toast.success(t('admin.dx_requested'))
            if (id) open(id)
          }}
        />
      )}

      {confirmState && (
        <ConfirmDialog {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} />
      )}
    </div>
  )
}

// ── Eligibility ──────────────────────────────────────────────────────────────

/** Why the button is off, in sentences. An operator who is refused without a
 *  reason concludes the console is broken; every reason here has a fix. */
function Eligibility({ data, canExecute }: { data: DataExportOverview; canExecute: boolean }) {
  const { t } = useTranslation()

  if (!canExecute) {
    return (
      <Callout variant="info" icon={<ShieldAlert size={16} />} t={t}>
        {t('admin.dx_no_privilege')}
      </Callout>
    )
  }
  if (data.eligibility.ok) return null

  return (
    <Callout variant="warning" title={t('admin.dx_blocked_title')} t={t}>
      <ul className="ml-4 list-disc space-y-1">
        {data.eligibility.blockers.map(b => (
          <li key={b.reason}>
            {t(`admin.dx_blocker_${b.reason}`, {
              days:     b.days ?? 0,
              required: b.required ?? 0,
              detail:   b.detail ?? '',
              defaultValue: b.reason,
            })}
          </li>
        ))}
      </ul>
    </Callout>
  )
}

// ── The run in flight ────────────────────────────────────────────────────────

function ActiveRun({ data, canExecute, onCancel, busy }: {
  data:       DataExportOverview
  canExecute: boolean
  onCancel:   (id: string) => void
  busy:       boolean
}) {
  const { t, i18n } = useTranslation()
  const run = data.active
  if (!run) return null

  const progress = data.progress
  return (
    <div className="rounded-lg border border-border bg-surface-1 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <span className="flex min-w-0 flex-col">
          <span className="flex items-center gap-2 text-text-primary" style={{ fontSize: 'var(--kb-text-body)' }}>
            <Clock size={15} className="shrink-0 text-primary" />
            {t('admin.dx_running_title', { who: run.actor_label ?? '—' })}
          </span>
          <span className="text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
            {t('admin.dx_running_desc', {
              count: run.subjects_total,
              when:  formatWhen(run.available_at, i18n.language),
            })}
          </span>
        </span>
        {canExecute && (
          <Button
            size="sm"
            variant="ghost"
            icon={<Ban size={15} />}
            loading={busy}
            onClick={() => onCancel(run.id)}
          >
            {t('admin.dx_cancel')}
          </Button>
        )}
      </div>
      <div className="mt-3">
        <ProgressBar
          value={progress?.subjects_done ?? 0}
          max={Math.max(progress?.subjects_total ?? 1, 1)}
          variant="primary"
          label={t('admin.dx_progress', {
            done:  progress?.subjects_done ?? 0,
            total: progress?.subjects_total ?? 0,
          })}
          showValue
        />
      </div>
    </div>
  )
}

// ── Coverage ─────────────────────────────────────────────────────────────────

/** What is in the archive and what is not, from the server's own lists. The
 *  second half is the one that must never silently shrink. */
function Coverage({ data }: { data: DataExportOverview }) {
  const { t } = useTranslation()
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-lg border border-border bg-surface-1 p-3">
        <p className="text-text-primary" style={{ fontSize: 'var(--kb-text-body)' }}>
          {t('admin.dx_covers_title')}
        </p>
        <ul className="mt-1.5 space-y-1">
          {data.covers.map(id => (
            <li key={id} className="flex items-start gap-1.5 text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
              <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-success" />
              <span className="min-w-0">{t(`admin.dx_cov_${id}`, { defaultValue: id })}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-lg border border-border bg-surface-1 p-3">
        <p className="text-text-primary" style={{ fontSize: 'var(--kb-text-body)' }}>
          {t('admin.dx_not_covers_title')}
        </p>
        <ul className="mt-1.5 space-y-1">
          {data.not_covers.map(id => (
            <li key={id} className="flex items-start gap-1.5 text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
              <XCircle size={13} className="mt-0.5 shrink-0 text-text-tertiary" />
              <span className="min-w-0">{t(`admin.dx_ncov_${id}`, { defaultValue: id })}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// ── Policy ───────────────────────────────────────────────────────────────────

function PolicySummary({ data }: { data: DataExportOverview }) {
  const { t } = useTranslation()
  const p = data.policy
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
      <Fact label={t('admin.dx_fact_hold')}      value={t('admin.dx_hours', { count: p.hold_hours })} />
      <Fact label={t('admin.dx_fact_retention')} value={t('admin.dx_days', { count: p.retention_days })} />
      <Fact label={t('admin.dx_fact_accounts')}  value={String(data.active_accounts)} />
      <Fact label={t('admin.dx_fact_destination')} value={p.destination} mono />
    </div>
  )
}

function Fact({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <span className="flex min-w-0 flex-col">
      <span className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-micro)' }}>{label}</span>
      <span
        className={`min-w-0 break-words text-text-primary ${mono ? 'font-mono' : ''}`}
        style={{ fontSize: 'var(--kb-text-body)' }}
      >
        {value}
      </span>
    </span>
  )
}

// ── History ──────────────────────────────────────────────────────────────────

const STATUS_SKIN: Record<string, 'neutral' | 'primary' | 'success' | 'warning' | 'danger'> = {
  pending:   'neutral',
  running:   'primary',
  ready:     'success',
  failed:    'danger',
  cancelled: 'warning',
  expired:   'neutral',
}

function History({ data, canExecute, onOpen, onCancel, onDelete }: {
  data:       DataExportOverview
  canExecute: boolean
  onOpen:     (id: string) => void
  onCancel:   (id: string) => void
  onDelete:   (run: ExportRun) => void
}) {
  const { t, i18n } = useTranslation()
  const now = Date.parse(data.now)

  /** Is this archive fetchable right now? The four conditions, in one place. */
  const fetchable = (r: ExportRun) =>
    r.status === 'ready'
    && !r.file_deleted
    && now >= Date.parse(r.available_at)
    && now < Date.parse(r.expires_at)

  const columns: DataTableColumn<ExportRun>[] = [
    {
      id: 'requested_at',
      header: t('admin.dx_col_when'),
      primary: true,
      minWidth: 190,
      sortValue: r => r.requested_at,
      cell: r => (
        <span className="flex min-w-0 flex-col">
          <span className="whitespace-nowrap text-text-primary">
            {formatWhen(r.requested_at, i18n.language)}
          </span>
          <span className="truncate text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
            {r.actor_label ?? '—'}
          </span>
        </span>
      ),
    },
    {
      id: 'scope',
      header: t('admin.dx_col_scope'),
      minWidth: 150,
      sortValue: r => r.subjects_total,
      cell: r => (
        <span className="flex min-w-0 flex-col">
          <span className="text-text-primary">
            {r.scope === 'instance' ? t('admin.dx_scope_instance') : t('admin.dx_scope_accounts')}
          </span>
          <span className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
            {t('admin.dx_accounts', { count: r.subjects_total })}
          </span>
        </span>
      ),
    },
    {
      id: 'status',
      header: t('admin.dx_col_status'),
      minWidth: 200,
      sortValue: r => r.status,
      cell: r => (
        <span className="flex min-w-0 flex-col gap-0.5">
          <span>
            <Badge variant={STATUS_SKIN[r.status] ?? 'neutral'}>
              {t(`admin.dx_status_${r.status}`, { defaultValue: r.status })}
            </Badge>
          </span>
          <span className="min-w-0 break-words text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
            {r.status === 'running' || r.status === 'pending'
              ? t('admin.dx_state_progress', { done: r.subjects_done, total: r.subjects_total })
              : r.status === 'ready' && !r.file_deleted && now < Date.parse(r.available_at)
                ? t('admin.dx_state_held', { when: formatWhen(r.available_at, i18n.language) })
                : r.status === 'ready' && !r.file_deleted
                  ? t('admin.dx_state_until', { when: formatWhen(r.expires_at, i18n.language) })
                  : r.file_deleted
                    ? t('admin.dx_state_deleted')
                    : r.error ?? ''}
          </span>
        </span>
      ),
    },
    {
      id: 'size',
      header: t('admin.dx_col_size'),
      align: 'right',
      minWidth: 100,
      sortValue: r => r.size_bytes ?? -1,
      cell: r => (r.size_bytes == null ? '—' : formatBytes(r.size_bytes)),
    },
    {
      id: 'downloads',
      header: t('admin.dx_col_downloads'),
      align: 'right',
      minWidth: 110,
      sortValue: r => r.download_count,
      cell: r => (
        <span className={r.download_count > 0 ? 'text-text-primary' : 'text-text-tertiary'}>
          {r.download_count}
        </span>
      ),
    },
    {
      id: 'duration',
      header: t('admin.dx_col_duration'),
      align: 'right',
      minWidth: 100,
      defaultHidden: true,
      sortValue: r => r.duration_ms ?? -1,
      cell: r => (r.duration_ms == null ? '—' : formatDuration(r.duration_ms)),
    },
    {
      id: 'entries',
      header: t('admin.dx_col_entries'),
      align: 'right',
      minWidth: 100,
      defaultHidden: true,
      sortValue: r => r.entries_count ?? -1,
      cell: r => (r.entries_count == null ? '—' : String(r.entries_count)),
    },
  ]

  const actions: DataTableRowAction<ExportRun>[] = [
    {
      id: 'download',
      label: t('admin.dx_download'),
      icon: <Download size={15} />,
      hidden: r => !fetchable(r),
      // A full-page navigation, not an XHR: the browser streams the archive to
      // disk with its own progress and its own resume, and nothing of it ever
      // sits in this tab's memory.
      onClick: r => { window.location.href = downloadUrl(r.id) },
    },
    {
      id: 'subjects',
      label: t('admin.dx_see_accounts'),
      icon: <FileArchive size={15} />,
      onClick: r => onOpen(r.id),
    },
    {
      id: 'cancel',
      label: t('admin.dx_cancel'),
      icon: <Ban size={15} />,
      danger: true,
      hidden: r => !canExecute || (r.status !== 'pending' && r.status !== 'running'),
      onClick: r => onCancel(r.id),
    },
    {
      id: 'delete',
      label: t('admin.dx_delete'),
      icon: <Trash2 size={15} />,
      danger: true,
      hidden: r => !canExecute || r.file_deleted || r.status !== 'ready',
      onClick: r => onDelete(r),
    },
  ]

  return (
    <Card
      className="mt-4"
      flush
      icon={<FileArchive size={18} />}
      title={t('admin.dx_history_title')}
      subtitle={t('admin.dx_history_sub')}
    >
      <DataTable
        rows={data.history}
        columns={columns}
        rowKey={r => r.id}
        rowActions={actions}
        defaultSort={null}
        pageSize={0}
        minTableWidth={900}
        configurableColumns
        t={t}
        emptyState={(
          <EmptyState
            icon={<AlertTriangle size={26} />}
            title={t('admin.dx_history_empty')}
            description={t('admin.dx_history_empty_desc')}
            compact
            t={t}
          />
        )}
      />
    </Card>
  )
}
