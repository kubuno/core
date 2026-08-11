// The panel that makes a rule readable.
//
// It sits beside the editor at every step and is regenerated on every keystroke
// from the same model that will be POSTed. Its job is to let somebody who did
// NOT write the rule read it back — which is the precondition for anybody
// auditing it.
//
// It carries three other things the operator must not have to hunt for: the
// standing simulation banner (a rule in simulation applies nothing, and that
// must be impossible to miss), the scope preview ("this will apply to N
// accounts", with its honesty attached) and the ceilings the server enforces.

import { useTranslation } from 'react-i18next'
import { FlaskConical, Info, Users } from 'lucide-react'
import { Badge, Callout } from '@ui'
import { describeRule, splitEmphasis, type SummaryContext } from './summary'
import { modeLabel, modeVariant, MODE_FACTS } from './labels'
import type { UiNode } from './condition'
import type { RuleInput } from './types'
import type { ScopePreview } from './useDirectory'

interface Props {
  input:   RuleInput
  tree:    UiNode
  ctx:     SummaryContext
  preview?: ScopePreview
  /** Rendered as a plain block instead of a sticky column (mobile, dialogs). */
  flat?:   boolean
}

export function RuleSentence({ input, tree, ctx }: { input: RuleInput; tree: UiNode; ctx: SummaryContext }) {
  const { t } = useTranslation()
  const parts = splitEmphasis(describeRule(input, tree, ctx, t))
  return (
    <p className="leading-relaxed text-text-primary">
      {parts.map((p, i) => p.strong
        ? <strong key={i} className="font-medium text-text-primary">{p.text}</strong>
        : <span key={i}>{p.text}</span>)}
    </p>
  )
}

export default function RuleSummaryPanel({ input, tree, ctx, preview, flat }: Props) {
  const { t } = useTranslation()
  const facts = MODE_FACTS[input.mode]

  return (
    <aside className={flat ? 'min-w-0' : 'min-w-0 lg:sticky lg:top-4'}
      aria-label={t('admin.rl_summary_title')}>
      <div className="rounded-xl border border-border bg-surface-1 p-4">
        <div className="mb-2 flex items-center gap-2">
          <Info size={15} className="text-text-secondary" aria-hidden />
          <h3 className="text-text-primary">{t('admin.rl_summary_title')}</h3>
          <Badge variant={modeVariant(input.mode)} size="sm" className="ms-auto">
            {modeLabel(t, input.mode)}
          </Badge>
        </div>

        <RuleSentence input={input} tree={tree} ctx={ctx} />

        {/* A rule in simulation applies nothing. Standing banner, never a
            footnote: the whole value of the mode is that it is unmistakable. */}
        {input.mode === 'simulate' && (
          <div className="mt-3">
            <Callout variant="info" icon={<FlaskConical size={16} />} title={t('admin.rl_sim_banner_title')}>
              {t('admin.rl_sim_banner_body')}
            </Callout>
          </div>
        )}

        {input.mode === 'enforce' && (
          <div className="mt-3">
            <Callout variant="warning" title={t('admin.rl_enforce_banner_title')}>
              {t('admin.rl_enforce_banner_body')}
            </Callout>
          </div>
        )}

        {/* What the chosen mode actually does, restated in three lines. */}
        <ul className="mt-3 flex flex-col gap-1 text-text-secondary"
          style={{ fontSize: 'var(--kb-text-meta)' }}>
          <li>{t(facts.evaluates ? 'admin.rl_fact_evaluates_yes' : 'admin.rl_fact_evaluates_no')}</li>
          <li>{t(facts.acts ? 'admin.rl_fact_acts_yes' : 'admin.rl_fact_acts_no')}</li>
          <li>{t(`admin.rl_fact_alerts_${facts.alerts}`)}</li>
        </ul>

        {preview && (
          <div className="mt-3 flex items-start gap-2 border-t border-border pt-3 text-text-secondary"
            style={{ fontSize: 'var(--kb-text-meta)' }}>
            <Users size={14} className="mt-0.5 shrink-0" aria-hidden />
            <span>
              {!preview.available
                ? t('admin.rl_scope_preview_denied')
                : preview.isLoading
                  ? t('common.loading')
                  : preview.everyone
                    ? t('admin.rl_scope_preview_all', { n: preview.total })
                    : preview.partial
                      ? t('admin.rl_scope_preview_partial', { count: preview.count, loaded: 200, total: preview.total })
                      : t('admin.rl_scope_preview', { count: preview.count })}
            </span>
          </div>
        )}
      </div>
    </aside>
  )
}
