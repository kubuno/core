import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe2, Search, X } from 'lucide-react'
import {
  Button, Callout, Combobox, DataTable, EmptyState, Input, useToast,
  type ComboboxOption, type DataTableColumn,
} from '@ui'
import { formatAgo, formatWhen } from '../sections/format'
import type { AdminSectionProps } from '../sections/registry'
import { useAdminSessions } from '../../devices/useDevices'
import { authStrengthLabel, clientKindLabel, sessionName } from '../../devices/labels'
import { EMPTY_SESSION_FILTERS, type DeviceSession, type SessionFilters } from '../../devices/types'

/**
 * Devices ▸ Networks — every live session of the instance, and where it comes
 * from.
 *
 * ── Why this page did not exist ──────────────────────────────────────────────
 * Until now the only way to answer "who is signed in right now" was to open
 * each account in turn. A question that costs one click per user is a question
 * nobody asks, which is why an instance could carry a forgotten session for a
 * year without anyone noticing.
 *
 * ── The 2FA filter earns its place ───────────────────────────────────────────
 * "Sessions that never passed a second factor" is the one query an operator
 * runs after tightening the policy, and the tri-state rule applies to it too:
 * a session whose strength is unknown counts as NOT having passed 2FA. The
 * server does that narrowing, not this component.
 */
export default function NetworksSection({ params }: AdminSectionProps) {
  const { t, i18n } = useTranslation()
  const toast = useToast()

  const [filters, setFilters] = useState<SessionFilters>(() => ({
    ...EMPTY_SESSION_FILTERS,
    q: params.get('q') ?? '',
  }))
  const [draft, setDraft] = useState(() => params.get('q') ?? '')

  const { data, isLoading, isError, refetch } = useAdminSessions(filters)
  const set = <K extends keyof SessionFilters>(key: K, value: SessionFilters[K]) =>
    setFilters(f => ({ ...f, [key]: value }))

  const rows = data?.sessions ?? []
  const anyFilter = Object.values(filters).some(Boolean)

  /** Distinct origins present, so "where do people connect from" is one glance. */
  const origins = useMemo(() => {
    const counts = new Map<string, number>()
    for (const session of rows) {
      const key = session.country ?? ''
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [rows])

  const clients: ComboboxOption[] = [
    { value: '', label: t('devices.filter_all_clients') },
    { value: 'web', label: clientKindLabel(t, 'web') },
    { value: 'native', label: clientKindLabel(t, 'native') },
    { value: 'desktop', label: clientKindLabel(t, 'desktop') },
    { value: 'api', label: clientKindLabel(t, 'api') },
  ]
  const twoFactor: ComboboxOption[] = [
    { value: '', label: t('devices.filter_all_sessions') },
    { value: 'true', label: t('devices.filter_without_2fa') },
  ]

  const columns: DataTableColumn<DeviceSession>[] = [
    {
      id: 'account',
      header: t('devices.col_account'),
      primary: true,
      required: true,
      minWidth: 180,
      cell: (s) => (
        <div className="min-w-0">
          <div className="truncate text-text-primary">{s.user_label ?? '—'}</div>
          <div className="truncate text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
            {sessionName(t, s)}
          </div>
        </div>
      ),
      sortValue: (s) => s.user_label ?? '',
    },
    {
      id: 'ip',
      header: t('devices.field_last_ip'),
      width: 160,
      cell: (s) => <span className="truncate text-text-secondary">{s.ip_address ?? '—'}</span>,
      sortValue: (s) => s.ip_address ?? '',
    },
    {
      id: 'country',
      header: t('devices.col_country'),
      width: 90,
      cell: (s) => <span className="text-text-secondary">{s.country ?? '—'}</span>,
      sortValue: (s) => s.country ?? '',
    },
    {
      id: 'client',
      header: t('devices.field_client'),
      width: 120,
      cell: (s) => <span className="text-text-secondary">{clientKindLabel(t, s.client_type)}</span>,
      sortValue: (s) => s.client_type ?? '',
    },
    {
      id: 'auth',
      header: t('devices.col_auth'),
      width: 150,
      cell: (s) => <span className="text-text-secondary">{authStrengthLabel(t, s.auth_strength)}</span>,
      sortValue: (s) => s.auth_strength ?? '',
    },
    {
      id: 'last_used',
      header: t('devices.col_last_seen'),
      width: 150,
      cell: (s) => (
        <span className="whitespace-nowrap text-text-secondary" title={formatWhen(s.last_used_at, i18n.language)}>
          {formatAgo(s.last_used_at)}
        </span>
      ),
      sortValue: (s) => new Date(s.last_used_at),
    },
  ]

  const toolbar = (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <form className="flex items-center" onSubmit={e => { e.preventDefault(); set('q', draft) }}>
        <Input value={draft} onChange={e => setDraft(e.target.value)}
          placeholder={t('devices.sessions_search_ph')} leftIcon={<Search size={15} />} className="w-52 pl-9" />
      </form>
      <Combobox value={filters.client_type} onChange={v => set('client_type', v)} options={clients}
        width={150} aria-label={t('devices.field_client')} />
      <Combobox value={filters.without_2fa} onChange={v => set('without_2fa', v)} options={twoFactor}
        width={220} aria-label={t('devices.col_auth')} />
      {anyFilter && (
        <Button variant="ghost" size="sm" icon={<X size={14} />}
          onClick={() => { setFilters(EMPTY_SESSION_FILTERS); setDraft('') }}>
          {t('devices.reset_filters')}
        </Button>
      )}
    </div>
  )

  return (
    <div className="min-w-0">
      <div className="mb-3 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
        <h1 className="min-w-0 text-text-primary" style={{ fontSize: 'var(--kb-text-page)' }}>
          {t('admin.nav_networks')}
        </h1>
        {data && (
          <span className="text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
            {t('devices.sessions_count', { count: data.total })}
          </span>
        )}
      </div>

      <Callout variant="info" className="mb-4">{t('devices.networks_intro')}</Callout>

      {origins.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-1.5">
          {origins.map(([code, count]) => (
            <button key={code || 'unknown'} type="button"
              onClick={() => set('country', code)}
              className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-0.5
                         text-text-secondary hover:text-text-primary
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              style={{ fontSize: 'var(--kb-text-meta)' }}>
              {code || t('devices.country_unknown')}
              <span className="tabular-nums text-text-tertiary">{count}</span>
            </button>
          ))}
        </div>
      )}

      <DataTable
        rows={rows}
        columns={columns}
        rowKey={r => r.id}
        loading={isLoading}
        error={isError ? t('devices.error') : undefined}
        onRetry={() => void refetch()}
        filtered={anyFilter}
        onClearFilters={() => { setFilters(EMPTY_SESSION_FILTERS); setDraft('') }}
        toolbar={toolbar}
        configurableColumns
        pageSize={25}
        t={t}
        emptyState={
          <EmptyState
            icon={<Globe2 size={26} />}
            variant="first-use"
            title={t('devices.sessions_empty_title')}
            description={t('devices.sessions_empty_body')}
            action={{
              label: t('devices.retry'),
              variant: 'secondary',
              onClick: () => {
                void refetch()
                toast.success(t('devices.sessions_refreshed'))
              },
            }}
          />
        }
      />
    </div>
  )
}
