/**
 * The parts of `RolePrivilegesCard.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import { Callout } from "@ui"
import EditableCard from "../inline-edit/EditableCard"
import PrivilegeList from "./PrivilegeList"
import { errorMessage } from "./api"
import type { RolePrivilegesCard } from './RolePrivilegesCard'

export function Part1({ t, canEdit, frozen, editing, reset, update, setEditing, stop, selected, dirty, role, blockers, keys, catalogue, toggle }: { t: NonNullable<RolePrivilegesCard['tr']>; canEdit: NonNullable<RolePrivilegesCard['props']['canEdit']>; frozen: NonNullable<RolePrivilegesCard['frozen']>; editing: NonNullable<RolePrivilegesCard['editing']>; reset: RolePrivilegesCard['reset']; update: NonNullable<RolePrivilegesCard['update']>; setEditing: NonNullable<RolePrivilegesCard['setEditing']>; stop: RolePrivilegesCard['stop']; selected: NonNullable<RolePrivilegesCard['selected']>; dirty: NonNullable<RolePrivilegesCard['dirty']>; role: NonNullable<RolePrivilegesCard['props']['role']>; blockers: NonNullable<RolePrivilegesCard['blockers']>; keys: NonNullable<RolePrivilegesCard['keys']>; catalogue: NonNullable<RolePrivilegesCard['props']['catalogue']>; toggle: RolePrivilegesCard['toggle'] }) {
  return (
    <EditableCard
          title={t('admin.roles_privileges')}
          canEdit={canEdit && !frozen}
          editing={editing}
          onEdit={() => { reset(); update.reset(); setEditing(true) }}
          onCancel={stop}
          onSave={() => update.mutate({ privileges: [...selected] })}
          dirty={dirty}
          saving={update.isPending}
          error={update.isError ? errorMessage(update.error, t('admin.role_update_error')) : undefined}
          actions={
            <span className="text-sm text-text-secondary">
              {role.is_superuser
                ? t('admin.roles_all_privileges')
                : t('admin.priv_count', { count: editing ? selected.size : role.privileges.length })}
            </span>
          }
        >
          {role.is_superuser ? (
            <p className="text-sm text-text-primary">{t('admin.roles_all_privileges')}</p>
          ) : editing ? (
            <div className="flex flex-col gap-4">
              {blockers.length > 0 ? (
                <Callout variant="warning" title={t('admin.role_not_delegable_title')} t={t}>
                  {t('admin.role_not_delegable_desc', { count: blockers.length })}
                </Callout>
              ) : selected.size > 0 && (
                <Callout variant="success" title={t('admin.role_delegable_title')} t={t}>
                  {t('admin.role_delegable_desc')}
                </Callout>
              )}
              <div className="border border-border rounded-lg overflow-hidden">
                <PrivilegeList
                  keys={keys}
                  catalogue={catalogue}
                  selected={selected}
                  onToggle={toggle}
                />
              </div>
            </div>
          ) : (
            <>
              <PrivilegeList keys={role.privileges} catalogue={catalogue} bleed />
              {role.is_system && canEdit && (
                <Callout variant="info" t={t} className="mt-3">{t('admin.role_system_frozen')}</Callout>
              )}
            </>
          )}
        </EditableCard>
  )
}
