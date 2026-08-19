// One campaign's sheet: what it is copying, from where, and where every account
// has got to.
//
// ## The account table is the report
//
// There is no separate "rapport final" screen, and that is deliberate: a report
// that exists only at the end is a screen nobody can consult while it matters,
// and one that duplicates the live table is two places to keep in agreement. So
// the table IS the report — it shows the same rows during and after, and a
// finished campaign simply stops moving.
//
// ## Retry is per account
//
// The whole point of recording a cursor per mailbox is that a failure costs one
// mailbox and resumes where it stopped. So the failed row carries the button,
// not the page: "tout relancer" on a campaign whose only problem is four wrong
// passwords would re-walk two hundred mailboxes to fix four.

import { useTranslation } from 'react-i18next'
import {
  AlertTriangle, CheckCircle2, Clock, Loader2, Pause, Play, RotateCw, Trash2,
} from 'lucide-react'
import {
  Badge, Button, Callout, Card, DataTable, ProgressBar, useToast,
  type DataTableColumn,
} from '@ui'
import ConfirmDialog from '@ui/ConfirmDialog'
import { useConfirm } from '../../../hooks/useConfirm'
import { useAdminCrumbs } from '../../AdminBreadcrumb'
import {
  errorMessage, useCampaignDetail, useDeleteCampaign, usePauseCampaign,
  useRetryAccount, useStartCampaign, type MigrationAccount,
} from './api'

