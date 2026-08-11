// The domains this instance answers for.
//
// ## The status column is a button
//
// That is the one idea worth copying from the reference console, and the easiest
// to miss: a row is a pipeline — déclaré → vérifié → messagerie — and the status
// cell shows *the step that remains* as something you can press, not a grey
// badge you have to interpret. A domain nobody has proven says « Vérifier »; a
// proven one says what its mail records look like.
//
// ## What is deliberately absent
//
// No web redirection, no per-domain branding, no billing: those exist in the
// reference because it hosts websites and sells seats. Copying the shape of a
// page whose features this product does not have would be building controls that
// report back.

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Globe, Plus, ShieldCheck } from 'lucide-react'
import {
  Badge, Button, Callout, DataTable, EmptyState,
  type DataTableColumn, type DataTableRowAction,
} from '@ui'
import { usePrivileges } from '../../../authz/usePrivileges'
import type { AdminSectionProps } from '../registry'
import { adminUrl, adminUrlWith } from '../../adminAction'
import { DOMAINS_MANAGE } from './privileges'
import AddDomainDialog from './AddDomainDialog'
import DomainDetail from './DomainDetail'
import { errorMessage, useDomains, useVerifyDomain, type Domain } from './api'

function Figure({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="flex min-w-24 flex-col">
      <span className="text-text-primary" style={{ fontSize: 'var(--kb-text-section)' }}>{value}</span>
      <span className="text-text-secondary" style={{ fontSize: 'var(--kb-text-small)' }}>{label}</span>
    </div>
  )
}

