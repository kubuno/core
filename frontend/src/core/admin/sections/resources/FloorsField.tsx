// The ordered floor list of a building.
//
// A list of rows with explicit move controls rather than a comma-separated text
// field, for two reasons that are the same reason: the order is *data*, and it
// has to be visible while it is being decided. Nothing sorts "Accueil" before
// "5A" on its own, so a text field would ask an administrator to hold the whole
// sequence in their head while typing it, and a wrong order is invisible until
// somebody reads a room's composed name and finds the wrong floor in it.
//
// Each row is also the exact string a resource will point at through a foreign
// key, which is why it is edited as a field of its own rather than parsed out of
// a sentence.

import { useTranslation } from 'react-i18next'
import { ArrowDown, ArrowUp, Plus, X } from 'lucide-react'
import { Button, Input } from '@ui'
import FieldLabel from './FieldLabel'

export default function FloorsField({
  floors, onChange, maxLength, maxFloors, disabled,
}: {
  floors:     string[]
  onChange:   (next: string[]) => void
  /** Column width of a floor name, served by the API alongside the list. */
  maxLength:  number
  /** How many floors a building may hold at all, served by the API. */
  maxFloors:  number
  disabled?:  boolean
}) {
  const { t } = useTranslation()

  const set = (index: number, value: string) =>
    onChange(floors.map((f, i) => (i === index ? value : f)))

  const move = (index: number, delta: number) => {
    const target = index + delta
    if (target < 0 || target >= floors.length) return
    const next = [...floors]
    const [row] = next.splice(index, 1)
    next.splice(target, 0, row)
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <FieldLabel>{t('admin.res_floors')}</FieldLabel>
        <span className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
          {t('admin.res_floors_hint')}
        </span>
      </div>

      <ul className="flex flex-col gap-2">
        {floors.map((floor, index) => (
          // The index is the key on purpose: a floor row has no identity of its
          // own — its position IS its meaning — and keying on the text would
          // remount the field on every keystroke, taking focus with it.
          <li key={index} className="flex items-center gap-1.5">
            {/* The wrapper carries the growth, not the field: `Input` puts its
                `className` on the `<input>` itself, so `flex-1` there would
                stretch nothing — the surrounding `div` it renders would still
                size to its content. */}
            <div className="min-w-0 flex-1">
              <Input
                value={floor}
                maxLength={maxLength}
                disabled={disabled}
                aria-label={t('admin.res_floor_rank', { rank: index + 1 })}
                placeholder={t('admin.res_floor_placeholder')}
                onChange={e => set(index, e.target.value)}
              />
            </div>
            <button
              type="button"
              disabled={disabled || index === 0}
              aria-label={t('admin.res_floor_up')}
              onClick={() => move(index, -1)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md
                         text-text-secondary transition-colors hover:bg-surface-2
                         hover:text-text-primary disabled:cursor-default disabled:text-text-tertiary
                         disabled:hover:bg-transparent focus:outline-none
                         focus-visible:ring-2 focus-visible:ring-primary"
            >
              <ArrowUp size={15} />
            </button>
            <button
              type="button"
              disabled={disabled || index === floors.length - 1}
              aria-label={t('admin.res_floor_down')}
              onClick={() => move(index, 1)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md
                         text-text-secondary transition-colors hover:bg-surface-2
                         hover:text-text-primary disabled:cursor-default disabled:text-text-tertiary
                         disabled:hover:bg-transparent focus:outline-none
                         focus-visible:ring-2 focus-visible:ring-primary"
            >
              <ArrowDown size={15} />
            </button>
            <button
              type="button"
              disabled={disabled}
              aria-label={t('admin.res_floor_remove')}
              onClick={() => onChange(floors.filter((_, i) => i !== index))}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md
                         text-text-secondary transition-colors hover:bg-surface-2
                         hover:text-danger focus:outline-none
                         focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X size={15} />
            </button>
          </li>
        ))}
      </ul>

      <div>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled || floors.length >= maxFloors}
          icon={<Plus size={14} />}
          onClick={() => onChange([...floors, ''])}
        >
          {t('admin.res_floor_add')}
        </Button>
      </div>
    </div>
  )
}
