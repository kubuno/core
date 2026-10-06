/**
 * The parts of `CaveatBlock.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import ReportBlock from "./ReportBlock"
import type { CaveatBlock } from './CaveatBlock'

export function Part1({ t, text }: { t: NonNullable<CaveatBlock['tr']>; text: NonNullable<CaveatBlock['text']> }) {
  return (
    <ReportBlock title={t('admin.rep_caveats')}>
          <p className="max-w-3xl text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>
            {text}
          </p>
        </ReportBlock>
  )
}
