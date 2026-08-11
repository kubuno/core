import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Ban, Check, LogOut, MonitorSmartphone, Search, SlidersHorizontal, Trash2, X,
} from 'lucide-react'
import {
  Button, Callout, Combobox, DataTable, EmptyState, Input, MobileSheet, useToast,
  type ComboboxOption, type DataTableColumn, type DataTableRowAction,
} from '@ui'
import ConfirmDialog from '@ui/ConfirmDialog'
import { useConfirm } from '../../hooks/useConfirm'
import { formatAgo, formatWhen } from '../sections/format'
import { PRIV } from '../../authz/types'
import { usePrivileges } from '../../authz/usePrivileges'
import type { AdminSectionProps } from '../sections/registry'
import { adminUrl } from '../adminAction'
import DeviceDetail from './DeviceDetail'
import {
  useDeviceFacets, useDevices, useForgetDevice, useSetApproval, useSignOutDevice,
} from '../../devices/useDevices'
import {
  approvalLabel, approvalSkin, deviceName, deviceTypeLabel, signalLevelLabel,
} from '../../devices/labels'
import { EMPTY_DEVICE_FILTERS, type Device, type DeviceFilters } from '../../devices/types'

/**
 * Devices ▸ Active sessions — the inventory.
 *
 * ── What it claims, and what it does not ─────────────────────────────────────
 * Every column here is OBSERVED: read off the requests the device actually
 * made. Nothing on this screen is a measurement of the machine itself, and the
 * two columns that could be mistaken for one — disk encryption, screen lock —
 * live on the device sheet under an explicit "declared by the device" banner
 * rather than in the table, precisely so a row cannot be skimmed as an audit.
 *
 * ── Four verbs, and one of them is misread by everybody ──────────────────────
 * Approve and block are statements about trust; block is the only one with
 * teeth (it closes the sessions and refuses the next refresh). Sign out closes
 * the sessions and nothing else. **Forget removes the inventory entry and
 * erases NOTHING on the device** — the confirmation says so in as many words,
 * because "forget my phone" reads as "wipe my phone" to most people, and
 * Kubuno will never ship the second one.
 *
 * ── Mobile ───────────────────────────────────────────────────────────────────
 * DataTable turns into cards from the container width; the five filter controls
 * collapse behind one button into a sheet rather than wrapping into a
 * four-line toolbar.
 */

function FilterControls({ filters, set, facets, stacked }: {
  filters: DeviceFilters
  set:     <K extends keyof DeviceFilters>(k: K, v: DeviceFilters[K]) => void
  facets:  { platforms: string[]; countries: string[]; device_types: string[] } | undefined
  stacked: boolean
}) {
  const { t } = useTranslation()

  const types: ComboboxOption[] = [
    { value: '', label: t('devices.filter_all_types') },
    ...(facets?.device_types ?? []).map(v => ({ value: v, label: deviceTypeLabel(t, v) })),
  ]
  const platforms: ComboboxOption[] = [
    { value: '', label: t('devices.filter_all_platforms') },
    ...(facets?.platforms ?? []).map(v => ({ value: v, label: v })),
  ]
  const approvals: ComboboxOption[] = [
    { value: '', label: t('devices.filter_all_approvals') },
    { value: 'pending', label: approvalLabel(t, 'pending') },
    { value: 'approved', label: approvalLabel(t, 'approved') },
    { value: 'blocked', label: approvalLabel(t, 'blocked') },
  ]
  const countries: ComboboxOption[] = [
    { value: '', label: t('devices.filter_all_countries') },
    ...(facets?.countries ?? []).map(v => ({ value: v, label: v })),
  ]
  const seen: ComboboxOption[] = [
    { value: '', label: t('devices.filter_any_time') },
    { value: '1', label: t('devices.filter_seen_1') },
    { value: '7', label: t('devices.filter_seen_7') },
    { value: '30', label: t('devices.filter_seen_30') },
    { value: '90', label: t('devices.filter_seen_90') },
  ]

  const field = stacked ? 'w-full' : ''

  return (
    <>
      <Combobox value={filters.device_type} onChange={v => set('device_type', v)} options={types}
        width={stacked ? undefined : 150} className={field} aria-label={t('devices.col_type')} />
      <Combobox value={filters.platform} onChange={v => set('platform', v)} options={platforms}
        width={stacked ? undefined : 160} className={field} aria-label={t('devices.col_platform')} />
      <Combobox value={filters.approval} onChange={v => set('approval', v)} options={approvals}
        width={stacked ? undefined : 160} className={field} aria-label={t('devices.col_approval')} />
      <Combobox value={filters.country} onChange={v => set('country', v)} options={countries}
        width={stacked ? undefined : 130} className={field} aria-label={t('devices.col_country')} />
      <Combobox value={filters.seen_days} onChange={v => set('seen_days', v)} options={seen}
        width={stacked ? undefined : 170} className={field} aria-label={t('devices.col_last_seen')} />
    </>
  )
}

