import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Power, KeyRound, Building2 } from 'lucide-react'
import { api } from '../../../api/client'
import { useAuthStore } from '../../../store/authStore'
import type { OrgUnit, User } from '../../../types'
import { PRIV } from '../../../authz/types'
import { usePrivileges } from '../../../authz/usePrivileges'
import { RoleBadge, StatusBadge, UserAvatar } from './atoms'
import { formatAgo, formatDay } from '../format'

interface Props {
  user: User
  /** Sticky on a wide screen; stacked above the tabs on a narrow one. */
  mobile:   boolean
  busy:     boolean
  onToggleActive: () => void
  /** Opens one of the sheet's tabs — the actions that already have a card there
   *  send the operator to it rather than growing a second way to do the job. */
  goPane:   (pane: 'profile' | 'security') => void
}

/** One row of the action list. Disabled rows say WHY in a tooltip: greying a
 *  control without explaining it leaves the operator guessing whether the
 *  console is broken or the rule is deliberate. */
function Action({
  icon, label, onClick, danger, disabled, reason,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  danger?:   boolean
  disabled?: boolean
  reason?:   string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={disabled ? reason : undefined}
      className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors
        ${disabled
          ? 'cursor-not-allowed text-text-tertiary'
          : danger
            ? 'text-danger hover:bg-danger-light'
            : 'text-text-primary hover:bg-surface-2'}`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  )
}

/**
 * The account's identity card — context on the left, verbs underneath.
 *
 * It stays put while the tabs scroll: the tabs show and edit PROPERTIES, this
 * card answers "who am I acting on?" and carries the actions that have side
 * effects on the account itself. Keeping the two apart is what stops an operator
 * from editing one account while reading another's name.
 */
export function IdentityCard({ user, mobile, busy, onToggleActive, goPane }: Props) {
  const { t } = useTranslation()
  const { can } = usePrivileges()
  const me = useAuthStore(s => s.user)
  const isSelf = me?.id === user.id

  // Shared react-query key: the units are already in cache from the accounts
  // list, so naming the unit costs no extra request.
  const { data: units } = useQuery({
    queryKey: ['admin-org-units'],
    queryFn:  () => api.get<{ org_units: OrgUnit[] }>('/admin/org-units').then(r => r.data.org_units),
    enabled:  can(PRIV.ORG_UNITS_READ),
    staleTime: 30_000,
  })
  const unitName = units?.find(u => u.id === user.org_unit_id)?.name

  const meta = (label: string, value: string) => (
    <div className="flex flex-col">
      <span className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>{label}</span>
      <span className="text-text-primary" style={{ fontSize: 'var(--kb-text-meta)' }}>{value}</span>
    </div>
  )

  return (
    <aside
      className={`rounded-xl border border-border bg-white ${
        mobile
          ? 'w-full'
          // Same 52px as the accounts panel: the console's breadcrumb bar is
          // sticky at the top of this scrolling area and would clip the card.
          : 'sticky top-[52px] self-start shrink-0 w-[300px]'}`}
    >
      <div className="flex flex-col gap-3 p-4">
        <div>
          <RoleBadge role={user.role} label={t(`admin.role_${user.role}`, { defaultValue: user.role })} />
        </div>

        <div className="flex items-start gap-3">
          <UserAvatar user={user} size={44} />
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-medium text-text-primary" style={{ fontSize: 'var(--kb-text-page)' }}>
              {user.display_name || user.username}
            </h1>
            <p className="truncate text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
              {user.email}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div>
            <StatusBadge active={user.is_active} label={user.is_active ? t('admin.active') : t('admin.inactive')} />
          </div>
          {meta(t('admin.ud_last_login'), user.last_login_at ? formatAgo(user.last_login_at) : '—')}
          {meta(t('admin.ud_created'), formatDay(user.created_at, navigator.language))}
        </div>
      </div>

      {unitName && (
        <div className="border-t border-border px-4 py-3">
          <span className="block text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
            {t('admin.ud_org_unit')}
          </span>
          <span className="font-medium text-text-primary" style={{ fontSize: 'var(--kb-text-meta)' }}>
            {unitName}
          </span>
        </div>
      )}

      <div className="border-t border-border py-1">
        {can(PRIV.USER_PASSWORD) && (
          <Action
            icon={<KeyRound size={15} />}
            label={t('admin.act_reset_password')}
            onClick={() => goPane('security')}
          />
        )}
        {can(PRIV.ORG_UNITS_READ) && (
          <Action
            icon={<Building2 size={15} />}
            label={t('admin.bulk_ou_action')}
            onClick={() => goPane('profile')}
          />
        )}
        {can(PRIV.USERS_UPDATE) && (
          <Action
            icon={<Power size={15} />}
            label={user.is_active ? t('admin.disable') : t('admin.enable')}
            danger={user.is_active}
            onClick={onToggleActive}
            // An operator must not be able to lock themselves out in one click.
            // The server refuses it too; saying so here is what turns a dead
            // control into an understood rule.
            disabled={isSelf || busy}
            reason={isSelf ? t('admin.ud_self_action_blocked') : undefined}
          />
        )}
      </div>
    </aside>
  )
}
