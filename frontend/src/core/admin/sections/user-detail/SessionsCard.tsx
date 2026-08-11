import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { LogOut, MonitorSmartphone, Smartphone, Terminal, Laptop } from 'lucide-react'
import { Button, Card, ConfirmDialog, DataTable, EmptyState, useToast, type DataTableColumn } from '@ui'
import { api } from '../../../api/client'
import { useConfirm } from '../../../hooks/useConfirm'
import type { Session, User } from '../../../types'
import { formatAgo, formatWhen } from '../format'

/** Glyph per device type reported at sign-in. */
const DEVICE_ICON: Record<string, typeof MonitorSmartphone> = {
  web:     MonitorSmartphone,
  mobile:  Smartphone,
  desktop: Laptop,
  api:     Terminal,
}

/**
 * Active sessions of one account, with unit and global revocation.
 *
 * Replaces the former `UserSessionsModal` of the users list: a modal could not
 * show the sessions next to the rest of the security posture, and the same list
 * had to be re-opened for every check. Same two routes, same audit trail.
 */
export default function SessionsCard({ user }: { user: User }) {
  const { t, i18n } = useTranslation()
  const qc = useQueryClient()
  const toast = useToast()
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-user-sessions', user.id],
    queryFn:  () => api.get<{ sessions: Session[] }>(`/admin/users/${user.id}/sessions`).then(r => r.data.sessions),
  })
  const sessions = data ?? []

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['admin-user-sessions', user.id] })
    void qc.invalidateQueries({ queryKey: ['admin-stats'] })
  }

  const revoke = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/users/${user.id}/sessions/${id}`),
    onSuccess: () => { invalidate(); toast.success(t('admin.ud_ses_revoked')) },
    onError:   () => toast.error(t('admin.ud_ses_revoke_error')),
  })

  const revokeAll = useMutation({
    mutationFn: () => api.delete<{ revoked: number }>(`/admin/users/${user.id}/sessions`).then(r => r.data),
    onSuccess: (res) => { invalidate(); toast.success(t('admin.ud_ses_revoked_all', { count: res?.revoked ?? 0 })) },
    onError:   () => toast.error(t('admin.ud_ses_revoke_error')),
  })

  const askRevoke = async (s: Session) => {
    const ok = await confirm({
      title:        t('admin.ud_ses_confirm_title'),
      message:      t('admin.ud_ses_confirm_msg', { device: s.device_name ?? t('settings.ses_unknown') }),
      confirmLabel: t('admin.ud_ses_revoke'),
      variant:      'danger',
    })
    if (ok) revoke.mutate(s.id)
  }

  const askRevokeAll = async () => {
    const ok = await confirm({
      title:        t('admin.ud_ses_confirm_all_title'),
      message:      t('admin.ud_ses_confirm_all_msg', { name: user.display_name || user.username }),
      confirmLabel: t('admin.ud_ses_revoke_all'),
      variant:      'danger',
    })
    if (ok) revokeAll.mutate()
  }

  const columns: DataTableColumn<Session>[] = [
    {
      id: 'device',
      header: t('admin.ud_ses_device'),
      headerText: t('admin.ud_ses_device'),
      primary: true,
      minWidth: 200,
      sortValue: s => s.device_name ?? '',
      cell: (s) => {
        const Icon = DEVICE_ICON[s.device_type ?? ''] ?? MonitorSmartphone
        return (
          <span className="flex items-center gap-2">
            <Icon size={15} className="shrink-0 text-text-tertiary" />
            <span className="min-w-0 truncate">{s.device_name ?? t('settings.ses_unknown')}</span>
          </span>
        )
      },
    },
    {
      id: 'ip',
      header: t('admin.ud_ses_ip'),
      headerText: t('admin.ud_ses_ip'),
      minWidth: 120,
      sortValue: s => s.ip_address ?? '',
      cell: s => <span className="font-mono text-text-secondary">{s.ip_address ?? '—'}</span>,
    },
    {
      id: 'last_used',
      header: t('admin.ud_ses_last_used'),
      headerText: t('admin.ud_ses_last_used'),
      minWidth: 160,
      sortValue: s => new Date(s.last_used_at),
      cell: s => (
        <span className="text-text-secondary" title={formatWhen(s.last_used_at, i18n.language)}>
          {formatAgo(s.last_used_at)}
        </span>
      ),
    },
    {
      id: 'created',
      header: t('admin.ud_ses_created'),
      headerText: t('admin.ud_ses_created'),
      minWidth: 160,
      defaultHidden: true,
      sortValue: s => new Date(s.created_at),
      cell: s => <span className="text-text-secondary">{formatWhen(s.created_at, i18n.language)}</span>,
    },
  ]

  return (
    <Card
      title={t('admin.ud_card_sessions')}
      icon={<MonitorSmartphone size={16} />}
      subtitle={t('admin.ud_sessions_desc')}
      actions={sessions.length > 0 && (
        <Button
          size="sm"
          variant="secondary"
          icon={<LogOut size={14} />}
          loading={revokeAll.isPending}
          onClick={() => void askRevokeAll()}
        >
          {t('admin.ud_ses_revoke_all')}
        </Button>
      )}
      flush
    >
      <DataTable
        t={t}
        rows={sessions}
        columns={columns}
        rowKey={s => s.id}
        loading={isLoading}
        skeletonRows={3}
        error={isError ? t('admin.ud_ses_error') : undefined}
        onRetry={() => void refetch()}
        pageSize={0}
        configurableColumns
        minTableWidth={520}
        className="p-3"
        rowActions={[{
          id:      'revoke',
          label:   t('admin.ud_ses_revoke'),
          icon:    <LogOut size={14} />,
          danger:  true,
          onClick: (s) => void askRevoke(s),
        }]}
        emptyState={(
          <EmptyState
            t={t}
            compact
            variant="first-use"
            icon={<MonitorSmartphone size={22} />}
            title={t('admin.ud_ses_empty')}
            description={t('admin.ud_ses_empty_desc')}
          />
        )}
      />

      {confirmState && (
        <ConfirmDialog {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} />
      )}
    </Card>
  )
}
