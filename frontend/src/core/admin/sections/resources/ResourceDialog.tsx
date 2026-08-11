// One resource's sheet.
//
// Two things this form deliberately does not have:
//
//   * an identifier field. A resource's identifier is generated and immutable;
//     wherever it can be typed, correcting it does not rename the resource, it
//     creates a second one and orphans everything pointing at the first.
//   * a live preview of the composed name. It would be a second implementation
//     of the server's format, and two implementations of a derived value diverge
//     on the first change to either. The saved name is shown read-only when it
//     exists, and announced as computed when it does not.

import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Callout, Checkbox, Dropdown, Input, NumberInput, Textarea } from '@ui'
import { FloatingWindow } from '@ui/FloatingWindow'
import FieldLabel from './FieldLabel'
import {
  errorMessage, useBuildings, useCreateResource, useResourceFeatures, useUpdateResource,
  type Resource, type ResourceCategory, type ResourceInput,
} from './api'

const orNull = (v: string) => (v.trim() === '' ? null : v.trim())

export default function ResourceDialog({
  resource, onClose,
}: {
  resource: Resource | null
  onClose:  () => void
}) {
  const { t } = useTranslation()

  const buildings = useBuildings()
  const features  = useResourceFeatures()

  const [name,     setName]     = useState(resource?.name ?? '')
  const [category, setCategory] = useState<ResourceCategory>(resource?.category ?? 'meeting_room')
  const [kind,     setKind]     = useState(resource?.resource_type ?? '')
  const [buildingId, setBuildingId] = useState(resource?.building.id ?? '')
  const [floor,    setFloor]    = useState(resource?.floor_name ?? '')
  const [section,  setSection]  = useState(resource?.floor_section ?? '')
  const [capacity, setCapacity] = useState(resource?.capacity ?? 1)
  const [visible,  setVisible]  = useState(resource?.user_description ?? '')
  const [note,     setNote]     = useState(resource?.description ?? '')
  const [chosen,   setChosen]   = useState<string[]>(resource?.feature_ids ?? [])
  const [error,    setError]    = useState<string | null>(null)

  const create = useCreateResource()
  const update = useUpdateResource()
  const busy   = create.isPending || update.isPending

  const buildingList = buildings.data?.buildings ?? []
  const building = buildingList.find(b => b.id === buildingId)

  const buildingOptions = useMemo(
    () => buildingList.map(b => ({
      value: b.id,
      label: b.name ? `${b.building_key} — ${b.name}` : b.building_key,
    })),
    [buildingList],
  )

  // Only the floors of the chosen building: the composite foreign key refuses
  // anything else, and offering a free-text field here would turn a schema rule
  // into a refusal the administrator meets after filling the whole form.
  const floorOptions = (building?.floors ?? []).map(f => ({ value: f, label: f }))

  const submit = async () => {
    setError(null)
    const input: ResourceInput = {
      name:             name.trim(),
      building_id:      buildingId,
      category,
      resource_type:    category === 'other' ? orNull(kind) : null,
      floor_name:       floor,
      floor_section:    orNull(section),
      capacity,
      user_description: orNull(visible),
      description:      orNull(note),
      feature_ids:      chosen,
    }
    try {
      if (resource) await update.mutateAsync({ id: resource.id, input })
      else          await create.mutateAsync(input)
      onClose()
    } catch (e) {
      setError(errorMessage(e, t('admin.res_save_failed')))
    }
  }

  // Nothing can be created before a building exists: a resource must name one,
  // and the form says so instead of failing on submit.
  const noBuildings = !buildings.isLoading && buildingList.length === 0

  return (
    <div onMouseDown={e => e.stopPropagation()}>
      <FloatingWindow
        title={resource ? t('admin.res_resource_edit') : t('admin.res_resource_new')}
        onClose={onClose}
        defaultWidth={600}
        backdrop
        t={t}
        actions={{
          confirm: {
            label:    t('admin.res_save'),
            onClick:  () => void submit(),
            disabled: busy || noBuildings,
            loading:  busy,
          },
          cancel: { label: t('admin.res_cancel') },
        }}
      >
        <div className="flex max-h-[65vh] flex-col gap-4 overflow-y-auto p-4">
          {noBuildings && (
            <Callout variant="warning" title={t('admin.res_needs_building_title')} t={t}>
              {t('admin.res_needs_building_desc')}
            </Callout>
          )}

          <div className="flex flex-col gap-1">
            <FieldLabel>{t('admin.res_generated_name')}</FieldLabel>
            <div className="rounded-md border border-border bg-surface-1 px-3 py-2 text-text-secondary"
                 style={{ fontSize: 'var(--kb-text-body)' }}>
              {resource?.generated_name ?? t('admin.res_generated_pending')}
            </div>
            <span className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
              {t('admin.res_generated_hint')}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <FieldLabel>{t('admin.res_category')}</FieldLabel>
            <Dropdown
              value={category}
              onChange={v => {
                const next = v as ResourceCategory
                setCategory(next)
                // A room has no type; keeping the old value would submit a
                // combination the column refuses.
                if (next === 'meeting_room') setKind('')
              }}
              options={[
                { value: 'meeting_room', label: t('admin.res_category_room') },
                { value: 'other',        label: t('admin.res_category_other') },
              ]}
              width="100%"
              height={36}
              focusable
            />
            <span className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
              {category === 'meeting_room'
                ? t('admin.res_category_room_hint')
                : t('admin.res_category_other_hint')}
            </span>
          </div>

          {category === 'other' && (
            <Input
              label={t('admin.res_type')}
              value={kind}
              maxLength={45}
              onChange={e => setKind(e.target.value)}
              hint={t('admin.res_type_hint')}
            />
          )}

          <Input
            label={t('admin.res_resource_name')}
            value={name}
            maxLength={45}
            autoFocus={!resource}
            onChange={e => setName(e.target.value)}
          />

          <div className="flex flex-col gap-1">
            <FieldLabel>{t('admin.res_building')}</FieldLabel>
            <Dropdown
              value={buildingId}
              onChange={v => { setBuildingId(v); setFloor('') }}
              options={buildingOptions}
              placeholder={t('admin.res_building_pick')}
              width="100%"
              height={36}
              focusable
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <FieldLabel>{t('admin.res_floor')}</FieldLabel>
              <Dropdown
                value={floor}
                onChange={setFloor}
                options={floorOptions}
                placeholder={t('admin.res_floor_pick')}
                disabled={!building}
                width="100%"
                height={36}
                focusable
              />
            </div>
            <Input
              label={t('admin.res_section')}
              value={section}
              maxLength={15}
              onChange={e => setSection(e.target.value)}
            />
            <NumberInput
              label={t('admin.res_capacity')}
              value={capacity}
              min={1}
              max={100000}
              onChange={setCapacity}
            />
          </div>

          <div className="flex flex-col gap-2">
            <FieldLabel>{t('admin.res_features')}</FieldLabel>
            {(features.data?.features ?? []).length === 0 ? (
              <span className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
                {t('admin.res_features_none')}
              </span>
            ) : (
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {(features.data?.features ?? []).map(f => (
                  <Checkbox
                    key={f.id}
                    checked={chosen.includes(f.id)}
                    label={f.name}
                    onChange={on => setChosen(on
                      ? [...chosen, f.id]
                      : chosen.filter(id => id !== f.id))}
                  />
                ))}
              </div>
            )}
          </div>

          <Textarea
            label={t('admin.res_visible_note')}
            value={visible}
            rows={2}
            className="h-20 min-h-20"
            maxLength={1000}
            onChange={e => setVisible(e.target.value)}
            hint={t('admin.res_visible_note_hint')}
          />

          <Textarea
            label={t('admin.res_admin_note')}
            value={note}
            rows={2}
            className="h-20 min-h-20"
            maxLength={1000}
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
