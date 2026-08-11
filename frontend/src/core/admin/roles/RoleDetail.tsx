import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Building2, Clock, Globe2, Trash2, UserPlus, Users } from 'lucide-react'
import { Button, Card, DataTable, EmptyState, useToast } from '@ui'
import ConfirmDialog from '@ui/ConfirmDialog'
import { format } from 'date-fns'
import { getDateLocale } from '../../i18n/dateLocale'
import { useConfirm } from '../../hooks/useConfirm'
import { PRIV, type Privilege, type Role, type RoleAssignment } from '../../authz/types'
import { useAuthzLabels } from '../../authz/labels'
import { usePrivileges } from '../../authz/usePrivileges'
import { useAdminCrumbs } from '../AdminBreadcrumb'
import { errorMessage, useAssignments, useDeleteAssignment } from './api'
import AssignRoleDialog from './AssignRoleDialog'
import RoleIdentityCard from './RoleIdentityCard'
import RolePrivilegesCard from './RolePrivilegesCard'

/**
 * One role's sheet: what it grants, and who currently holds it over what.
 *
 * "Modifier le rôle" used to open the creation form as a window over this sheet
 * — the same name, the same description and the same privilege list the sheet
 * was already showing, in a second markup that was one change away from
 * disagreeing with the first. Both are now edited in the card that displays
 * them; `RoleEditorDialog` has become `RoleCreateDialog`, which is all it should
 * ever have been.
 */
export default function RoleDetail({
  role, catalogue,
}: {
  role:      Role
  catalogue: Privilege[]
}) {
  const { t, i18n } = useTranslation()
  const toast = useToast()
  const { can, isSuperuser } = usePrivileges()
  const { roleName } = useAuthzLabels()
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm()
  const [assignOpen, setAssignOpen] = useState(false)

  const canGrant = can(PRIV.ROLES_MANAGE)
  const { data: assignments, isLoading } = useAssignments({ role_id: role.id })
  const revoke = useDeleteAssignment(() => toast.success(t('admin.assign_revoked')))

  const when = (iso: string) => format(new Date(iso), 'PP', { locale: getDateLocale(i18n.language) })

  const askRevoke = async (row: RoleAssignment) => {
    const ok = await confirm({
      title:        t('admin.assign_revoke_title'),
      message:      t('admin.assign_revoke_confirm', { subject: row.subject_label ?? '—', role: roleName(role) }),
      confirmLabel: t('admin.assign_revoke'),
      cancelLabel:  t('common.cancel'),
      variant:      'danger',
    })
    if (!ok) return
    revoke.mutate(row.id, { onError: err => toast.error(errorMessage(err, t('admin.assign_revoke_error'))) })
  }

  // The trail is painted once, by the console, from ADMIN_NAV; this sheet only
  // says what to append. Before, it drew its own two segments — the only page
  // that did, and the one that would have drifted from the shared one.
  useAdminCrumbs(useMemo(() => [{ label: roleName(role), title: roleName(role) }], [role]))

  return (
    <div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(240px,320px)_1fr] gap-4 items-start">
        {/* ── Identity ─────────────────────────────────────────────── */}
        <RoleIdentityCard
          role={role}
          canEdit={isSuperuser}
          actions={canGrant ? (
            <Button size="sm" variant="ghost" icon={<UserPlus size={15} />} onClick={() => setAssignOpen(true)}>
              {t('admin.assign_title')}
            </Button>
          ) : undefined}
        />

        <div className="space-y-4">
          {/* ── Assignments ────────────────────────────────────────── */}
          <Card title={t('admin.role_assignments')} icon={<Users size={18} className="text-text-tertiary" />} flush>
            <DataTable<RoleAssignment>
              rows={assignments ?? []}
              rowKey={a => a.id}
              loading={isLoading}
              pageSize={10}
              emptyState={
                <EmptyState
                  variant="first-use"
                  icon={<UserPlus />}
                  title={t('admin.assign_empty_title')}
                  description={t('admin.assign_empty_desc')}
                  action={canGrant ? { label: t('admin.assign_title'), onClick: () => setAssignOpen(true) } : undefined}
                  t={t}
                />
              }
              columns={[
                {
                  id: 'subject', header: t('admin.assign_subject'), primary: true, required: true,
                  sortValue: a => a.subject_label ?? '',
                  cell: a => (
                    <span className="flex items-center gap-2 min-w-0">
                      {a.subject_group_id
                        ? <Building2 size={15} className="text-text-tertiary shrink-0" />
                        : <Users size={15} className="text-text-tertiary shrink-0" />}
                      <span className="truncate text-text-primary">{a.subject_label ?? '—'}</span>
                    </span>
                  ),
                },
                {
                  id: 'scope', header: t('admin.assign_scope'),
                  sortValue: a => a.scope,
                  cell: a => (
                    a.scope === 'instance' ? (
                      <span className="inline-flex items-center gap-1 text-sm text-text-secondary">
                        <Globe2 size={13} />{t('admin.assign_scope_instance')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-sm text-text-secondary">
                        <Building2 size={13} />{a.scope_org_unit_name ?? '—'}
                      </span>
                    )
                  ),
                },
                {
                  id: 'expires', header: t('admin.assign_expiry'),
                  sortValue: a => a.expires_at ?? '',
                  cell: a => (
                    a.expires_at ? (
                      <span className="inline-flex items-center gap-1 text-sm text-text-secondary">
                        <Clock size={13} />{when(a.expires_at)}
                      </span>
                    ) : <span className="text-sm text-text-tertiary">{t('admin.assign_expiry_never')}</span>
                  ),
                },
                {
                  id: 'created', header: t('admin.assign_granted_on'), defaultHidden: true,
                  sortValue: a => a.created_at,
                  cell: a => <span className="text-sm text-text-secondary">{when(a.created_at)}</span>,
                },
              ]}
              rowActions={[
                {
                  id: 'revoke', label: t('admin.assign_revoke'), icon: <Trash2 size={15} />, danger: true,
                  hidden: () => !canGrant,
                  onClick: askRevoke,
                },
              ]}
              configurableColumns
              t={t}
            />
          </Card>

          {/* ── Privileges ─────────────────────────────────────────── */}
          <RolePrivilegesCard role={role} catalogue={catalogue} canEdit={isSuperuser} />
        </div>
      </div>

      {assignOpen && <AssignRoleDialog role={role} catalogue={catalogue} onClose={() => setAssignOpen(false)} />}
      {confirmState && <ConfirmDialog {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} />}
    </div>
  )
}
