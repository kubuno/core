import type { ReactNode } from 'react'

/**
 * One row of a record card: a caption, and either the value or the control that
 * changes it.
 *
 * The label column is fixed so the values of a card line up, and wraps under the
 * label on a narrow container rather than squeezing the value into three
 * characters. Both states use this same row — that is the whole point: a card
 * that reads and a card that edits cannot fall out of alignment if they are the
 * same markup.
 *
 * It lives here rather than in one sheet's folder because three sheets now draw
 * it, and a fourth copy is how the console ends up with four kinds of label.
 */
export function Field({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-1.5 sm:flex-row sm:gap-3">
      <dt
        className="shrink-0 text-text-tertiary sm:w-44"
        style={{ fontSize: 'var(--kb-text-body)' }}
      >
        {label}
      </dt>
      <dd className="min-w-0 break-words text-text-primary" style={{ fontSize: 'var(--kb-text-body)' }}>
        {children}
      </dd>
    </div>
  )
}

/** Renders `—` for an absent value so a card never shows an empty line. */
export function orDash(value: ReactNode | null | undefined): ReactNode {
  if (value === null || value === undefined || value === '') {
    return <span className="text-text-tertiary">—</span>
  }
  return value
}
