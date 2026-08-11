// "Test the condition" — the rule debugger.
//
// An operator pastes a sample fact (or accepts the one the editor prefills from
// the trigger's declared fields) and every node of the tree lights up green or
// red. That is what turns the builder from a form into something usable: without
// it, the only way to find out whether a tree does what its author meant is to
// arm it and watch.
//
// The evaluation runs in the browser, against a faithful copy of the engine's
// comparison semantics (see compare.ts). It writes nothing, reaches nothing and
// touches no account — a question about a rule must never be answerable only by
// running the rule.

import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Play, RotateCcw, Wand2 } from 'lucide-react'
import { Button, Callout, Textarea } from '@ui'
import { flatten, verdictMap, type UiGroup, type Verdict } from './condition'
import { sampleOfLeaf, type LeafContext } from './leafKinds'
import type { TriggerRow } from './types'

interface Props {
  root:    UiGroup
  ctx:     LeafContext
  trigger: TriggerRow | undefined
  /** Publishes the verdicts so the tree can paint itself. `null` clears them. */
  onVerdicts: (v: Record<string, Verdict> | null) => void
}

/** Deep-merges the fragments each leaf contributes into one plausible fact. */
function mergeDeep(target: Record<string, unknown>, source: Record<string, unknown>) {
  for (const [k, v] of Object.entries(source)) {
    if (v && typeof v === 'object' && !Array.isArray(v)
      && target[k] && typeof target[k] === 'object' && !Array.isArray(target[k])) {
      mergeDeep(target[k] as Record<string, unknown>, v as Record<string, unknown>)
    } else {
      target[k] = v
    }
  }
}

export default function ConditionTester({ root, ctx, trigger, onVerdicts }: Props) {
  const { t } = useTranslation()
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [ran, setRan] = useState(false)
  /** Verdict of the ROOT of the last run — `'unknown'` is a result, not a failure. */
  const [rootVerdict, setRootVerdict] = useState<Verdict | undefined>(undefined)

  /** A fact built from what the tree actually compares, not a generic template. */
  const suggestion = useMemo(() => {
    const facts: Record<string, unknown> = {}
    for (const node of flatten(root)) {
      if (node.kind === 'leaf') mergeDeep(facts, sampleOfLeaf(node.node, ctx))
    }
    // The three fields `rules::facts` adds to every fact, whatever the event.
    facts.event_type    = trigger?.event_type ?? 'UserCreated'
    facts.source_module = trigger?.module_id ?? 'core'
    facts.depth         = 0
    return JSON.stringify(facts, null, 2)
  }, [root, ctx, trigger])

  const run = () => {
    let parsed: unknown
    try {
      parsed = JSON.parse(text.trim() === '' ? suggestion : text)
    } catch {
      setError(t('admin.rl_test_bad_json'))
      onVerdicts(null)
      setRan(false)
      return
    }
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      setError(t('admin.rl_test_not_object'))
      onVerdicts(null)
      setRan(false)
      return
    }
    setError(null)
    const map = verdictMap(root, parsed)
    onVerdicts(map)
    setRootVerdict(map[root.id])
    setRan(true)
  }

  const clear = () => { onVerdicts(null); setRan(false); setError(null); setRootVerdict(undefined) }

  return (
    <div className="min-w-0">
      <p className="mb-2 text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
        {t('admin.rl_test_help')}
      </p>

      <Textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={suggestion}
        rows={8}
        spellCheck={false}
        className="font-mono"
        aria-label={t('admin.rl_test_fact')}
      />

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm" icon={<Play size={14} />} onClick={run}>
          {t('admin.rl_test_run')}
        </Button>
        <Button variant="ghost" size="sm" icon={<Wand2 size={14} />} onClick={() => setText(suggestion)}>
          {t('admin.rl_test_prefill')}
        </Button>
        {ran && (
          <Button variant="ghost" size="sm" icon={<RotateCcw size={14} />} onClick={clear}>
            {t('admin.rl_test_clear')}
          </Button>
        )}
      </div>

      {error && (
        <div className="mt-2">
          <Callout variant="danger">{error}</Callout>
        </div>
      )}
      {ran && !error && (
        <div className="mt-2">
          {/* An undecidable root is not a failed test: some leaves are decided
              server-side (a content detector is), and saying "satisfied" over
              them would hand back a green tick the engine never promised. */}
          <Callout variant={rootVerdict === 'unknown' ? 'warning' : 'info'}>
            {rootVerdict === 'unknown' ? t('admin.rl_test_done_unknown') : t('admin.rl_test_done')}
          </Callout>
        </div>
      )}
    </div>
  )
}
