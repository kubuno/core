/**
 * The parts of `ReportBlock.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import type { ReportBlock } from './ReportBlock'

export function Part1({ table, title, children, note }: { table: ReportBlock['props']['table']; title: NonNullable<ReportBlock['props']['title']>; children: ReportBlock['props']['children']; note: NonNullable<ReportBlock['props']['note']> }) {
  return (
    <section
          data-report-card={table ? 'table' : ''}
          className="mt-4 rounded-xl border border-border bg-surface-0 p-4"
        >
          <h2 className="mb-3 text-text-primary" style={{ fontSize: 'var(--kb-text-heading)' }}>
            {title}
          </h2>
          {children}
          {note && (
            <p className="mt-3 text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
              {note}
            </p>
          )}
        </section>
  )
}
