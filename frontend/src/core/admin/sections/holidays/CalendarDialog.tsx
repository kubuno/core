// Creating a calendar this instance owns.
//
// Not a country: the shipped referential already carries every country, and a
// second "France" would be a fork nobody asked for. This is for the list an
// organisation keeps for itself — closure days, a site's own calendar — which
// is why the identifier is generated and the country code is optional.

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Callout, Input } from '@ui'
import { FloatingWindow } from '@ui/FloatingWindow'
import { errorMessage, useCreateCalendar } from './api'

export default function CalendarDialog({
  onClose, onCreated,
}: {
  onClose: () => void
  onCreated: (id: string) => void
}) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [country, setCountry] = useState('')
  const [error, setError] = useState<string | null>(null)

  const create = useCreateCalendar()

  const submit = async () => {
    setError(null)
    try {
      const created = await create.mutateAsync({
        name: name.trim(),
        country_code: country.trim() === '' ? undefined : country.trim().toUpperCase(),
      })
      onClose()
      onCreated(created.id)
    } catch (e) {
      setError(errorMessage(e, t('admin.hol_save_failed')))
    }
  }

  return (
    <div onMouseDown={e => e.stopPropagation()}>
      <FloatingWindow
        title={t('admin.hol_new_calendar')}
        onClose={onClose}
        defaultWidth={460}
        backdrop
        t={t}
        actions={{
          confirm: {
            label:    t('admin.hol_save'),
            onClick:  () => void submit(),
            disabled: create.isPending || name.trim() === '',
            loading:  create.isPending,
          },
          cancel: { label: t('admin.hol_cancel') },
        }}
      >
        <div className="flex flex-col gap-4 p-4">
          <Input
            label={t('admin.hol_calendar_name')}
            value={name}
            maxLength={160}
            autoFocus
            onChange={e => setName(e.target.value)}
            hint={t('admin.hol_calendar_name_hint')}
          />
          <Input
            label={t('admin.hol_calendar_country')}
            value={country}
            maxLength={2}
            onChange={e => setCountry(e.target.value.toUpperCase())}
            hint={t('admin.hol_calendar_country_hint')}
          />

          <Callout variant="info" t={t}>{t('admin.hol_calendar_new_note')}</Callout>

          {error && (
            <p className="text-danger" role="alert" style={{ fontSize: 'var(--kb-text-body)' }}>{error}</p>
          )}
        </div>
      </FloatingWindow>
    </div>
  )
}
