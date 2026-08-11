import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ChevronDown, ChevronRight, LogOut, MonitorSmartphone, MoreVertical, Pencil, ShieldAlert,
  TriangleAlert,
} from 'lucide-react'
import {
  Button, Callout, Card, EmptyState, MenuDropdown, Spinner, useMenuDropdown, useToast,
  type MenuItem,
} from '@ui'
import ConfirmDialog from '@ui/ConfirmDialog'
import { useConfirm } from '../../hooks/useConfirm'
import { useAuthStore } from '../../store/authStore'
import {
  useDisownMyDevice, useMyDevices, useRenameMyDevice, useSignOutMyDevice,
} from '../../devices/useDevices'
import { DeclaredSignals, DeviceFacts, DeviceTimeline, SessionList } from '../../devices/panels'
import { approvalLabel, approvalSkin, deviceName } from '../../devices/labels'
import type { Device, DeviceSession } from '../../devices/types'
import { api } from '../../api/client'
import { useQuery } from '@tanstack/react-query'

/**
 * Settings ▸ Devices and sessions.
 *
 * ── Strict symmetry ──────────────────────────────────────────────────────────
 * The panels below are the SAME components the administration console renders
 * ({@link ../../devices/panels}), fed by the same server-side queries. A user
 * is shown neither less nor more than an operator sees of their own machines.
 * That is the reason to self-host, stated as a screen.
 *
 * ── "Ce n'est pas moi" ───────────────────────────────────────────────────────
 * One button with three immediate consequences: every session revoked
 * (including this one), a password change forced, an operator alerted. It is
 * deliberately not softened — a half-measure that spares the current session is
 * precisely the hole an attacker sitting in it would use.
 *
 * ── Mobile ───────────────────────────────────────────────────────────────────
 * One card per device, collapsed by default; the two actions that matter stay
 * visible and the detail unfolds on demand, rather than a table that has to
 * scroll sideways.
 */

/** Per-device timeline, fetched only when the card is unfolded. */
function useDeviceTimeline(id: string | null) {
  return useQuery({
    queryKey: ['my-device', id],
    enabled: !!id,
    queryFn: () => api
      .get<{ events: import('../../devices/types').DeviceEvent[] }>(`/me/devices/${id}`)
      .then(r => r.data.events),
  })
}

function DeviceCard({ device, sessions, current, onDisown }: {
  device:   Device
  sessions: DeviceSession[]
  current:  boolean
  onDisown: (device: Device) => void
}) {
  const { t } = useTranslation()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(device.label ?? '')

  const rename  = useRenameMyDevice()
  const signOut = useSignOutMyDevice()
  const menu    = useMenuDropdown()
  const { data: events } = useDeviceTimeline(open ? device.id : null)

  const skin = approvalSkin(device.approval)

  // The secondary verbs, offered as a sheet on a phone and inline above `sm`.
  const menuItems: MenuItem[] = [
    { type: 'action', label: t('devices.rename'), icon: <Pencil size={15} />,
      onClick: () => setEditing(true) },
    { type: 'action', label: open ? t('devices.hide_detail') : t('devices.show_detail'),
      icon: open ? <ChevronDown size={15} /> : <ChevronRight size={15} />,
      onClick: () => setOpen(o => !o) },
  ]

  const submitRename = () => {
    const label = draft.trim()
    rename.mutate({ id: device.id, label: label || null }, {
      onSuccess: () => { setEditing(false); toast.success(t('devices.toast_renamed')) },
      onError:   () => toast.error(t('devices.toast_failed')),
    })
  }

  return (
    <Card
      dense
      className="min-w-0"
      title={
        <span className="flex min-w-0 flex-wrap items-center gap-2">
          <span className={`h-2 w-2 shrink-0 rounded-full ${skin.dot}`} aria-hidden />
          <span className="min-w-0 break-words">{deviceName(t, device)}</span>
          {current && (
            <span className="rounded-full bg-primary-light px-1.5 py-0.5 text-primary"
              style={{ fontSize: 'var(--kb-text-micro)' }}>
              {t('devices.this_device')}
            </span>
          )}
          {device.approval !== 'pending' && (
            <span className={`rounded-full px-1.5 py-0.5 ${skin.chip}`}
              style={{ fontSize: 'var(--kb-text-micro)' }}>
              {approvalLabel(t, device.approval)}
            </span>
          )}
        </span>
      }
      subtitle={t('devices.card_subtitle', {
        count: sessions.length,
        where: device.last_country ?? t('devices.country_unknown'),
      })}
    >
      {editing ? (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submitRename() }}
            placeholder={t('devices.rename_ph')}
            aria-label={t('devices.rename')}
            className="h-9 min-w-0 flex-1 rounded-md border border-border bg-surface-0 px-2.5
                       text-text-primary focus:border-primary focus:outline-none"
            style={{ fontSize: 'var(--kb-text-meta)' }}
          />
          <Button variant="secondary" size="sm" onClick={submitRename}>{t('common.save')}</Button>
          <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>{t('common.cancel')}</Button>
        </div>
      ) : null}

      {/* Mobile hierarchy, deliberately: the TWO verbs that matter stay on one
          row and everything else moves into a "⋮" sheet. Four buttons wrapping
          onto a second line is the pattern this codebase has already decided
          against — a wrapped toolbar reads as four equally important actions
          and none of them is reachable with a thumb. */}
      <div className="mb-3 flex items-center gap-2">
        <Button variant="secondary" size="sm" icon={<LogOut size={14} />}
          disabled={sessions.length === 0}
          onClick={() => signOut.mutate(device.id, {
            onSuccess: () => toast.success(t('devices.toast_signed_out')),
            onError:   () => toast.error(t('devices.toast_failed')),
          })}>
          {t('devices.sign_out')}
        </Button>
        <Button variant="ghost" size="sm" icon={<ShieldAlert size={14} />} onClick={() => onDisown(device)}>
          {t('devices.not_me')}
        </Button>

        {/* From `sm` up there is room for all four, so nothing hides. */}
        <span className="ms-auto hidden items-center gap-2 sm:flex">
          {!editing && (
            <Button variant="ghost" size="sm" icon={<Pencil size={14} />} onClick={() => setEditing(true)}>
              {t('devices.rename')}
            </Button>
          )}
          <Button variant="ghost" size="sm"
            icon={open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            onClick={() => setOpen(o => !o)}>
            {open ? t('devices.hide_detail') : t('devices.show_detail')}
          </Button>
        </span>

        <span className="relative ms-auto sm:hidden">
          <button
            type="button"
            aria-label={t('devices.more_actions')}
            onClick={menu.open}
            className="rounded-md p-1.5 text-text-secondary transition-colors
                       hover:bg-surface-2 hover:text-text-primary
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <MoreVertical size={16} />
          </button>
          {menu.pos && (
            <MenuDropdown items={menuItems} pos={menu.pos} onClose={menu.close} minWidth={200} />
          )}
        </span>
      </div>

      {open && (
        <div className="grid gap-4 border-t border-border pt-3 lg:grid-cols-2">
          <div>
            <h4 className="mb-1 text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
              {t('devices.facts_title')}
            </h4>
            <DeviceFacts device={device} />
          </div>
          <div>
            <h4 className="mb-1 text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
              {t('devices.declared_title')}
            </h4>
            <DeclaredSignals device={device} />
          </div>
          <div className="lg:col-span-2">
            <h4 className="mb-1 text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
              {t('devices.timeline_title')}
            </h4>
            <DeviceTimeline events={events ?? []} />
          </div>
        </div>
      )}

      <div className="-mx-4 border-t border-border">
        <SessionList sessions={sessions} />
      </div>
    </Card>
  )
}

