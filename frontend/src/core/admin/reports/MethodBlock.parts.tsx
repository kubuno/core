/**
 * The parts of `MethodBlock.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import ReportBlock from "./ReportBlock"
import type { MethodBlock } from './MethodBlock'

export function Part1({ t, source, key, model }: { t: NonNullable<MethodBlock['tr']>; source: NonNullable<MethodBlock['props']['source']>; key: NonNullable<MethodBlock['key']>; model: NonNullable<MethodBlock['props']['model']> }) {
  return (
    <ReportBlock title={t('admin.rep_method')}>
          {!source || !key ? (
            <p className="text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>
              {t('admin.rep_method_unknown')}
            </p>
          ) : (
            <div className="space-y-2 text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>
              <p>{t(key, { table: source.table, column: source.column ?? '' })}</p>
              <p>
                {t('admin.rep_method_filter')}{' '}
                {/* `TRUE` is what a predicate that restricts nothing looks like in
                    SQL, and printing it verbatim would read as a placeholder. */}
                {source.filter === 'TRUE' ? (
                  <span>{t('admin.rep_method_all_rows')}</span>
                ) : (
                  <code className="rounded bg-surface-2 px-1 py-0.5 text-text-primary"
                        style={{ fontSize: 'var(--kb-text-meta)' }}>
                    {source.filter}
                  </code>
                )}
              </p>
              <p>
                {model.snapshot
                  ? t('admin.rep_method_snapshot')
                  : t('admin.rep_method_window', {
                      tz:   model.timezone,
                      from: model.previousFrom,
                      to:   model.previousTo,
                    })}
              </p>
            </div>
          )}
        </ReportBlock>
  )
}