function StatusChip({ status }: { status: MigrationAccount['status'] }) {
  const { t } = useTranslation()
  const label = t(`admin.migr_acc_status_${status}`)
  if (status === 'done') {
    return (
      <span className="flex items-center gap-1.5 text-success">
        <CheckCircle2 size={14} /> {label}
      </span>
    )
  }
  if (status === 'failed') {
    return (
      <span className="flex items-center gap-1.5 text-danger">
        <AlertTriangle size={14} /> {label}
      </span>
    )
  }
  if (status === 'running') {
    return (
      <span className="flex items-center gap-1.5 text-primary">
        <Loader2 size={14} className="animate-spin" /> {label}
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1.5 text-text-tertiary">
      <Clock size={14} /> {label}
    </span>
  )
}

export default function CampaignDetail({
  campaignId, canManage, onGone,
}: {
  campaignId: string
  canManage: boolean
  /** Called after a removal, so the page can return to the list. */
  onGone: () => void
}) {
  const { t } = useTranslation()
  const toast = useToast()
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm()

  const { data, isLoading, isError, refetch } = useCampaignDetail(campaignId)
  const start  = useStartCampaign()
  const pause  = usePauseCampaign()
  const retry  = useRetryAccount()
  const remove = useDeleteCampaign()

  const campaign = data?.campaign
  const accounts = data?.accounts ?? []

  useAdminCrumbs(campaign ? [{ label: campaign.name }] : [])

  if (isLoading || !campaign) {
    return (
      <p className="text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>
        {isError ? t('admin.migr_load_failed') : t('admin.migr_loading')}
      </p>
    )
  }

  const tally = campaign.tally
  const progress = tally.total > 0 ? Math.min(100, Math.round((tally.copied / tally.total) * 100)) : 0

  const columns: DataTableColumn<MigrationAccount>[] = [
    {
      id: 'source',
      header: t('admin.migr_col_source'),
      primary: true,
      minWidth: 200,
      sortValue: r => r.source_login,
      cell: r => <span className="truncate text-text-primary">{r.source_login}</span>,
    },
    {
      id: 'target',
      header: t('admin.migr_col_target'),
      minWidth: 200,
      sortValue: r => r.target_email ?? '',
      cell: r => (
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-text-primary">{r.target_name || r.target_email || '—'}</span>
          {r.target_name && r.target_email && (
            <span className="truncate text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
              {r.target_email}
            </span>
          )}
        </span>
      ),
    },
    {
      id: 'status',
      header: t('admin.migr_col_status'),
      minWidth: 180,
      sortValue: r => r.status,
      cell: r => (
        <span className="flex min-w-0 flex-col">
          <StatusChip status={r.status} />
          {r.error && (
            <span className="truncate text-danger" style={{ fontSize: 'var(--kb-text-meta)' }} title={r.error}>
              {r.error}
            </span>
          )}
        </span>
      ),
    },
    {
      id: 'items',
      header: t('admin.migr_col_items'),
      align: 'right',
      minWidth: 140,
      sortValue: r => r.items_copied,
      cell: r => (
        <span className="text-text-secondary">
          {r.items_total > 0
            ? t('admin.migr_items_of', { copied: r.items_copied, total: r.items_total })
            : r.items_copied || '—'}
        </span>
      ),
    },
    {
      id: 'action',
      header: '',
      align: 'right',
      minWidth: 120,
      cell: r => (
        r.status === 'failed' && canManage
          ? (
            <Button
              variant="secondary"
              size="sm"
              disabled={retry.isPending}
              onClick={e => {
                e.stopPropagation()
                retry.mutate(
                  { id: campaignId, accountId: r.id },
                  {
                    onSuccess: () => toast.success(t('admin.migr_retry_queued')),
                    onError:   err => toast.error(errorMessage(err, t('admin.migr_retry_failed'))),
                  },
                )
              }}
            >
              <RotateCw size={14} /> {t('admin.migr_retry')}
            </Button>
          )
          : null
      ),
    },
  ]

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="min-w-0 truncate text-text-primary" style={{ fontSize: 'var(--kb-text-page)' }}>
            {campaign.name}
          </h1>
          <p className="mt-1 text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>
            {t('admin.migr_detail_sub', {
              service: t(`admin.migr_service_${campaign.service}`),
              host:    campaign.source_host,
            })}
          </p>
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
            {campaign.status === 'running' ? (
              <Button
                variant="secondary"
                disabled={pause.isPending}
                onClick={() => pause.mutate(campaignId, {
                  onError: err => toast.error(errorMessage(err, t('admin.migr_save_failed'))),
                })}
              >
                <Pause size={16} /> {t('admin.migr_pause')}
              </Button>
            ) : (
              <Button
                variant="primary"
                disabled={start.isPending}
                onClick={() => start.mutate(campaignId, {
                  onError: err => toast.error(errorMessage(err, t('admin.migr_save_failed'))),
                })}
              >
                <Play size={16} /> {campaign.started_at ? t('admin.migr_resume') : t('admin.migr_start')}
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => void confirm({
                title:   t('admin.migr_delete_title'),
                message: t('admin.migr_delete_message', { name: campaign.name }),
                confirmLabel: t('admin.migr_delete'),
                variant: 'danger',
              }).then(ok => {
                if (!ok) return
                remove.mutate(campaignId, {
                  onSuccess: () => { toast.success(t('admin.migr_deleted')); onGone() },
                  onError:   err => toast.error(errorMessage(err, t('admin.migr_save_failed'))),
                })
              })}
            >
              <Trash2 size={16} /> {t('admin.migr_delete')}
            </Button>
          </div>
        )}
      </div>

      {campaign.error && <Callout variant="warning" t={t}>{campaign.error}</Callout>}

      <Card>
        <div className="flex flex-col gap-3 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={campaign.status === 'running' ? 'primary' : 'neutral'}>
              {t(`admin.migr_status_${campaign.status}`)}
            </Badge>
            <span className="text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
              {t('admin.migr_accounts_summary', {
                done:   tally.done,
                total:  tally.accounts,
                failed: tally.failed,
              })}
            </span>
            {campaign.since_date && (
              <span className="text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
                {t('admin.migr_since_summary', { date: campaign.since_date })}
              </span>
            )}
            {campaign.exclude_folders.length > 0 && (
              <span className="text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
                {t('admin.migr_excluded_summary', { folders: campaign.exclude_folders.join(', ') })}
              </span>
            )}
          </div>
          {/* The total is an estimate the module refines as it discovers
              folders, so the bar is honest about being approximate rather than
              claiming a precision it does not have. */}
          <ProgressBar value={progress} />
          <span className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
            {tally.total > 0
              ? t('admin.migr_items_progress', { copied: tally.copied, total: tally.total })
              : t('admin.migr_items_unknown', { copied: tally.copied })}
          </span>
        </div>
      </Card>

      <DataTable<MigrationAccount>
        t={t}
        rows={accounts}
        columns={columns}
        rowKey={r => r.id}
        pageSize={25}
        error={isError ? t('admin.migr_load_failed') : undefined}
        onRetry={() => void refetch()}
      />

      {confirmState && (
        <ConfirmDialog {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} />
      )}
    </div>
  )
}
