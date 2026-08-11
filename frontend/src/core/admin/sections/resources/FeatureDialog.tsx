// One feature's sheet. Two fields, and one warning worth its own line.

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Callout, Input, Textarea } from '@ui'
import { FloatingWindow } from '@ui/FloatingWindow'
import {
  errorMessage, useCreateFeature, useUpdateFeature,
  type FeatureInput, type ResourceFeature,
} from './api'

export default function FeatureDialog({
  feature, onClose,
}: {
  feature: ResourceFeature | null
  onClose: () => void
}) {
  const { t } = useTranslation()

  const [name, setName] = useState(feature?.name ?? '')
  const [note, setNote] = useState(feature?.description ?? '')
  const [error, setError] = useState<string | null>(null)

  const create = useCreateFeature()
  const update = useUpdateFeature()
  const busy   = create.isPending || update.isPending

  const submit = async () => {
    setError(null)
    const input: FeatureInput = {
      name: name.trim(),
      description: note.trim() === '' ? null : note.trim(),
    }
    try {
      if (feature) await update.mutateAsync({ id: feature.id, input })
      else         await create.mutateAsync(input)
      onClose()
    } catch (e) {
      setError(errorMessage(e, t('admin.res_save_failed')))
    }
  }

  return (
    <div onMouseDown={e => e.stopPropagation()}>
      <FloatingWindow
        title={feature ? t('admin.res_feature_edit') : t('admin.res_feature_new')}
        onClose={onClose}
        defaultWidth={460}
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
        <div className="flex flex-col gap-4 p-4">
          <Input
            label={t('admin.res_feature_name')}
            value={name}
            maxLength={60}
            autoFocus
            onChange={e => setName(e.target.value)}
            hint={t('admin.res_feature_name_hint')}
          />

          <Textarea
            label={t('admin.res_admin_note')}
            value={note}
            rows={2}
            className="h-20 min-h-20"
            maxLength={256}
            onChange={e => setNote(e.target.value)}
          />

          {/* Renaming a feature rewrites the composed name of every resource
              carrying it — a wide edit behind a small field, and the only place
              it can be said before it happens. */}
          {feature && feature.resource_count > 0 && (
            <Callout variant="info" t={t}>
              {t('admin.res_feature_rename_warning', { count: feature.resource_count })}
            </Callout>
          )}

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
