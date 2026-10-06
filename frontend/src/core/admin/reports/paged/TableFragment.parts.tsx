/**
 * The parts of `TableFragment.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import type { TableFragment } from './TableFragment'

export function Part1({ slice, t, item, widths, from, to, last, item_foot, item_note }: { slice: TableFragment['props']['slice']; t: NonNullable<TableFragment['tr']>; item: NonNullable<TableFragment['props']['item']>; widths: NonNullable<TableFragment['props']['widths']>; from: NonNullable<TableFragment['from']>; to: NonNullable<TableFragment['to']>; last: NonNullable<TableFragment['last']>; item_foot: NonNullable<NonNullable<TableFragment['props']['item']>['foot']>; item_note: NonNullable<NonNullable<TableFragment['props']['item']>['note']> }) {
  return (
    <section
          data-report-card="table"
          data-paged-block
          className="mt-4 rounded-xl border border-border bg-surface-0 p-4"
        >
          <h2 className="mb-3 text-text-primary" style={{ fontSize: 'var(--kb-text-heading)' }}>
            {/* A heading that reappears identically three sheets running reads as
                three tables. "(suite)" says it is one. */}
            {slice?.continued ? t('admin.rep_continued', { title: item.title }) : item.title}
          </h2>
    
          <table
            data-report-table
            data-paged-table
            className="w-full border-collapse text-text-primary"
            style={{ fontSize: item.fontSize, tableLayout: widths ? 'fixed' : 'auto' }}
          >
            {widths && (
              <colgroup>
                {widths.map((w, i) => <col key={i} style={{ width: `${w}px` }} />)}
              </colgroup>
            )}
            <thead data-paged-head>{item.head}</thead>
            <tbody data-paged-body>{item.rows.slice(from, to)}</tbody>
            {last && item.foot && <tfoot data-paged-foot>{item_foot}</tfoot>}
          </table>
    
          {last && item.note && (
            <p data-paged-note className="mt-3 text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
              {item_note}
            </p>
          )}
        </section>
  )
}
