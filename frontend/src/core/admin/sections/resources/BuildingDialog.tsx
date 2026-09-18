// One building's sheet — creation and edit share it, because the fields are the
// same and a separate "add" form is how the two drift apart.

import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Callout, Input, Textarea } from '@ui'
import { FloatingWindow } from '@ui/FloatingWindow'
import FloorsField from './FloorsField'
import { SlotRegistry } from '../../../slots/SlotRegistry'
import { useModulesStore } from '../../../store/modulesStore'
import { GEO_POINT_FIELD, type GeoPointFieldProps } from '../../geoPointField'
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

  // Has an installed, running module claimed "choose a point on Earth"? If so
  // it draws this part of the sheet; if not, two number fields do.
  //
  // `loadedVersion` is in the dependencies on purpose: the module list arrives
  // BEFORE the module bundles that register anything, so a lookup keyed only on
  // the list would settle on "nobody" a beat too early and never look again.
  const { activeModules, loadedVersion } = useModulesStore()
  const GeoPoint = useMemo(
    () => SlotRegistry.getActiveOverride<GeoPointFieldProps>(
      GEO_POINT_FIELD,
      new Set(activeModules.map(m => m.module_id)),
    ),
    [activeModules, loadedVersion],
  )

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
        defaultWidth={780}
        // The refusal belongs under the title, not at the end of a form the
        // operator has to scroll through to discover why nothing was saved.
        banner={error ? <Callout variant="danger" t={t}>{error}</Callout> : null}
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
        {/* Two columns. The short fields pair off — the sheet was a single
            tall ribbon of half-empty rows, and a form read in one glance is a
            form filled in one pass. What genuinely needs the width keeps it:
            the multi-line address, the map, the note. Below `sm` it all folds
            back into one column, where two would be a pair of slots too narrow
            to hold a label. */}
        <div className="grid max-h-[65vh] grid-cols-1 items-start gap-4 overflow-y-auto p-4 sm:grid-cols-2">
          <Input
            label={t('admin.res_building_key')}
            value={key}
            required
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
            required
            rows={2}
            className="h-20 min-h-20"
            maxLength={500}
            onChange={e => setAddress(e.target.value)}
          />

          <div className="min-w-0">
            <FloorsField
              floors={floors}
              onChange={setFloors}
              maxLength={15}
              maxFloors={floorMax}
              disabled={busy}
            />
          </div>

          {building && building.resource_count > 0 && (
            <div className="sm:col-span-2">
              <Callout variant="info" t={t}>
                {t('admin.res_building_rename_warning', { count: building.resource_count })}
              </Callout>
            </div>
          )}

          <div className="min-w-0 sm:col-span-2">
          {GeoPoint ? (
            <GeoPoint
              latitude={lat}
              longitude={lon}
              address={address}
              disabled={busy}
              onChange={(la, lo) => { setLat(la); setLon(lo) }}
            />
          ) : (
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
          )}
          </div>

          <div className="sm:col-span-2">
            <Textarea
              label={t('admin.res_admin_note')}
              value={note}
              rows={2}
              className="h-20 min-h-20"
              maxLength={256}
              onChange={e => setNote(e.target.value)}
              hint={t('admin.res_admin_note_hint')}
            />
          </div>

        </div>
      </FloatingWindow>
    </div>
  )
}
