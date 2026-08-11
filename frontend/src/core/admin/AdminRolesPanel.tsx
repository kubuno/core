import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PRIV } from '../authz/types'
import { usePrivileges } from '../authz/usePrivileges'
import { AdminForbidden } from './AdminSectionBoundary'
import { useAdminAction } from './adminAction'
import { useAdminParams } from './adminRoute'
import { errorMessage, usePrivilegeCatalogue, useRoles } from './roles/api'
import RoleDetail from './roles/RoleDetail'
import RoleCreateDialog from './roles/RoleCreateDialog'
import RolesList from './roles/RolesList'

/**
 * Delegated administration: roles, their privileges and their assignments —
 * all of it server-backed (`/admin/roles`, `/admin/privileges`,
 * `/admin/role-assignments`). `/admin/admin-roles/<uuid>` opens one role's sheet.
 *
 * The catalogue is fetched alongside the roles because a role only carries
 * privilege *keys*: labels, orphan status and — the fact this whole screen turns
 * on — scopability, all live in the catalogue.
 */
export default function AdminRolesPanel() {
  const { t } = useTranslation()
  // The open role rides in the path (`/admin/admin-roles/<id>`); this hook is
  // what republishes it under the `role` name the panel already asks for.
  const params = useAdminParams()
  const { can, isSuperuser } = usePrivileges()

  const mayRead = can(PRIV.ROLES_READ)
  const roles     = useRoles(mayRead)
  const catalogue = usePrivilegeCatalogue(mayRead)

  // `/admin/admin-roles?action=create` opens the creation form.
  // Mounted here rather than inside the list so the verb also works from the
  // role sheet, and so the list stays a list.
  const [creating, setCreating] = useState(false)
  useAdminAction('create', () => { if (isSuperuser) setCreating(true) })

  if (!mayRead) return <AdminForbidden titleKey="admin.nav_admin_roles" />

  const list = roles.data ?? []
  const selected = list.find(r => r.id === params.get('role'))

  const editor = creating && (
    <RoleCreateDialog catalogue={catalogue.data ?? []} onClose={() => setCreating(false)} />
  )

  if (selected) {
    return (
      <>
        <RoleDetail role={selected} catalogue={catalogue.data ?? []} />
        {editor}
      </>
    )
  }

  return (
    <div>
      <h1 className="text-xl font-medium text-text-primary mb-6">{t('admin.nav_admin_roles')}</h1>
      <RolesList
        roles={list}
        catalogue={catalogue.data ?? []}
        loading={roles.isLoading || catalogue.isLoading}
        error={roles.error ? errorMessage(roles.error, t('admin.roles_load_error')) : undefined}
        onRetry={() => { roles.refetch(); catalogue.refetch() }}
      />
      {editor}
    </div>
  )
}