export default function DomainsSection({ params, navigate }: AdminSectionProps) {
  const { t }   = useTranslation()
  const { can } = usePrivileges()
  const canManage = can(DOMAINS_MANAGE)
  const routerNavigate = useNavigate()

  const [adding, setAdding] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  const { data, isLoading, isError, refetch } = useDomains()
  const verify = useVerifyDomain()

  const selected = params.get('domain')
  const open = (id: string | null) => navigate(adminUrlWith('domains', params, { domain: id }))

  if (selected) {
    return <DomainDetail domainId={selected} canManage={canManage} onGone={() => open(null)} />
  }

  const domains = data?.domains ?? []
  const overview = data?.overview

  const columns: DataTableColumn<Domain>[] = [
    {
      id: 'name',
      header: t('admin.dom_col_domain'),
      primary: true,
      minWidth: 220,
      sortValue: r => r.name,
      cell: r => (
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-text-primary">{r.name}</span>
          {r.kind === 'alias' && (
            <span className="truncate text-text-tertiary" style={{ fontSize: 'var(--kb-text-small)' }}>
              {t('admin.dom_alias_of', { name: r.parent_name })}
            </span>
          )}
        </span>
      ),
    },
    {
      id: 'kind',
      header: t('admin.dom_col_kind'),
      sortValue: r => r.kind,
      cell: r => (
        r.kind === 'primary'
          ? <Badge variant="primary">{t('admin.dom_kind_primary')}</Badge>
          : <Badge variant="neutral">{t(`admin.dom_kind_${r.kind}`)}</Badge>
      ),
    },
    {
      id: 'status',
      header: t('admin.dom_col_status'),
      minWidth: 220,
      sortValue: r => (r.verified ? 1 : 0),
      // The pipeline, as a control: what remains to do is what you can press.
      cell: r => (
        r.verified
          ? (
            <span className="flex min-w-0 flex-col">
              <span className="flex items-center gap-1.5 text-text-primary">
                <ShieldCheck size={14} className="text-success" /> {t('admin.dom_verified')}
              </span>
              <span className="truncate text-text-tertiary" style={{ fontSize: 'var(--kb-text-small)' }}>
                {r.mx_hosts.length > 0
                  ? t('admin.dom_mail_mx_count', { count: r.mx_hosts.length })
                  : r.mail_checked_at ? t('admin.dom_mail_none') : t('admin.dom_mail_unchecked')}
              </span>
            </span>
          )
          : canManage
            ? (
              <Button
                variant="secondary"
                size="sm"
                disabled={verify.isPending}
                onClick={e => {
                  e.stopPropagation()
                  setError(null)
                  verify.mutate(r.id, { onError: err => setError(errorMessage(err, t('admin.dom_save_failed'))) })
                }}
              >
                {t('admin.dom_verify')}
              </Button>
            )
            : <span className="flex items-center gap-1.5 text-text-tertiary">
                <AlertTriangle size={14} /> {t('admin.dom_unverified')}
              </span>
      ),
    },
    {
      id: 'accounts',
      header: t('admin.dom_col_accounts'),
      align: 'right',
      sortValue: r => r.account_count,
      cell: r => (
        <span className={r.account_count === 0 ? 'text-text-tertiary' : 'text-text-secondary'}>
          {r.account_count || '—'}
        </span>
      ),
    },
  ]

  const rowActions: DataTableRowAction<Domain>[] = [
    { id: 'open', label: t('admin.dom_action_open'), onClick: r => open(r.id) },
  ]

  // The instance sends from an address whose domain nobody proved here: not an
  // error (a relay's domain is legitimate), but the one thing this page can
  // usefully point out about mail without pretending to run it.
  const fromMismatch =
    data?.from_domain && domains.length > 0 && !domains.some(d => d.name === data.from_domain && d.verified)

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="min-w-0">
        <h1 className="min-w-0 text-text-primary" style={{ fontSize: 'var(--kb-text-page)' }}>
          {t('admin.nav_domains')}
        </h1>
        <p className="mt-1 max-w-3xl text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>
          {t('admin.dom_intro')}
        </p>
      </div>

      {overview && (
        <div className="flex flex-wrap items-start gap-6 rounded border border-border bg-surface-1 px-4 py-3">
          <Figure value={overview.total}    label={t('admin.dom_stat_total')} />
          <Figure value={overview.verified} label={t('admin.dom_stat_verified')} />
          <Figure value={overview.pending}  label={t('admin.dom_stat_pending')} />
          <div className="ms-auto flex items-center gap-3">
            {overview.primary_name && (
              <span className="text-text-secondary" style={{ fontSize: 'var(--kb-text-small)' }}>
                {t('admin.dom_primary_is', { name: overview.primary_name })}
              </span>
            )}
            {canManage && (
              <Button variant="primary" onClick={() => setAdding(true)}>
                <Plus size={16} /> {t('admin.dom_add')}
              </Button>
            )}
          </div>
        </div>
      )}

      {fromMismatch && (
        <Callout variant="info" t={t}>
          {t('admin.dom_from_mismatch', { address: data?.from_address, domain: data?.from_domain })}
        </Callout>
      )}

      {error && <p className="text-danger" role="alert" style={{ fontSize: 'var(--kb-text-body)' }}>{error}</p>}

      <DataTable<Domain>
        t={t}
        rows={domains}
        columns={columns}
        rowKey={r => r.id}
        loading={isLoading}
        rowActions={rowActions}
        onRowClick={r => open(r.id)}
        pageSize={0}
        error={isError ? t('admin.dom_load_failed') : undefined}
        onRetry={() => void refetch()}
        emptyState={
          <EmptyState
            icon={<Globe size={26} />}
            title={t('admin.dom_empty_title')}
            description={t('admin.dom_empty_desc')}
            action={canManage ? { label: t('admin.dom_add'), onClick: () => setAdding(true), variant: 'primary' } : undefined}
            t={t}
          />
        }
      />

      {adding && (
        <AddDomainDialog
          domains={domains}
          onClose={() => setAdding(false)}
          // Straight to the proof: a domain that was just declared is a domain
          // nobody has verified, and that is the only thing left to do with it.
          onAdded={d => routerNavigate(adminUrl({ tab: 'domains', params: { domain: d.id } }))}
        />
      )}
    </div>
  )
}
