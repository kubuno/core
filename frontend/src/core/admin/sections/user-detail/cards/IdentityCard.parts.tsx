/**
 * The parts of `IdentityCard.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import { IdCard } from "lucide-react"
import { Input } from "@ui"
import EditableCard from "../../../inline-edit/EditableCard"
import { Field, orDash } from "../atoms"
import { accountError } from "../useAccountEdit"
import type { IdentityCard } from './IdentityCard'

export function Part1({ t, canEdit, editing, draft, save, setEditing, stop, submit, user }: { t: NonNullable<IdentityCard['tr']>; canEdit: NonNullable<IdentityCard['canEdit']>; editing: NonNullable<IdentityCard['editing']>; draft: NonNullable<IdentityCard['draft']>; save: NonNullable<IdentityCard['save']>; setEditing: NonNullable<IdentityCard['setEditing']>; stop: IdentityCard['stop']; submit: IdentityCard['submit']; user: NonNullable<IdentityCard['props']['user']> }) {
  return (
    <EditableCard
          title={t('admin.ud_card_identity')}
          icon={<IdCard size={16} />}
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
            <Field label={t('admin.u_display_name')}>
              {editing ? (
                <Input
                  value={draft.value.display_name}
                  onChange={e => draft.set('display_name', e.target.value)}
                  placeholder={user.username}
                  hint={t('admin.ud_display_name_hint')}
                  autoFocus
                />
              ) : orDash(user.display_name)}
            </Field>
            <Field label={t('admin.ud_first_name', { defaultValue: 'Prénom' })}>
              {editing ? (
                <Input
                  value={draft.value.first_name}
                  onChange={e => draft.set('first_name', e.target.value)}
                  maxLength={120}
                />
              ) : orDash(user.first_name)}
            </Field>
            <Field label={t('admin.ud_last_name', { defaultValue: 'Nom de famille' })}>
              {editing ? (
                <Input
                  value={draft.value.last_name}
                  onChange={e => draft.set('last_name', e.target.value)}
                  maxLength={120}
                />
              ) : orDash(user.last_name)}
            </Field>
            <Field label={t('admin.ud_username')}>{user.username}</Field>
            <Field label={t('admin.u_email')}>
              <span className="flex flex-wrap items-center gap-2">
                <span className="break-all">{user.email}</span>
                <span
                  className={user.email_verified ? 'text-success' : 'text-text-tertiary'}
                  style={{ fontSize: 'var(--kb-text-meta)' }}
                >
                  {user.email_verified ? t('admin.ud_email_verified') : t('admin.ud_email_unverified')}
                </span>
              </span>
            </Field>
            <Field label={t('admin.ud_auth_method')}>
              {user.oauth_provider
                ? t('admin.ud_auth_oauth', { provider: user.oauth_provider })
                : t('admin.ud_auth_password')}
            </Field>
            <Field label={t('admin.ud_user_id')}>
              {/* Default font and size, like every other value; break-all keeps the long UUID from overflowing. */}
              <span className="break-all">{user.id}</span>
            </Field>
          </dl>
    
          {editing && (
            <p className="mt-3 border-t border-border pt-3 text-text-tertiary"
               style={{ fontSize: 'var(--kb-text-meta)' }}>
              {t('admin.ud_identity_readonly_note')}
            </p>
          )}
        </EditableCard>
  )
}
