// "Try it" — paste a sample, see what matches and how sure the detector is.
//
// ── The one rule this panel must never break ─────────────────────────────────
// This is the only place in the product where inspected content is displayed,
// and it displays it **without any of it having travelled**. The request carries
// the sample (it must — something has to read it); the response carries offsets,
// confidences and counters and not one character back. The highlighting is done
// here, over the text the administrator typed into the textarea in front of
// them.
//
// Nothing is persisted: no row, no audit entry, no log line. A compliance
// officer can paste a real example to check a threshold without that example
// becoming one more copy of the thing they are protecting.

import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlaskConical } from 'lucide-react'
import { Button, Callout, Card } from '@ui'
import { errorMessage, useTestDetector, type DetectorInput, type TestResult } from './api'
import { asPercent } from './labels'

interface Props {
  /** A saved detector… */
  detectorId?: string | null
  /** …or the one being written, so a pattern can be tried before it is saved. */
  draft?:      DetectorInput | null
  /** Reason the draft cannot be tried yet (incomplete form). */
  draftError?: string | null
}

/** One run of the highlighter: a slice of the sample and whether it matched. */
interface Segment {
  text:       string
  confidence: number | null
  counted:    boolean
}

/**
 * Cuts the sample into highlighted and plain runs.
 *
 * Offsets come back in **bytes** (the server scans a `&str`), while JavaScript
 * indexes UTF-16 code units. Anything outside ASCII would therefore drift and
 * the highlight would slide off the match — visibly wrong, and wrong in a way
 * that makes an administrator distrust the whole screen. The sample is
 * re-encoded here and the slices decoded back, so an accented word highlights
 * where it actually is.
 */
function segments(sample: string, result: TestResult | undefined): Segment[] {
  if (!result || result.matches.length === 0) {
    return sample ? [{ text: sample, confidence: null, counted: false }] : []
  }
  const bytes   = new TextEncoder().encode(sample)
  const decoder = new TextDecoder()
  const slice   = (from: number, to: number) => decoder.decode(bytes.slice(from, to))

  const ordered = [...result.matches].sort((a, b) => a.start - b.start)
  const out: Segment[] = []
  let cursor = 0
  for (const m of ordered) {
    // Overlapping matches would otherwise produce negative-length runs.
    if (m.start < cursor) continue
    if (m.start > cursor) out.push({ text: slice(cursor, m.start), confidence: null, counted: false })
    out.push({ text: slice(m.start, m.end), confidence: m.confidence, counted: m.counted })
    cursor = m.end
  }
  if (cursor < bytes.length) {
    out.push({ text: slice(cursor, bytes.length), confidence: null, counted: false })
  }
  return out
}

export default function DetectorTrial({ detectorId, draft, draftError }: Props) {
  const { t } = useTranslation()
  const [sample, setSample] = useState('')
  const [error, setError]   = useState<string | null>(null)
  const trial = useTestDetector()

  const result = trial.data
  const runs   = useMemo(() => segments(sample, result), [sample, result])

  const run = async () => {
    setError(null)
    if (draftError) { setError(draftError); return }
    try {
      await trial.mutateAsync(
        draft ? { sample, draft } : { sample, detector_id: detectorId ?? undefined },
      )
    } catch (e) {
      setError(errorMessage(e, t('admin.det_trial_failed')))
    }
  }

  return (
    <Card
      title={t('admin.det_trial_title')}
      icon={<FlaskConical size={16} className="text-text-secondary" />}
      subtitle={t('admin.det_trial_subtitle')}
    >
      <label
        className="block text-text-secondary"
        style={{ fontSize: 'var(--kb-text-meta)' }}
        htmlFor="detector-sample"
      >
        {t('admin.det_trial_sample')}
      </label>
      <textarea
        id="detector-sample"
        value={sample}
        onChange={e => setSample(e.target.value)}
        rows={6}
        spellCheck={false}
        // A sample is pasted, not dictated: turning the assistive features off
        // stops the browser from "correcting" an IBAN into something else.
        autoComplete="off"
        autoCorrect="off"
        placeholder={t('admin.det_trial_placeholder')}
        className="mt-1 w-full resize-y rounded-md border border-border bg-surface-0 px-3 py-2 font-mono text-text-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        style={{ fontSize: 'var(--kb-text-body)' }}
      />

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => void run()}
          loading={trial.isPending}
          disabled={!sample.trim()}
        >
          {t('admin.det_trial_run')}
        </Button>
        <span className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
          {t('admin.det_trial_nothing_stored')}
        </span>
      </div>

      {error && (
        <p className="mt-2 text-danger" role="alert" style={{ fontSize: 'var(--kb-text-body)' }}>
          {error}
        </p>
      )}

      {result && (
        <div className="mt-4 min-w-0">
          {/* The verdict first: a threshold screen is read for its answer. */}
          <Callout
            variant={result.summary.would_match ? 'warning' : 'info'}
            title={result.summary.would_match
              ? t('admin.det_trial_would_match')
              : t('admin.det_trial_would_not_match')}
            t={t}
          >
            {t('admin.det_trial_counts', {
              count:   result.summary.matches,
              unique:  result.summary.unique_matches,
              best:    asPercent(result.summary.best_confidence),
              minMatches: result.summary.min_matches,
              minUnique:  result.summary.min_unique_matches,
              minConfidence: asPercent(result.summary.min_confidence),
            })}
          </Callout>

          {(result.scan.truncated || result.scan.timed_out || result.scan.saturated) && (
            <div className="mt-2">
              <Callout variant="warning" title={t('admin.det_trial_incomplete')} t={t}>
                {result.scan.truncated && <div>{t('admin.det_trial_truncated')}</div>}
                {result.scan.timed_out && <div>{t('admin.det_trial_timed_out')}</div>}
                {result.scan.saturated && <div>{t('admin.det_trial_saturated')}</div>}
              </Callout>
            </div>
          )}

          <div
            className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-surface-1 p-3 font-mono text-text-primary"
            style={{ fontSize: 'var(--kb-text-body)' }}
          >
            {runs.map((run, i) => run.confidence === null
              ? <span key={i}>{run.text}</span>
              : (
                <mark
                  key={i}
                  // Counted matches carry the danger tint, matches below the
                  // floor a neutral one: "found but not enough" is exactly the
                  // state an administrator is tuning against, and colouring the
                  // two the same hides the thing they came here to see.
                  className={run.counted
                    ? 'rounded-sm bg-danger-light px-0.5 text-text-primary'
                    : 'rounded-sm bg-surface-3 px-0.5 text-text-secondary'}
                  title={asPercent(run.confidence)}
                >
                  {run.text}
                </mark>
              ))}
          </div>
        </div>
      )}
    </Card>
  )
}
