// One building's sheet — creation and edit share it, because the fields are the
// same and a separate "add" form is how the two drift apart.

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Callout, Input, Textarea } from '@ui'
import { FloatingWindow } from '@ui/FloatingWindow'
import FloorsField from './FloorsField'
import {
  errorMessage, useCreateBuilding, useUpdateBuilding,
  type Building, type BuildingInput,
} from './api'

/** `""` reads as "no value"; the API wants an explicit absence. */
const orNull = (v: string) => {
  const s = v.trim()
  return s === '' ? null : s
}

/** A decimal that is not a number is an absent coordinate, not a zero. */
function coordinate(v: string): number | null {
  const s = v.trim().replace(',', '.')
  if (s === '') return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

export default function BuildingDialog({
  building, floorMax, onClose,
}: {
  /** `null` opens an empty sheet. */
  building:  Building | null
  floorMax:  number
  onClose:   () => void
}) {
  const { t } = useTranslation()

  const [key,     setKey]     = useState(building?.building_key ?? '')
  const [name,    setName]    = useState(building?.name ?? '')
  const [address, setAddress] = useState(building?.address ?? '')
  const [note,    setNote]    = useState(building?.description ?? '')
  const [lat,     setLat]     = useState(building?.latitude?.toString() ?? '')
  const [lon,     setLon]     = useState(building?.longitude?.toString() ?? '')
  const [floors,  setFloors]  = useState<string[]>(building?.floors ?? [''])
  const [error,   setError]   = useState<string | null>(null)

  const create = useCreateBuilding()
  const update = useUpdateBuilding()
  const busy   = create.isPending || update.isPending

  const submit = async () => {
    setError(null)
    const input: BuildingInput = {
      building_key: key.trim(),
      name:         orNull(name),
      address:      address.trim(),
      description:  orNull(note),
      latitude:     coordinate(lat),
      longitude:    coordinate(lon),
      // Blank rows are dropped here rather than refused: an empty field is
      // somebody who added a row and changed their mind, not an error.
      floors:       floors.map(f => f.trim()).filter(Boolean),
    }
    try {
      if (building) await update.mutateAsync({ id: building.id, input })
      else          await create.mutateAsync(input)
      onClose()
    } catch (e) {
      setError(errorMessage(e, t('admin.res_save_failed')))
    }
  }

  return (
    <div onMouseDown={e => e.stopPropagation()}>
      <FloatingWindow
        title={building ? t('admin.res_building_edit') : t('admin.res_building_new')}
        onClose={onClose}
        defaultWidth={560}
        backdrop
        t={t}
        actions={{
          confirm: {
            label:    t('admin.res_save'),
            onClick:  () => void submit(),
            disabled: busy,
            loading:  busy,
          },
          cancel: { label: t('admin.res_cancel') },
        }}
      >
        <div className="flex max-h-[65vh] flex-col gap-4 overflow-y-auto p-4">
          <Input
            label={t('admin.res_building_key')}
            value={key}
            maxLength={100}
            autoFocus={!building}
            onChange={e => setKey(e.target.value)}
            hint={t('admin.res_building_key_hint')}
          />

          <Input
            label={t('admin.res_building_name')}
            value={name}
            maxLength={100}
            onChange={e => setName(e.target.value)}
          />

          <Textarea
            label={t('admin.res_address')}
            value={address}
            rows={2}
            className="h-20 min-h-20"
            maxLength={500}
            onChange={e => setAddress(e.target.value)}
          />

          <FloorsField
            floors={floors}
            onChange={setFloors}
            maxLength={15}
            maxFloors={floorMax}
            disabled={busy}
          />
          {building && building.resource_count > 0 && (
            <Callout variant="info" t={t}>
              {t('admin.res_building_rename_warning', { count: building.resource_count })}
            </Callout>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t('admin.res_latitude')}
              value={lat}
              inputMode="decimal"
              onChange={e => setLat(e.target.value)}
            />
            <Input
              label={t('admin.res_longitude')}
              value={lon}
              inputMode="decimal"
              onChange={e => setLon(e.target.value)}
            />
          </div>

          <Textarea
            label={t('admin.res_admin_note')}
            value={note}
            rows={2}
            className="h-20 min-h-20"
            maxLength={256}
            onChange={e => setNote(e.target.value)}
            hint={t('admin.res_admin_note_hint')}
          />

          {error && (
            <p className="text-danger" role="alert" style={{ fontSize: 'var(--kb-text-body)' }}>
              {error}
            </p>
          )}
        </div>
      </FloatingWindow>
    </div>
  )
}
