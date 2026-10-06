/**
 * The parts of `IdentityCard.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import { Tag } from "lucide-react"
import { Input, Textarea } from "@ui"
import EditableCard from "../../inline-edit/EditableCard"
import { Field, orDash } from "../../inline-edit/Field"
import type { IdentityCard } from './IdentityCard'
const NAME_MAX = 40

const DESC_MAX = 150

function errMessage(err: unknown): string | undefined {
  const e = err as { message?: string; response?: { data?: { message?: string } } }
  return e?.response?.data?.message ?? e?.message
}

export function Part1({ t, canManage, audience, editing, draft, update, setEditing, stop, submit, nameError, descError, nameLen, descLen }: { t: NonNullable<IdentityCard['tr']>; canManage: NonNullable<IdentityCard['props']['canManage']>; audience: NonNullable<IdentityCard['props']['audience']>; editing: NonNullable<IdentityCard['editing']>; draft: NonNullable<IdentityCard['draft']>; update: NonNullable<IdentityCard['update']>; setEditing: NonNullable<IdentityCard['setEditing']>; stop: IdentityCard['stop']; submit: IdentityCard['submit']; nameError: IdentityCard['nameError']; descError: IdentityCard['descError']; nameLen: NonNullable<IdentityCard['nameLen']>; descLen: NonNullable<IdentityCard['descLen']> }) {
  return (
    <EditableCard
          className="mb-4"
          title={t('admin.aud_card_identity')}
          icon={<Tag size={16} />}
          canEdit={canManage && !audience.is_everyone}
          editing={editing}
          onEdit={() => { draft.reset(); update.reset(); setEditing(true) }}
          onCancel={stop}
          onSave={submit}
          dirty={draft.dirty && !nameError && !descError}
          saving={update.isPending}
          error={update.isError ? (errMessage(update.error) ?? t('admin.aud_save_failed')) : undefined}
        >
          {editing ? (
            <div className="flex flex-col gap-4">
              <Input
                label={t('admin.aud_name')}
                value={draft.value.name}
                autoFocus
                onChange={e => draft.set('name', e.target.value)}
                placeholder={t('admin.aud_name_ph')}
                error={nameError}
                hint={t('admin.aud_name_hint', { n: nameLen, max: NAME_MAX })}
              />
              <Textarea
                label={t('admin.aud_description')}
                value={draft.value.description}
                rows={3}
                onChange={e => draft.set('description', e.target.value)}
                placeholder={t('admin.aud_desc_ph')}
                error={descError}
                hint={t('admin.aud_desc_hint', { n: descLen, max: DESC_MAX })}
              />
            </div>
          ) : (
            <dl className="divide-y divide-border">
              <Field label={t('admin.aud_name')}>{audience.name}</Field>
              <Field label={t('admin.aud_description')}>{orDash(audience.description)}</Field>
            </dl>
          )}
        </EditableCard>
  )
}
