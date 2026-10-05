/**
 * The parts of `OrganisationCard.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import { Building2 } from "lucide-react"
import { Dropdown } from "@ui"
import OrgUnitPicker from "../../../OrgUnitPicker"
import EditableCard from "../../../inline-edit/EditableCard"
import { Field, orDash } from "../atoms"
import { accountError } from "../useAccountEdit"
import RoleBadge from "../RoleBadge"
import StatusBadge from "../StatusBadge"
import type { OrganisationCard } from './OrganisationCard'
type SystemRole = 'user' | 'admin' | 'guest'

export function Part1({ t, canEdit, editing, draft, save, setEditing, stop, submit, isSuperuser, user, unitName, shownUnit, canMove, setPicker, picker }: { t: NonNullable<OrganisationCard['tr']>; canEdit: NonNullable<OrganisationCard['canEdit']>; editing: NonNullable<OrganisationCard['editing']>; draft: NonNullable<OrganisationCard['draft']>; save: NonNullable<OrganisationCard['save']>; setEditing: NonNullable<OrganisationCard['setEditing']>; stop: OrganisationCard['stop']; submit: OrganisationCard['submit']; isSuperuser: NonNullable<OrganisationCard['isSuperuser']>; user: NonNullable<OrganisationCard['props']['user']>; unitName: OrganisationCard['unitName']; shownUnit: NonNullable<OrganisationCard['shownUnit']>; canMove: NonNullable<OrganisationCard['canMove']>; setPicker: NonNullable<OrganisationCard['setPicker']>; picker: NonNullable<OrganisationCard['picker']> }) {
  return (
    <EditableCard
          title={t('admin.ud_card_organisation')}
          icon={<Building2 size={16} />}
          canEdit={canEdit}
          editing={editing}
          onEdit={() => { draft.reset(); save.reset(); setEditing(true) }}
          onCancel={stop}
          onSave={submit}
          dirty={draft.dirty}
          saving={save.isPending}
          error={save.isError ? (accountError(save.error) ?? t('admin.update_error')) : undefined}
        >
          <dl className="divide-y divide-border">
            <Field label={t('admin.u_role')}>
              {editing && isSuperuser ? (
                <Dropdown
                  width="100%"
                  focusable
                  height={36}
                  value={draft.value.role}
                  onChange={v => draft.set('role', v as SystemRole)}
                  options={[
                    { value: 'user',  label: t('admin.role_user') },
                    { value: 'admin', label: t('admin.role_admin') },
                    { value: 'guest', label: t('admin.role_guest') },
                  ]}
                />
              ) : (
                <RoleBadge role={user.role} label={t(`admin.role_${user.role}`, { defaultValue: user.role })} />
              )}
            </Field>
    
            <Field label={t('admin.th_status')}>
              <span className="flex flex-wrap items-center gap-2">
                <StatusBadge
                  active={user.is_active}
                  label={user.is_active ? t('admin.active') : t('admin.inactive')}
                />
                {editing && (
                  <span className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
                    {t('admin.ud_status_in_header')}
                  </span>
                )}
              </span>
            </Field>
    
            <Field label={t('admin.ud_org_unit')}>
              <span className="flex flex-wrap items-center gap-2">
                <span>{orDash(unitName(shownUnit) ?? (shownUnit ? shownUnit : null))}</span>
                {editing && canMove && (
                  <button
                    type="button"
                    onClick={() => setPicker(true)}
                    className="text-primary hover:underline"
                    style={{ fontSize: 'var(--kb-text-meta)' }}
                  >
                    {t('admin.u_ou_change')}
                  </button>
                )}
              </span>
            </Field>
          </dl>
    
          {editing && !isSuperuser && (
            <p className="mt-3 border-t border-border pt-3 text-text-tertiary"
               style={{ fontSize: 'var(--kb-text-meta)' }}>
              {t('admin.ud_role_superuser_only')}
            </p>
          )}
    
          {picker && (
            <OrgUnitPicker
              title={t('admin.ou_picker_title', { name: user.display_name ?? user.username })}
              currentId={draft.value.org_unit_id}
              onSelect={id => draft.set('org_unit_id', id)}
              onClose={() => setPicker(false)}
            />
          )}
        </EditableCard>
  )
}