export function SessionsTab() {
  const { t } = useTranslation()
  const toast = useToast()
  const logout = useAuthStore(s => s.logout)
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm()

  const { data, isLoading, isError, refetch } = useMyDevices()
  const disown = useDisownMyDevice()

  const onDisown = async (device: Device) => {
    const ok = await confirm({
      title:   t('devices.not_me_title', { name: deviceName(t, device) }),
      message: t('devices.not_me_message'),
      confirmLabel: t('devices.not_me_confirm'),
      variant: 'danger',
    })
    if (!ok) return
    disown.mutate({ id: device.id }, {
      onSuccess: () => {
        toast.success(t('devices.toast_disowned'))
        // Every session is gone, including this one: staying on the page would
        // only show a wall of 401s.
        void logout()
      },
      onError: () => toast.error(t('devices.toast_failed')),
    })
  }

  if (isLoading) {
    return <div className="flex justify-center py-16"><Spinner /></div>
  }
  if (isError || !data) {
    return (
      <EmptyState
        icon={<TriangleAlert size={26} />}
        variant="error"
        title={t('devices.error')}
        action={{ label: t('devices.retry'), onClick: () => void refetch() }}
      />
    )
  }

  const orphans = data.sessions.filter(s => !s.device_id)

  return (
    <div className="min-w-0 max-w-3xl space-y-4">
      <Callout variant="info" title={t('devices.me_title')}>
        {t('devices.me_body')}
      </Callout>

      {data.devices.length === 0 ? (
        <EmptyState
          icon={<MonitorSmartphone size={26} />}
          variant="first-use"
          title={t('devices.me_empty_title')}
          description={t('devices.me_empty_body')}
        />
      ) : (
        data.devices.map(device => (
          <DeviceCard
            key={device.id}
            device={device}
            sessions={data.sessions.filter(s => s.device_id === device.id)}
            current={data.current_device_id === device.id}
            onDisown={onDisown}
          />
        ))
      )}

      {/* Sessions opened before the inventory existed, or by a client that
          cannot be correlated. Shown rather than hidden: a session nobody can
          attribute is exactly the one worth looking at. */}
      {orphans.length > 0 && (
        <Card dense title={t('devices.orphans_title')} subtitle={t('devices.orphans_body')} flush>
          <SessionList sessions={orphans} />
        </Card>
      )}

      {confirmState && (
        <ConfirmDialog {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} />
      )}
    </div>
  )
}
