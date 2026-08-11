// Create an audience — and only that.
//
// It used to edit one too, opened over the sheet that was already showing the
// name and the description underneath. A dialog is legitimate for a creation:
// there is no record yet, so there is nothing to edit in place. Renaming an
// existing audience happens on its sheet (`IdentityCard`), which is where the
// values are read.
//
// The counters live in each field's `hint` rather than in a message after a
// refusal: 40 and 150 characters are short enough to reach by accident, and a
// name typed in full only to be rejected is a name typed twice.

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Callout, Input, Textarea } from '@ui'
import { FloatingWindow } from '@ui/FloatingWindow'

/** Same ceilings as `core.target_audiences` and the handler that guards it. */
const NAME_MAX = 40
const DESC_MAX = 150

export default function AudienceDialog({
  busy, error, onSave, onCancel,
}: {
  busy:     boolean
  error?:   string
  onSave:   (v: { name: string; description: string | null }) => void
  onCancel: () => void
}) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')

  // Counted in characters, like the server: a byte count would refuse a French
  // name of forty accented letters.
  const nameLen = [...name].length
  const descLen = [...desc].length
  const canSave = name.trim().length > 0 && nameLen <= NAME_MAX && descLen <= DESC_MAX && !busy

  return (
    <div onMouseDown={e => e.stopPropagation()}>
      <FloatingWindow
        title={t('admin.aud_new_title', { defaultValue: 'Nouvelle audience cible' })}
        onClose={onCancel}
        defaultWidth={560}
        backdrop
        t={t}
        actions={{
          confirm: {
            label:    t('settings.create'),
            onClick:  () => onSave({ name: name.trim(), description: desc.trim() || null }),
            disabled: !canSave,
          },
          cancel: { label: t('common.cancel', { defaultValue: 'Annuler' }), disabled: busy },
        }}
      >
        <div className="flex max-h-[65vh] flex-col gap-4 overflow-y-auto p-4">
          <Input
            label={t('admin.aud_name', { defaultValue: 'Nom' })}
            value={name}
            autoFocus
            onChange={e => setName(e.target.value)}
            placeholder={t('admin.aud_name_ph', { defaultValue: 'Direction, Agence de Lyon…' })}
            error={nameLen > NAME_MAX
              ? t('admin.aud_name_too_long', {
                  defaultValue_one: 'Trop long de {{count}} caractère.',
                  defaultValue: 'Trop long de {{count}} caractères.',
                  count: nameLen - NAME_MAX,
                })
              : undefined}
            hint={t('admin.aud_name_hint', {
              defaultValue: 'Affiché dans la liste de partage, à côté d’un nom de fichier. {{n}}/{{max}}',
              n: nameLen, max: NAME_MAX,
            })}
          />

          <Textarea
            label={t('admin.aud_description', { defaultValue: 'Description' })}
            value={desc}
            className="h-20"
            onChange={e => setDesc(e.target.value)}
            placeholder={t('admin.aud_desc_ph', { defaultValue: 'Qui est dans cette audience ?' })}
            error={descLen > DESC_MAX
              ? t('admin.aud_desc_too_long', {
                  defaultValue_one: 'Trop long de {{count}} caractère.',
                  defaultValue: 'Trop long de {{count}} caractères.',
                  count: descLen - DESC_MAX,
                })
              : undefined}
            hint={t('admin.aud_desc_hint', {
              defaultValue: 'Visible en infobulle au moment de partager. {{n}}/{{max}}',
              n: descLen, max: DESC_MAX,
            })}
          />

          {error && <Callout variant="danger">{error}</Callout>}
        </div>
      </FloatingWindow>
    </div>
  )
}
