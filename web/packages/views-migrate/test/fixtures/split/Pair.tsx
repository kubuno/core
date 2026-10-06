import { useTranslation } from 'react-i18next'
import { Button } from '@ui'

/** Shared by both components: stays here, exported. */
function label(n: number): string {
  return `#${n}`
}

/** Used by First only: moves with it. */
const FIRST_CLASS = 'text-sm'

export type Mode = 'a' | 'b'

/** A local component both render: copied into each file, gone from this one. */
function Tag({ text }: { text: string }) {
  return <em>{text}</em>
}

/** The first screen. */
export function First({ n, mode }: { n: number; mode: Mode }) {
  return <p className={FIRST_CLASS}>{label(n)} {mode} <Tag text="1" /></p>
}

// The second screen, which shows the first.
export function Second({ n }: { n: number }) {
  const { t } = useTranslation()
  return (
    <div>
      <First n={n} mode="a" />
      <Tag text="2" />
      <Button>{t('common.ok')} {label(n)}</Button>
    </div>
  )
}
