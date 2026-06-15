import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Dropdown, Toggle } from '@ui'
import type { WidgetSettingField } from './WidgetRegistry'

interface Props {
  fields:   WidgetSettingField[]
  value:    Record<string, unknown>
  onChange: (key: string, value: unknown) => void
  onClose:  () => void
}

/** Schema-driven settings panel shown under a widget's gear icon (edit mode). */
export default function WidgetSettingsPopover({ fields, value, onChange, onClose }: Props) {
  const { t } = useTranslation()
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click / Escape
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute top-6 right-2 z-40 w-60 bg-white border border-border rounded-xl shadow-lg
                 p-3 flex flex-col gap-3 text-text-primary"
      onPointerDown={e => e.stopPropagation()}
    >
      {fields.map(field => {
        const current = value[field.key] ?? field.default
        if (field.type === 'select') {
          return (
            <label key={field.key} className="flex flex-col gap-1">
              <span className="text-xs font-medium text-text-secondary">{t(field.label)}</span>
              <Dropdown
                value={String(current)}
                onChange={v => onChange(field.key, v)}
                options={field.options.map(opt => ({ value: opt.value, label: t(opt.label) }))}
                width="100%"
                height={32}
                fontSize={14}
              />
            </label>
          )
        }
        // toggle
        return (
          <label key={field.key} className="flex items-center justify-between gap-2 cursor-pointer">
            <span className="text-xs font-medium text-text-secondary">{t(field.label)}</span>
            <Toggle
              checked={Boolean(current)}
              onChange={e => onChange(field.key, e.target.checked)}
            />
          </label>
        )
      })}
    </div>
  )
}