export default function DevicesSection({ params, navigate }: AdminSectionProps) {
  const { t, i18n } = useTranslation()
  const { can } = usePrivileges()
  const toast = useToast()
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm()

  const [filters, setFilters] = useState<DeviceFilters>(() => ({
    ...EMPTY_DEVICE_FILTERS,
    q:        params.get('q') ?? '',
    approval: params.get('approval') ?? '',
    // Deep link from an account sheet: "the devices of this person".
    ...(params.get('user') ? {} : {}),
  }))
  const [draft, setDraft] = useState(() => params.get('q') ?? '')
  const [sheet, setSheet] = useState(false)

  const openId = params.get('device')
  const userId = params.get('user') ?? ''

  const canManage = can(PRIV.SESSIONS_DELETE)

  const query = useMemo(
    () => ({ ...filters, ...(userId ? { user_id: userId } : {}) }) as DeviceFilters,
    [filters, userId],
  )
  const { data, isLoading, isError, refetch } = useDevices(query, !openId)
  const { data: facets } = useDeviceFacets(!openId)
  const setApproval = useSetApproval()
  const signOut     = useSignOutDevice()
  const forget      = useForgetDevice()

  const set = <K extends keyof DeviceFilters>(key: K, value: DeviceFilters[K]) =>
    setFilters(f => ({ ...f, [key]: value }))

  if (openId) {
    return <DeviceDetail id={openId} onBack={() => navigate(adminUrl({ tab: 'device-sessions' }))} />
  }

  const rows = data?.devices ?? []
  const anyFilter = Object.values(filters).some(Boolean)

  const runApproval = (device: Device, approval: 'approved' | 'blocked' | 'pending') =>
    setApproval.mutate({ id: device.id, approval }, {
      onSuccess: () => toast.success(t(
        approval === 'blocked' ? 'devices.toast_blocked'
          : approval === 'approved' ? 'devices.toast_approved' : 'devices.toast_unblocked',
      )),
      onError: () => toast.error(t('devices.toast_failed')),
    })

  const runSignOut = (device: Device) => signOut.mutate(device.id, {
    onSuccess: () => toast.success(t('devices.toast_signed_out')),
    onError:   () => toast.error(t('devices.toast_failed')),
  })

  const runForget = async (device: Device) => {
    // The confirmation carries the whole point of the action: this is the
    // sentence that stops an operator believing they just wiped a phone.
    const ok = await confirm({
      title:   t('devices.forget_title', { name: deviceName(t, device) }),
      message: t('devices.forget_message'),
      confirmLabel: t('devices.forget_confirm'),
      variant: 'danger',
    })
    if (!ok) return
    forget.mutate(device.id, {
      onSuccess: () => toast.success(t('devices.toast_forgotten')),
      onError:   () => toast.error(t('devices.toast_failed')),
    })
  }

  const columns: DataTableColumn<Device>[] = [
    {
      id: 'device',
      header: t('devices.col_device'),
      primary: true,
      required: true,
      minWidth: 220,
      cell: (d) => (
        <div className="flex min-w-0 items-start gap-2">
          <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${approvalSkin(d.approval).dot}`} aria-hidden />
          <div className="min-w-0">
            <div className="line-clamp-2 whitespace-normal break-words text-text-primary">
              {deviceName(t, d)}
            </div>
            <div className="line-clamp-2 whitespace-normal break-words text-text-tertiary"
              style={{ fontSize: 'var(--kb-text-meta)' }}>
              {deviceTypeLabel(t, d.device_type)}
              {d.browser ? ` · ${d.browser}` : ''}
            </div>
          </div>
        </div>
      ),
      sortValue: (d) => deviceName(t, d),
    },
    {
      id: 'user',
      header: t('devices.col_account'),
      width: 170,
      cell: (d) => <span className="truncate text-text-secondary">{d.user_label ?? '—'}</span>,
      sortValue: (d) => d.user_label ?? '',
    },
    {
      id: 'platform',
      header: t('devices.col_platform'),
      width: 150,
      cell: (d) => (
        <span className="truncate text-text-secondary">
          {[d.platform, d.platform_version].filter(Boolean).join(' ') || '—'}
        </span>
      ),
      sortValue: (d) => d.platform ?? '',
    },
    {
      id: 'approval',
      header: t('devices.col_approval'),
      width: 120,
      cell: (d) => (
        <span className={`inline-block rounded-full px-1.5 py-0.5 ${approvalSkin(d.approval).chip}`}
          style={{ fontSize: 'var(--kb-text-micro)' }}>
          {approvalLabel(t, d.approval)}
        </span>
      ),
      sortValue: (d) => d.approval,
    },
    {
      id: 'signal',
      header: t('devices.col_signal'),
      width: 120,
      // "Observed" is the honest default and the overwhelming majority. Showing
      // the level in the list is what stops a reader assuming the platform
      // checked anything about the machine.
      cell: (d) => <span className="text-text-secondary">{signalLevelLabel(t, d.signal_level)}</span>,
      sortValue: (d) => d.signal_level,
    },
    {
      id: 'sessions',
      header: t('devices.col_sessions'),
      width: 80,
      align: 'right',
      cell: (d) => <span className="tabular-nums text-text-secondary">{d.active_sessions}</span>,
      sortValue: (d) => d.active_sessions,
    },
    {
      id: 'country',
      header: t('devices.col_country'),
      width: 90,
      cell: (d) => <span className="text-text-secondary">{d.last_country ?? '—'}</span>,
      sortValue: (d) => d.last_country ?? '',
    },
    {
      id: 'last_seen',
      header: t('devices.col_last_seen'),
      width: 150,
      cell: (d) => (
        <span className="whitespace-nowrap text-text-secondary" title={formatWhen(d.last_seen_at, i18n.language)}>
          {formatAgo(d.last_seen_at)}
        </span>
      ),
      sortValue: (d) => new Date(d.last_seen_at),
    },
  ]

  const rowActions: DataTableRowAction<Device>[] = canManage ? [
    {
      id: 'approve', label: t('devices.approve'), icon: <Check size={15} />,
      onClick: d => runApproval(d, 'approved'), hidden: d => d.approval === 'approved',
    },
    {
      id: 'block', label: t('devices.block'), icon: <Ban size={15} />,
      onClick: d => runApproval(d, 'blocked'), hidden: d => d.approval === 'blocked',
    },
    {
      id: 'unblock', label: t('devices.unblock'), icon: <Check size={15} />,
      onClick: d => runApproval(d, 'pending'), hidden: d => d.approval !== 'blocked',
    },
    {
      id: 'sign-out', label: t('devices.sign_out'), icon: <LogOut size={15} />,
      onClick: runSignOut, hidden: d => d.active_sessions === 0,
    },
    {
      id: 'forget', label: t('devices.forget'), icon: <Trash2 size={15} />,
      onClick: d => void runForget(d),
    },
  ] : []

  const toolbar = (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <form className="flex items-center" onSubmit={e => { e.preventDefault(); set('q', draft) }}>
        <Input value={draft} onChange={e => setDraft(e.target.value)}
          placeholder={t('devices.search_ph')} leftIcon={<Search size={15} />} className="w-52 pl-9" />
      </form>
      <div className="hidden flex-wrap items-center gap-2 sm:flex">
        <FilterControls filters={filters} set={set} facets={facets} stacked={false} />
      </div>
      <Button variant="secondary" size="sm" className="sm:hidden"
        icon={<SlidersHorizontal size={14} />} onClick={() => setSheet(true)}>
        {t('devices.filters')}
      </Button>
      {anyFilter && (
        <Button variant="ghost" size="sm" icon={<X size={14} />}
          onClick={() => { setFilters(EMPTY_DEVICE_FILTERS); setDraft('') }}>
          {t('devices.reset_filters')}
        </Button>
      )}
    </div>
  )

  return (
    <div className="min-w-0">
      <div className="mb-3 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
        <h1 className="min-w-0 text-text-primary" style={{ fontSize: 'var(--kb-text-page)' }}>
          {t('admin.nav_sessions')}
        </h1>
        {data && (
          <span className="text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
            {t('devices.count', { count: data.total })}
          </span>
        )}
        {userId && (
          <Button variant="ghost" size="sm" icon={<X size={14} />}
            onClick={() => navigate(adminUrl({ tab: 'device-sessions' }))}>
            {t('devices.clear_account_filter')}
          </Button>
        )}
      </div>

      {/* The honesty banner. It is the first thing on the page because it is
          the frame everything below has to be read in. */}
      <Callout variant="info" className="mb-4" title={t('devices.scope_title')}>
        {t('devices.scope_body')}
      </Callout>

      {data && !data.country_db_available && (
        <Callout variant="info" className="mb-4">{t('devices.no_country_db')}</Callout>
      )}

      <DataTable
        rows={rows}
        columns={columns}
        rowKey={r => r.id}
        loading={isLoading}
        error={isError ? t('devices.error') : undefined}
        onRetry={() => void refetch()}
        filtered={anyFilter}
        onClearFilters={() => { setFilters(EMPTY_DEVICE_FILTERS); setDraft('') }}
        toolbar={toolbar}
        rowActions={rowActions}
        onRowClick={r => navigate(adminUrl({ tab: 'device-sessions', params: { device: r.id } }))}
        configurableColumns
        pageSize={25}
        t={t}
        emptyState={
          <EmptyState
            icon={<MonitorSmartphone size={26} />}
            variant="first-use"
            title={t('devices.empty_title')}
            description={t('devices.empty_body')}
          />
        }
      />

      <MobileSheet open={sheet} onClose={() => setSheet(false)} title={t('devices.filters')}>
        <div className="flex flex-col gap-3 px-4 pb-2">
          <FilterControls filters={filters} set={set} facets={facets} stacked />
          <Button variant="secondary" onClick={() => setSheet(false)}>{t('devices.filters_apply')}</Button>
        </div>
      </MobileSheet>

      {confirmState && (
        <ConfirmDialog {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} />
      )}
    </div>
  )
}
