import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { NavigateFunction } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { UserX } from 'lucide-react'
import {
  ConfirmDialog, DataTableSkeleton, EmptyState, Tabs, useIsMobile, useToast, type TabDef,
} from '@ui'
import { api } from '../../../api/client'
import { useConfirm } from '../../../hooks/useConfirm'
import type { User } from '../../../types'
import { confirmLeave } from '../../inline-edit/unsaved'
import { adminUrl, adminUrlWith } from '../../adminAction'
import { useAdminCrumbs } from '../../AdminBreadcrumb'
import { IdentityCard } from './IdentityCard'
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
 * Mobile is not the desktop layout narrowed: the identity card stops being a
 * sticky column and simply stacks above the tabs, carrying the same actions, and
 * the tables inside the tabs switch to cards on their own (DataTable follows its
 * container's width).
 *
 * There is no "Modifier" button here any more, and that is the design: the sheet
 * IS the editor. Each card of the profile tab turns into its own form (see
 * `cards/`), so every value the server accepts is changed where it is read
 * rather than in a window that offered a quarter of them. What lives on the
 * identity card instead are the VERBS that act on the account itself, each kept
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
  // No hand-made "back" button: the console's own breadcrumb is the way up, and
  // this sheet simply appends itself to it — "Annuaire › Utilisateurs › <nom>".
  // Two stacked navigations saying the same thing is one too many, and the
  // second was the one nobody else's detail page had.
  useAdminCrumbs(useMemo(
    () => (data ? [{ label: data.display_name || data.username, title: data.display_name || data.username }] : []),
    [data],
  ))

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <DataTableSkeleton t={t} columns={3} rows={6} />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col gap-4">
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
      {/* Identity on the left, properties on the right. The card carries the
          verbs that act on the ACCOUNT; the tabs show and edit its fields. It
          stays put while they scroll, so the name of who is being changed is
          never off screen. */}
      <div className={mobile ? 'flex flex-col gap-4' : 'flex items-start gap-4'}>
        <IdentityCard
          user={user}
          mobile={mobile}
          busy={toggleActive.isPending}
          onToggleActive={() => void askToggleActive(user)}
          goPane={setPane}
        />

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <Tabs<Pane> t={t} tabs={tabs} value={pane} onChange={setPane} />

          {pane === 'profile'  && <ProfileTab  user={user} />}
          {pane === 'security' && <SecurityTab user={user} />}
          {pane === 'activity' && <ActivityTab user={user} />}
        </div>
      </div>

      {confirmState && (
        <ConfirmDialog {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} />
      )}
    </div>
  )
}
