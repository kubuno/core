import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { NavigateFunction } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, MoreVertical, Power, UserX } from 'lucide-react'
import {
  Button, ConfirmDialog, DataTableSkeleton, EmptyState, MobileSheet, MobileSheetItem,
  Tabs, useIsMobile, useToast, type TabDef,
} from '@ui'
import { api } from '../../../api/client'
import { useConfirm } from '../../../hooks/useConfirm'
import type { User } from '../../../types'
import { confirmLeave } from '../../inline-edit/unsaved'
import { adminUrl, adminUrlWith } from '../../adminAction'
import { RoleBadge, StatusBadge, UserAvatar } from './atoms'
import ProfileTab from './ProfileTab'
import SecurityTab from './SecurityTab'
import ActivityTab from './ActivityTab'

type Pane = 'profile' | 'security' | 'activity'
const PANES: Pane[] = ['profile', 'security', 'activity']

/**
 * The account sheet — the screen an operator diagnoses from.
 *
 * Reached at `/admin/users?user=<id>` (and `&pane=security` to land
 * directly on a tab), which is what finally gives `GET /admin/users/:id` a
 * consumer. The pane lives in the URL so a sheet can be linked to, and so the
 * browser's Back button walks the tabs the way the user expects.
 *
 * Mobile is not the desktop layout narrowed: the header keeps the back arrow,
 * the identity and ONE action; everything else moves into a bottom sheet, and
 * the tables inside the tabs switch to cards on their own (DataTable follows
 * its container's width).
 *
 * There is no "Modifier" button here any more, and that is the design: the sheet
 * IS the editor. Each card of the profile tab turns into its own form (see
 * `cards/`), so every value the server accepts is changed where it is read
 * rather than in a window that offered a quarter of them. What remains in this
 * header is the one thing that is a verb and not a field — activation — kept
 * behind a confirmation.
 */
export default function UserDetailSection({
  userId, params, navigate,
}: {
  userId:   string
  params:   URLSearchParams
  navigate: NavigateFunction
}) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const toast = useToast()
  const mobile = useIsMobile()
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm()

  const [sheet, setSheet] = useState(false)

  const paneParam = params.get('pane') as Pane | null
  const pane: Pane = paneParam && PANES.includes(paneParam) ? paneParam : 'profile'

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-user', userId],
    queryFn:  () => api.get<{ user: User }>(`/admin/users/${userId}`).then(r => r.data.user),
  })

  // Replacement, not a new entry: flipping between the three panes of one sheet
  // is not three places the Back button should walk through.
  //
  // Both departures ask first when a card is mid-edit: the cards live in the
  // panes, so switching tab unmounts them exactly as leaving does, and a
  // half-typed field would vanish without a word.
  const setPane = async (next: Pane) => {
    if (!await confirmLeave(confirm, t)) return
    navigate(adminUrlWith('users', params, { pane: next }), { replace: true })
  }

  const back = async () => {
    if (!await confirmLeave(confirm, t)) return
    navigate(adminUrl({ tab: 'users' }))
  }

  const toggleActive = useMutation({
    mutationFn: (is_active: boolean) => api.patch(`/admin/users/${userId}`, { is_active }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-user', userId] })
      void qc.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success(t('admin.ud_status_saved'))
    },
    onError: () => toast.error(t('admin.update_error')),
  })

  const askToggleActive = async (user: User) => {
    const ok = await confirm({
      title: user.is_active ? t('admin.ud_disable_title') : t('admin.ud_enable_title'),
      message: user.is_active
        ? t('admin.ud_disable_msg', { name: user.display_name || user.username })
        : t('admin.ud_enable_msg', { name: user.display_name || user.username }),
      confirmLabel: user.is_active ? t('admin.disable') : t('admin.enable'),
      variant:      user.is_active ? 'danger' : 'default',
    })
    if (ok) toggleActive.mutate(!user.is_active)
  }

  // ── Chrome ────────────────────────────────────────────────────────────────
  const backLink = (
    <button
      type="button"
      onClick={() => void back()}
      className="-ml-1 flex items-center gap-1.5 rounded-md px-1 py-0.5 text-text-secondary transition-colors
                 hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      style={{ fontSize: 'var(--kb-text-body)' }}
    >
      <ArrowLeft size={16} />
      {t('admin.ud_back')}
    </button>
  )

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {backLink}
        <DataTableSkeleton t={t} columns={3} rows={6} />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col gap-4">
        {backLink}
        <EmptyState
          t={t}
          variant="error"
          icon={<UserX size={24} />}
          title={t('admin.ud_load_error')}
          description={t('admin.ud_load_error_desc')}
          action={{ label: t('ui.retry'), onClick: () => void refetch() }}
          secondaryAction={{ label: t('admin.ud_back'), onClick: () => void back() }}
        />
      </div>
    )
  }

  const user = data
  const tabs: TabDef<Pane>[] = [
    { id: 'profile',  label: t('admin.ud_tab_profile') },
    { id: 'security', label: t('admin.ud_tab_security') },
    { id: 'activity', label: t('admin.ud_tab_activity') },
  ]

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-col gap-3">
        {backLink}

        <div className="flex items-start gap-3">
          <UserAvatar user={user} size={mobile ? 36 : 44} />

          <div className="min-w-0 flex-1">
            <h1 className="truncate font-medium text-text-primary" style={{ fontSize: 'var(--kb-text-page)' }}>
              {user.display_name || user.username}
            </h1>
            <p className="truncate text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
              {user.email}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <RoleBadge role={user.role} label={t(`admin.role_${user.role}`, { defaultValue: user.role })} />
              <StatusBadge active={user.is_active} label={user.is_active ? t('admin.active') : t('admin.inactive')} />
            </div>
          </div>

          {/* Activation is the only header verb left — every field is edited in
              its own card below. Mobile folds it into the overflow sheet. */}
          <div className="flex shrink-0 items-center gap-2">
            {mobile ? (
              <button
                type="button"
                aria-haspopup="menu"
                aria-label={t('admin.ud_actions')}
                onClick={() => setSheet(true)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-text-secondary
                           transition-colors hover:bg-surface-2 hover:text-text-primary
                           focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <MoreVertical size={16} />
              </button>
            ) : (
              <Button
                size="sm"
                variant={user.is_active ? 'danger' : 'secondary'}
                icon={<Power size={14} />}
                loading={toggleActive.isPending}
                onClick={() => void askToggleActive(user)}
              >
                {user.is_active ? t('admin.disable') : t('admin.enable')}
              </Button>
            )}
          </div>
        </div>
      </div>

      <Tabs<Pane> t={t} tabs={tabs} value={pane} onChange={setPane} />

      {pane === 'profile'  && <ProfileTab  user={user} />}
      {pane === 'security' && <SecurityTab user={user} />}
      {pane === 'activity' && <ActivityTab user={user} />}

      <MobileSheet open={sheet} onClose={() => setSheet(false)} title={t('admin.ud_actions')}>
        <MobileSheetItem
          icon={<Power size={16} />}
          label={user.is_active ? t('admin.disable') : t('admin.enable')}
          danger={user.is_active}
          onClick={() => { setSheet(false); void askToggleActive(user) }}
        />
      </MobileSheet>

      {confirmState && (
        <ConfirmDialog {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} />
      )}
    </div>
  )
}
