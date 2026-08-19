// Bringing an organisation's data in from another provider.
//
// ## What this page can honestly promise
//
// The core never copies anything: it may only write its own schema, and a
// mailbox belongs to the mail module's. So a campaign here is a *plan* — the
// source, the mapping, the range — and the copying is done by the module that
// owns the destination, chunk by chunk, with the position saved after each one.
//
// That is why the page offers only the services whose module is actually
// registered, and why a service whose module is missing is shown as unavailable
// rather than hidden: an operator looking for something this instance cannot do
// deserves the reason, not an empty menu.
//
// ## What is deliberately absent
//
// No calendar and no contacts yet — not because the orchestration could not
// carry them, but because neither module can currently read a remote source,
// and a service in this list that produced nothing would be exactly the kind of
// button this project refuses to ship.

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, CheckCircle2, Loader2, Plus, ServerCog } from 'lucide-react'
import {
  Badge, Button, Callout, DataTable, EmptyState,
  type DataTableColumn, type DataTableRowAction,
} from '@ui'
import { usePrivileges } from '../../../authz/usePrivileges'
import type { AdminSectionProps } from '../registry'
import { adminUrlWith } from '../../adminAction'
import { DATA_MIGRATION_MANAGE } from './privileges'
import CampaignWizard from './CampaignWizard'
import CampaignDetail from './CampaignDetail'
import { useCampaigns, type Campaign } from './api'

export default function DataMigrationSection({ params, navigate }: AdminSectionProps) {
  const { t }   = useTranslation()
  const { can } = usePrivileges()
  const canManage = can(DATA_MIGRATION_MANAGE)

  const [composing, setComposing] = useState(false)

  const { data, isLoading, isError, refetch } = useCampaigns()

  const selected = params.get('campaign')
  const open = (id: string | null) =>
    navigate(adminUrlWith('data-migration', params, { campaign: id }))

  if (selected) {
    return <CampaignDetail campaignId={selected} canManage={canManage} onGone={() => open(null)} />
  }

  const campaigns = data?.campaigns ?? []
  const services  = data?.services ?? []
  const noService = services.length > 0 && services.every(s => !s.available)

  const columns: DataTableColumn<Campaign>[] = [
    {
      id: 'name',
      header: t('admin.migr_col_campaign'),
      primary: true,
      minWidth: 220,
      sortValue: r => r.name,
      cell: r => (
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-text-primary">{r.name}</span>
          <span className="truncate text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
            {r.source_host}
          </span>
        </span>
      ),
    },
    {
      id: 'service',
      header: t('admin.migr_col_service'),
      sortValue: r => r.service,
      cell: r => <Badge variant="neutral">{t(`admin.migr_service_${r.service}`)}</Badge>,
    },
    {
      id: 'accounts',
      header: t('admin.migr_col_accounts'),
      minWidth: 200,
      sortValue: r => r.tally.done,
      cell: r => (
        <span className="flex min-w-0 flex-col">
          <span className="text-text-primary">
            {t('admin.migr_accounts_done', { done: r.tally.done, total: r.tally.accounts })}
          </span>
          {r.tally.failed > 0 && (
            <span className="flex items-center gap-1.5 text-danger" style={{ fontSize: 'var(--kb-text-meta)' }}>
              <AlertTriangle size={12} /> {t('admin.migr_accounts_failed', { count: r.tally.failed })}
            </span>
          )}
        </span>
      ),
    },
    {
      id: 'items',
      header: t('admin.migr_col_items'),
      align: 'right',
      sortValue: r => r.tally.copied,
      cell: r => <span className="text-text-secondary">{r.tally.copied || '—'}</span>,
    },
    {
      id: 'status',
      header: t('admin.migr_col_status'),
      minWidth: 160,
      sortValue: r => r.status,
      cell: r => (
        r.status === 'running'
          ? (
            <span className="flex items-center gap-1.5 text-primary">
              <Loader2 size={14} className="animate-spin" /> {t('admin.migr_status_running')}
            </span>
          )
          : r.status === 'done'
            ? (
              <span className="flex items-center gap-1.5 text-success">
                <CheckCircle2 size={14} /> {t('admin.migr_status_done')}
              </span>
            )
            : (
              <span className="text-text-secondary">{t(`admin.migr_status_${r.status}`)}</span>
            )
      ),
    },
  ]

  const rowActions: DataTableRowAction<Campaign>[] = [
    { id: 'open', label: t('admin.migr_action_open'), onClick: r => open(r.id) },
  ]

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="min-w-0 text-text-primary" style={{ fontSize: 'var(--kb-text-page)' }}>
            {t('admin.nav_data_migration')}
          </h1>
          <p className="mt-1 max-w-3xl text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>
            {t('admin.migr_intro')}
          </p>
        </div>
        {canManage && (
          <Button variant="primary" disabled={noService} onClick={() => setComposing(true)}>
            <Plus size={16} /> {t('admin.migr_new')}
          </Button>
        )}
      </div>

      {noService && <Callout variant="warning" t={t}>{t('admin.migr_no_service')}</Callout>}

      <DataTable<Campaign>
        t={t}
        rows={campaigns}
        columns={columns}
        rowKey={r => r.id}
        loading={isLoading}
        rowActions={rowActions}
        onRowClick={r => open(r.id)}
        pageSize={0}
        error={isError ? t('admin.migr_load_failed') : undefined}
        onRetry={() => void refetch()}
        emptyState={
          <EmptyState
            icon={<ServerCog size={26} />}
            title={t('admin.migr_empty_title')}
            description={t('admin.migr_empty_desc')}
            action={canManage && !noService
              ? { label: t('admin.migr_new'), onClick: () => setComposing(true), variant: 'primary' }
              : undefined}
            t={t}
          />
        }
      />

      {composing && (
        <CampaignWizard
          services={services}
          onClose={() => setComposing(false)}
          // Straight to the sheet: a campaign that was just composed is a
          // campaign whose accounts one wants to watch.
          onCreated={c => { setComposing(false); open(c.id) }}
        />
      )}
    </div>
  )
}
