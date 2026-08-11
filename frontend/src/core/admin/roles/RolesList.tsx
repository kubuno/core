import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import {
  Building2, Globe2, Pencil, Plus, ShieldCheck, Trash2, UserCog, UserPlus,
} from 'lucide-react'
import { Button, Callout, DataTable, EmptyState, Input, useToast } from '@ui'
import ConfirmDialog from '@ui/ConfirmDialog'
import { useConfirm } from '../../hooks/useConfirm'
import { PRIV, type Privilege, type Role } from '../../authz/types'
import { useAuthzLabels } from '../../authz/labels'
import { usePrivileges } from '../../authz/usePrivileges'
import { adminUrl } from '../adminAction'
import { errorMessage, useDeleteRole } from './api'
import AssignRoleDialog from './AssignRoleDialog'
import RoleCreateDialog from './RoleCreateDialog'

/** Badge summarising what kind of role this is. */
function TypeBadge({ role }: { role: Role }) {
  const { t } = useTranslation()
  const [label, cls] = role.is_superuser
    ? [t('admin.role_type_superuser'), 'bg-danger-light text-danger']
    : role.is_system
      ? [t('admin.roles_system'), 'bg-surface-2 text-text-secondary']
      : [t('admin.role_type_custom'), 'bg-primary-light text-primary']
  return <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${cls}`}>{label}</span>
}

export function RoleIcon({ role, size = 16 }: { role: Role; size?: number }) {
  if (role.is_superuser) return <ShieldCheck size={size} className="text-danger shrink-0" />
  if (role.is_system) return <UserCog size={size} className="text-primary shrink-0" />
  return <UserCog size={size} className="text-text-secondary shrink-0" />
}

/** "Delegable to a unit" / "instance only" — the fact that drives the assignment. */
export function DelegabilityChip({ role }: { role: Role }) {
  const { t } = useTranslation()
  return role.ou_delegable ? (
    <span
      title={t('admin.role_delegable_desc')}
      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-success-light text-success whitespace-nowrap"
    >
      <Building2 size={11} />{t('admin.role_scope_ou')}
    </span>
  ) : (
    <span
      title={t('admin.assign_scope_ou_blocked_short')}
      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-surface-2 text-text-secondary whitespace-nowrap"
    >
      <Globe2 size={11} />{t('admin.role_scope_instance')}
    </span>
  )
}

export default function RolesList({
  roles, catalogue, loading, error, onRetry,
}: {
  roles:     Role[]
  catalogue: Privilege[]
  loading:   boolean
  error?:    string
  onRetry?:  () => void
}) {
  const { t } = useTranslation()
  const toast = useToast()
  const navigate = useNavigate()
  const { can, isSuperuser } = usePrivileges()
  const { roleName, roleDescription } = useAuthzLabels()
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm()

  const [q, setQ] = useState('')
  const [assign, setAssign] = useState<Role | null>(null)
  const [creating, setCreating] = useState(false)

  /** A role is edited on its sheet — the list only points at it. */
  const openRole = (role: Role) =>
    navigate(adminUrl({ tab: 'admin-roles', params: { role: role.id } }))

  // Granting needs `core.roles.manage`; *defining* a role is super-user only
  // (guard 1 server-side), so the create/edit/delete affordances follow that.
  const canGrant = can(PRIV.ROLES_MANAGE)

  const remove = useDeleteRole(() => toast.success(t('admin.role_deleted')))

  // Searched on what the operator can actually read: the displayed wording, plus
  // the slug, which is the same in every language.
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return roles
    return roles.filter(r =>
      `${roleName(r)} ${r.slug} ${roleDescription(r) ?? ''}`.toLowerCase().includes(needle))
  }, [roles, q, roleName, roleDescription])

  const askDelete = async (role: Role) => {
    const ok = await confirm({
      title:        t('admin.role_delete_title'),
      message:      t('admin.role_delete_confirm', { name: roleName(role), count: role.assignment_count }),
      confirmLabel: t('common.delete'),
      cancelLabel:  t('common.cancel'),
      variant:      'danger',
    })
    if (!ok) return
    remove.mutate(role.id, {
      onError: err => toast.error(errorMessage(err, t('admin.role_delete_error'))),
    })
  }

  return (
    <div className="space-y-4">
      {!canGrant && (
        <Callout variant="info" t={t}>{t('admin.roles_readonly')}</Callout>
      )}

      <DataTable<Role>
        rows={rows}
        rowKey={r => r.id}
        loading={loading}
        error={error}
        onRetry={onRetry}
        filtered={!!q.trim()}
        onClearFilters={() => setQ('')}
        title={t('admin.roles_title')}
        toolbar={
          <div className="flex items-center gap-3 flex-wrap">
            <Input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder={t('admin.roles_search_ph')}
              className="w-56"
            />
            {isSuperuser && (
              <Button size="sm" icon={<Plus size={15} />} onClick={() => setCreating(true)}>
                {t('admin.roles_create')}
              </Button>
            )}
          </div>
        }
        emptyState={
          <EmptyState
            variant="first-use"
            icon={<UserCog />}
            title={t('admin.roles_empty_title')}
            description={t('admin.roles_empty_desc')}
            action={isSuperuser ? { label: t('admin.roles_create'), onClick: () => setCreating(true) } : undefined}
            t={t}
          />
        }
        columns={[
          {
            id: 'name', header: t('admin.roles_col_role'), primary: true, required: true,
            sortValue: r => roleName(r),
            cell: r => (
              <Link to={adminUrl({ tab: 'admin-roles', params: { role: r.id } })} className="flex items-center gap-2 text-primary hover:underline">
                <RoleIcon role={r} />
                <span className="truncate">{roleName(r)}</span>
              </Link>
            ),
          },
          {
            id: 'description', header: t('admin.roles_col_desc'), minWidth: 220,
            cell: r => <span className="text-text-secondary">{roleDescription(r) ?? '—'}</span>,
          },
          { id: 'type', header: t('admin.roles_col_type'), sortValue: r => r.slug, cell: r => <TypeBadge role={r} /> },
          { id: 'scope', header: t('admin.roles_col_scope'), cell: r => <DelegabilityChip role={r} /> },
          {
            id: 'privileges', header: t('admin.roles_privileges'), align: 'right',
            sortValue: r => (r.is_superuser ? Number.MAX_SAFE_INTEGER : r.privileges.length),
            cell: r => (
              <span className="tabular-nums text-text-secondary">
                {r.is_superuser ? t('admin.roles_all_privileges_short') : r.privileges.length}
              </span>
            ),
          },
          {
            id: 'assignments', header: t('admin.roles_col_assignments'), align: 'right',
            sortValue: r => r.assignment_count,
            cell: r => <span className="tabular-nums text-text-secondary">{r.assignment_count}</span>,
          },
        ]}
        rowActions={[
          {
            id: 'assign', label: t('admin.assign_title'), icon: <UserPlus size={15} />,
            hidden: () => !canGrant,
            onClick: setAssign,
          },
          {
            id: 'edit', label: t('admin.role_edit'), icon: <Pencil size={15} />,
            hidden: () => !isSuperuser,
            // Opens the sheet: the role's name, description and privileges are
            // edited in the cards that show them, not in a form of their own.
            onClick: openRole,
          },
          {
            id: 'delete', label: t('common.delete'), icon: <Trash2 size={15} />, danger: true,
            hidden: r => !isSuperuser || r.is_system,
            onClick: askDelete,
          },
        ]}
        t={t}
      />

      {assign && <AssignRoleDialog role={assign} catalogue={catalogue} onClose={() => setAssign(null)} />}
      {creating && <RoleCreateDialog catalogue={catalogue} onClose={() => setCreating(false)} />}
      {confirmState && (
        <ConfirmDialog {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} />
      )}
    </div>
  )
}
