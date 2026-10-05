/**
 * The parts of `PersonalCard.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import { UserCog } from "lucide-react"
import { Input, Textarea } from "@ui"
import EditableCard from "../../../inline-edit/EditableCard"
import { Field, orDash } from "../atoms"
import { accountError } from "../useAccountEdit"
import type { PersonalCard } from './PersonalCard'
function formatBirthday(iso: string, locale: string): string {
  // Parsed as UTC midnight rather than local, so a `YYYY-MM-DD` never slides to
  // the previous day for a viewer west of Greenwich.
  const d = new Date(`${iso}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(locale, {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
  })
}

export function Part1({ t, canEdit, editing, draft, save, setEditing, stop, submit, text, user, i18n }: { t: NonNullable<PersonalCard['tr']>; canEdit: NonNullable<PersonalCard['canEdit']>; editing: NonNullable<PersonalCard['editing']>; draft: NonNullable<PersonalCard['draft']>; save: NonNullable<PersonalCard['save']>; setEditing: NonNullable<PersonalCard['setEditing']>; stop: PersonalCard['stop']; submit: PersonalCard['submit']; text: PersonalCard['text']; user: NonNullable<PersonalCard['props']['user']>; i18n: NonNullable<PersonalCard['i18n']> }) {
  return (
    <EditableCard
          title={t('admin.ud_card_personal')}
          subtitle={t('admin.ud_card_personal_desc')}
          icon={<UserCog size={16} />}
          className="lg:col-span-2"
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
            <Field label={t('admin.ud_name_pronunciation')}>
              {editing ? text('name_pronunciation') : orDash(user.name_pronunciation)}
            </Field>
            <Field label={t('admin.ud_pronouns')}>
              {editing ? text('pronouns') : orDash(user.pronouns)}
            </Field>
            <Field label={t('admin.ud_work_location')}>
              {editing ? text('work_location') : orDash(user.work_location)}
            </Field>
            <Field label={t('admin.ud_gender')}>
              {editing
                ? text('gender', t('admin.ud_gender_hint'))
                : orDash(user.gender)}
            </Field>
            <Field label={t('admin.ud_birthday')}>
              {editing ? (
                <Input
                  type="date"
                  value={draft.value.birthday}
                  onChange={e => draft.set('birthday', e.target.value)}
                />
              ) : orDash(user.birthday ? formatBirthday(user.birthday, i18n.language) : null)}
            </Field>
            <Field label={t('admin.ud_introduction')}>
              {editing ? (
                <Textarea
                  value={draft.value.introduction}
                  rows={4}
                  onChange={e => draft.set('introduction', e.target.value)}
                />
              ) : (
                /* `whitespace-pre-line` keeps the paragraphs somebody typed; the
                   container already breaks long words. */
                orDash(user.introduction
                  ? <span className="whitespace-pre-line">{user.introduction}</span>
                  : null)
              )}
            </Field>
          </dl>
    
          <p className="mt-3 border-t border-border pt-3 text-text-tertiary"
             style={{ fontSize: 'var(--kb-text-meta)' }}>
            {editing ? t('admin.ud_personal_edit_note') : t('admin.ud_personal_note')}
          </p>
        </EditableCard>
  )
}
