import { useTranslation } from 'react-i18next'
import { ArrowLeft, Ban, Check, LogOut, TriangleAlert, Trash2 } from 'lucide-react'
import { Button, Callout, Card, EmptyState, Spinner, useToast } from '@ui'
import ConfirmDialog from '@ui/ConfirmDialog'
import { useConfirm } from '../../hooks/useConfirm'
import { formatAgo, formatWhen } from '../sections/format'
import { PRIV } from '../../authz/types'
import { usePrivileges } from '../../authz/usePrivileges'
import { useDevice, useForgetDevice, useSetApproval, useSignOutDevice } from '../../devices/useDevices'
import { DeclaredSignals, DeviceFacts, DeviceTimeline, SessionList } from '../../devices/panels'
import { approvalLabel, approvalSkin, deviceName } from '../../devices/labels'

/**
 * One device: what was observed, what was declared, which sessions it holds,
 * and what has happened to it.
 *
 * The panels are shared with the personal screen ([`../../devices/panels`]) so
 * the two audiences literally cannot be shown different facts. Only the action
 * bar differs — an operator approves, blocks and forgets; a user renames and
 * disowns.
 */
export default function DeviceDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const { t, i18n } = useTranslation()
  const { can } = usePrivileges()
  const toast = useToast()
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm()

  const { data, isLoading, isError, refetch } = useDevice(id)
  const setApproval = useSetApproval()
  const signOut     = useSignOutDevice()
  const forget      = useForgetDevice()

  const canManage = can(PRIV.SESSIONS_DELETE)

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

  const device = data.device
  const skin = approvalSkin(device.approval)

  const apply = (approval: 'approved' | 'blocked' | 'pending') =>
    setApproval.mutate({ id, approval }, {
      onSuccess: () => toast.success(t(
        approval === 'blocked' ? 'devices.toast_blocked'
          : approval === 'approved' ? 'devices.toast_approved' : 'devices.toast_unblocked',
      )),
      onError: () => toast.error(t('devices.toast_failed')),
    })

  const doForget = async () => {
    const ok = await confirm({
      title:   t('devices.forget_title', { name: deviceName(t, device) }),
      message: t('devices.forget_message'),
      confirmLabel: t('devices.forget_confirm'),
      variant: 'danger',
    })
    if (!ok) return
    forget.mutate(id, {
      onSuccess: () => { toast.success(t('devices.toast_forgotten')); onBack() },
      onError:   () => toast.error(t('devices.toast_failed')),
    })
  }

  return (
    <div className="min-w-0">
      <div className="mb-4 flex min-w-0 flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" icon={<ArrowLeft size={15} />} onClick={onBack}>
          {t('devices.back')}
        </Button>
      </div>

      <div className="mb-4 flex min-w-0 flex-wrap items-start gap-x-3 gap-y-2">
        <h1 className="min-w-0 text-text-primary" style={{ fontSize: 'var(--kb-text-page)' }}>
          {deviceName(t, device)}
        </h1>
        <span className={`mt-1 inline-block rounded-full px-2 py-0.5 ${skin.chip}`}
          style={{ fontSize: 'var(--kb-text-micro)' }}>
          {approvalLabel(t, device.approval)}
        </span>
        <span className="mt-1 text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
          {device.user_label}
        </span>
      </div>

      {device.approval === 'blocked' && (
        <Callout variant="danger" className="mb-4" title={t('devices.blocked_title')}>
          {t('devices.blocked_body', {
            who:  device.approval_label ?? '—',
            when: device.approval_at ? formatWhen(device.approval_at, i18n.language) : '—',
          })}
          {device.approval_reason ? ` — ${device.approval_reason}` : ''}
        </Callout>
      )}

      {/* Mobile: a back button, the two or three verbs that matter, and the rest
          folded away — never a toolbar that wraps onto four lines. */}
      {canManage && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {device.approval !== 'approved' && (
            <Button variant="secondary" size="sm" icon={<Check size={14} />} onClick={() => apply('approved')}>
              {t('devices.approve')}
            </Button>
          )}
          {device.approval !== 'blocked' ? (
            <Button variant="secondary" size="sm" icon={<Ban size={14} />} onClick={() => apply('blocked')}>
              {t('devices.block')}
            </Button>
          ) : (
            <Button variant="secondary" size="sm" icon={<Check size={14} />} onClick={() => apply('pending')}>
              {t('devices.unblock')}
            </Button>
          )}
          <Button variant="secondary" size="sm" icon={<LogOut size={14} />}
            disabled={data.sessions.length === 0}
            onClick={() => signOut.mutate(id, {
              onSuccess: () => toast.success(t('devices.toast_signed_out')),
              onError:   () => toast.error(t('devices.toast_failed')),
            })}>
            {t('devices.sign_out')}
          </Button>
          <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => void doForget()}>
            {t('devices.forget')}
          </Button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title={t('devices.facts_title')} subtitle={t('devices.facts_subtitle')}>
          <DeviceFacts device={device} />
        </Card>

        <Card title={t('devices.declared_title')}>
          <DeclaredSignals device={device} />
        </Card>

        <Card title={t('devices.sessions_title', { n: data.sessions.length })} flush>
          <SessionList sessions={data.sessions} />
        </Card>

        <Card title={t('devices.timeline_title')}>
          <DeviceTimeline events={data.events} />
        </Card>
      </div>

      <p className="mt-4 text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
        {t('devices.first_seen_at', { when: formatWhen(device.first_seen_at, i18n.language) })}
        {' · '}
        {t('devices.last_seen_ago', { ago: formatAgo(device.last_seen_at) })}
      </p>

      {confirmState && (
        <ConfirmDialog {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} />
      )}
    </div>
  )
}
