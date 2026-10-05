import { useTranslation } from 'react-i18next'
import { Button } from '@ui'

/** Shared by both components: stays here, exported. */
function label(n: number): string {
  return `#${n}`
}

/** Used by First only: moves with it. */
const FIRST_CLASS = 'text-sm'

export type Mode = 'a' | 'b'

/** The first screen. */
export function First({ n, mode }: { n: number; mode: Mode }) {
  return <p className={FIRST_CLASS}>{label(n)} {mode}</p>
}

// The second screen, which shows the first.
export function Second({ n }: { n: number }) {
  const { t } = useTranslation()
  return (
    <div>
      <First n={n} mode="a" />
      <Button>{t('common.ok')} {label(n)}</Button>
    </div>
  )
}
