/**
 * The parts of `RoleIdentityCard.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import { Input, Textarea } from "@ui"
import EditableCard from "../inline-edit/EditableCard"
import { Field, orDash } from "../inline-edit/Field"
import { errorMessage } from "./api"
import DelegabilityChip from "./DelegabilityChip"
import RoleIcon from "./RoleIcon"
import type { RoleIdentityCard } from './RoleIdentityCard'

export function Part1({ role, roleName, canEdit, editing, draft, update, setEditing, stop, submit, t, actions, roleDescription }: { role: NonNullable<RoleIdentityCard['props']['role']>; roleName: NonNullable<RoleIdentityCard['roleName']>; canEdit: NonNullable<RoleIdentityCard['props']['canEdit']>; editing: NonNullable<RoleIdentityCard['editing']>; draft: NonNullable<RoleIdentityCard['draft']>; update: NonNullable<RoleIdentityCard['update']>; setEditing: NonNullable<RoleIdentityCard['setEditing']>; stop: RoleIdentityCard['stop']; submit: RoleIdentityCard['submit']; t: NonNullable<RoleIdentityCard['tr']>; actions: RoleIdentityCard['props']['actions']; roleDescription: NonNullable<RoleIdentityCard['roleDescription']> }) {
  return (
    <EditableCard
          title={
            <span className="flex items-center gap-2.5">
              <RoleIcon role={role} size={20} />
              <span className="truncate">{roleName(role)}</span>
            </span>
          }
          subtitle={<span className="font-mono">{role.slug}</span>}
          canEdit={canEdit}
          editing={editing}
          onEdit={() => { draft.reset(); update.reset(); setEditing(true) }}
          onCancel={stop}
          onSave={submit}
          dirty={draft.dirty && !!draft.value.name.trim()}
          saving={update.isPending}
          error={update.isError ? errorMessage(update.error, t('admin.role_update_error')) : undefined}
          actions={actions}
        >
          {editing ? (
            <div className="flex flex-col gap-4">
              <Input
                label={t('admin.role_name')}
                value={draft.value.name}
                autoFocus
                onChange={e => draft.set('name', e.target.value)}
                placeholder={t('admin.role_name_ph')}
                error={draft.value.name.trim() ? undefined : t('admin.role_name_required')}
              />
              <Textarea
                label={t('admin.roles_col_desc')}
                value={draft.value.description}
                rows={3}
                onChange={e => draft.set('description', e.target.value)}
                placeholder={t('admin.role_desc_ph')}
              />
            </div>
          ) : (
            <dl className="divide-y divide-border">
              <Field label={t('admin.roles_col_desc')}>{orDash(roleDescription(role))}</Field>
            </dl>
          )}
    
          <div className="flex flex-wrap gap-2 mt-4">
            <DelegabilityChip role={role} />
            {role.is_system && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-surface-2 text-text-secondary whitespace-nowrap">
                {t('admin.roles_system')}
              </span>
            )}
          </div>
        </EditableCard>
  )
}
