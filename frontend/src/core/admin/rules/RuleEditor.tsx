// The rule editor: a wizard to create, a tabbed sheet to modify.
//
// ── Why two shapes ───────────────────────────────────────────────────────────
// Writing a rule from nothing is a sequence — you cannot choose a field before
// you have chosen a trigger, and you must not choose a mode before you know what
// the rule does. Changing the recipient of a notification is not a sequence, and
// walking somebody through five steps to do it is how a console teaches people
// to stop editing their rules. So: Stepper on create, Tabs on modify.
//
// ── Everything comes from the catalogue ──────────────────────────────────────
// The trigger list, the queryable fields, the operators permitted per field, the
// available actions and their parameter schemas, the settable modes and the
// ceilings — all of it is served by `GET /admin/rules/catalog`. This file
// enumerates none of them.
//
// ── Mobile ───────────────────────────────────────────────────────────────────
// Building a boolean tree on a 390 px screen is a fiction: the row alone needs a
// field, an operator and a value side by side. So on a phone the builder is
// replaced by the natural-language summary — which is the readable form of
// exactly the same thing — and the operator is told where to go to change it.
// Everything else (name, actions, scope, mode, impact, log) stays editable.

import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft, Check, FlaskConical, Save, Sparkles,
} from 'lucide-react'
import {
  Badge, Button, Callout, Card, Combobox, Input, Stepper, Tabs, Textarea, useIsMobile, useToast,
  type StepDef,
} from '@ui'
import { flatten, fromWire, toWire, wireDepth, wireLeaves, type UiGroup, type Verdict } from './condition'
import { leafErrors, leafQuotas, type LeafContext } from './leafKinds'
// Side-effect import: registers the `detector` leaf kind. Nothing below refers
// to it — the builder, the summary and the tester pick it up from the registry,
// which is the whole point of the registry.
import './detectorLeaf'
import ConditionTree from './ConditionTree'
import ConditionTester from './ConditionTester'
import ActionsEditor from './ActionsEditor'
import ScopeEditor from './ScopeEditor'
import ModePicker from './ModePicker'
import ImpactPanel from './ImpactPanel'
import RuleSummaryPanel, { RuleSentence } from './RuleSummaryPanel'
import { useCreateRule, useRule, useRuleCatalog, useUpdateRule } from './api'
import { useDirectory, useScopePreview } from './useDirectory'
import { SEVERITIES, severityLabel } from './labels'
import { formatWhen } from '../sections/format'
import type { SummaryContext } from './summary'
import { emptyRuleInput, ruleToInput, type RuleInput, type RuleLimits } from './types'

export type Pane = 'basics' | 'conditions' | 'actions' | 'scope' | 'mode' | 'impact' | 'history'

const FALLBACK_LIMITS: RuleLimits = {
  condition_depth: 5, condition_leaves: 32, actions: 8, scope_refs: 64, detector_leaves: 8,
}

interface Props {
  /** `null` ⇒ creation. */
  ruleId:   string | null
  onClose:  () => void
  canWrite: boolean
  /** Deep link into one pane (`/admin/rules?rule=…&pane=impact`). */
  initialPane?: Pane
}

export default function RuleEditor({ ruleId, onClose, canWrite, initialPane }: Props) {
  const { t, i18n } = useTranslation()
  const toast = useToast()
  const isMobile = useIsMobile()

  const catalog = useRuleCatalog()
  const detail  = useRule(ruleId)
  const create  = useCreateRule()
  const update  = useUpdateRule()
  const dir     = useDirectory()

  const isNew = ruleId === null
  const [pane, setPane] = useState<Pane>(initialPane ?? 'basics')
  const [input, setInput] = useState<RuleInput>(emptyRuleInput)
  const [tree, setTree] = useState<UiGroup>(() => fromWire({ type: 'all', of: [] }))
  const [verdicts, setVerdicts] = useState<Record<string, Verdict> | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Seed once from the server, never on every render: an in-flight refetch must
  // not drag the operator's half-written tree back to what was stored.
  useEffect(() => {
    if (isNew || loaded || !detail.data) return
    setInput(ruleToInput(detail.data.rule))
    setTree(fromWire(detail.data.rule.conditions))
    setLoaded(true)
  }, [isNew, loaded, detail.data])

  const limits = catalog.data?.limits ?? FALLBACK_LIMITS
  const trigger = catalog.data?.triggers.find(x => x.key === input.trigger)
  const readOnly = !canWrite

  const leafCtx: LeafContext = useMemo(() => ({ trigger, catalog: catalog.data, t }),
    [trigger, catalog.data, t])
  const summaryCtx: SummaryContext = useMemo(() => ({
    trigger,
    catalog:   catalog.data,
    t,
    actions:   catalog.data?.actions ?? [],
    unitName:  dir.unitName,
    groupName: dir.groupName,
    userName:  dir.userName,
  }), [trigger, t, catalog.data, dir])

  const preview = useScopePreview(input.scope, dir)

  const set = <K extends keyof RuleInput>(key: K, value: RuleInput[K]) =>
    setInput(prev => ({ ...prev, [key]: value }))

  // Changing the trigger invalidates every comparison: the fields belong to the
  // trigger, so a tree kept across the change would name fields the new trigger
  // does not expose and be refused on save.
  const setTrigger = (key: string) => {
    setInput(prev => ({ ...prev, trigger: key }))
    setTree(fromWire({ type: 'all', of: [] }))
    setVerdicts(null)
  }

  const wire = useMemo(() => toWire(tree), [tree])
  const overDepth  = wireDepth(wire) > limits.condition_depth
  const overLeaves = wireLeaves(wire) > limits.condition_leaves

  // What the leaves themselves refuse, and the ceilings a single kind carries.
  // Both come from the registry: this file names no kind and counts no detector.
  const leafNodes = useMemo(
    () => flatten(tree).flatMap(n => (n.kind === 'leaf' ? [n.node] : [])), [tree])
  const leafProblems = useMemo(() => {
    const messages = leafErrors(leafNodes, leafCtx, t)
    for (const q of leafQuotas(leafNodes, leafCtx, t)) {
      if (q.used > q.max) messages.push(q.over)
    }
    return messages
  }, [leafNodes, leafCtx, t])

  const payload = (): RuleInput => ({ ...input, conditions: wire })

  const nameOk = input.name.trim().length > 0
  const triggerOk = input.trigger.length > 0
  const canSave = nameOk && triggerOk && !overDepth && !overLeaves
    && leafProblems.length === 0 && canWrite

  const save = () => {
    setError(null)
    const body = payload()
    const onError = (e: unknown) => {
      const message = (e as { response?: { data?: { error?: string; message?: string } } })
        ?.response?.data?.error
        ?? (e as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? t('admin.rl_save_failed')
      setError(message)
      toast.error(t('admin.rl_save_failed'))
    }
    if (isNew) {
      create.mutate(body, {
        onSuccess: () => { toast.success(t('admin.rl_toast_created')); onClose() },
        onError,
      })
    } else if (ruleId) {
      update.mutate({ id: ruleId, input: body }, {
        onSuccess: () => { toast.success(t('admin.rl_toast_saved')); onClose() },
        onError,
      })
    }
  }

  // ── Panes ──────────────────────────────────────────────────────────────────

  const triggerOptions = (catalog.data?.triggers ?? []).map(x => ({
    value: x.key,
    label: x.label,
    description: x.description ?? x.key,
    group: x.module_id,
    disabled: x.is_orphan,
    keywords: `${x.key} ${x.event_type}`,
  }))

  const basics = (
    <div className="flex min-w-0 flex-col gap-4">
      <Input label={t('admin.rl_name')} value={input.name} disabled={readOnly}
        onChange={e => set('name', e.target.value)} placeholder={t('admin.rl_name_ph')} />
      <Textarea label={t('admin.rl_description')} value={input.description ?? ''} rows={3}
        disabled={readOnly} onChange={e => set('description', e.target.value || null)}
        hint={t('admin.rl_description_hint')} />
      <div>
        <label className="mb-1 block text-sm font-medium text-text-primary">{t('admin.rl_trigger')}</label>
        <Combobox value={input.trigger || null} onChange={setTrigger} options={triggerOptions}
          disabled={readOnly} placeholder={t('admin.rl_trigger_ph')}
          aria-label={t('admin.rl_trigger')} />
        {trigger && (
          <p className="mt-1.5 text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
            {trigger.description} · <span className="font-mono">{trigger.event_type}</span>
          </p>
        )}
        {!trigger && (
          <p className="mt-1.5 text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
            {t('admin.rl_trigger_hint')}
          </p>
        )}
      </div>
    </div>
  )

  const conditions = (
    <div className="flex min-w-0 flex-col gap-4">
      {!triggerOk && <Callout variant="info">{t('admin.rl_conditions_need_trigger')}</Callout>}
      {(overDepth || overLeaves) && (
        <Callout variant="danger" title={t('admin.rl_over_limit_title')}>
          {overDepth
            ? t('admin.rl_over_depth', { max: limits.condition_depth })
            : t('admin.rl_over_leaves', { max: limits.condition_leaves })}
        </Callout>
      )}
      {isMobile ? (
        // The tree builder is disabled on a phone, deliberately.
        <Callout variant="info" title={t('admin.rl_mobile_tree_title')}>
          {t('admin.rl_mobile_tree_body')}
        </Callout>
      ) : (
        triggerOk && (
          <>
            <ConditionTree root={tree} onChange={setTree} ctx={leafCtx} limits={limits}
              verdicts={verdicts ?? undefined} disabled={readOnly} />
            <Card title={t('admin.rl_test_title')} icon={<FlaskConical size={15} />} dense>
              <ConditionTester root={tree} ctx={leafCtx} trigger={trigger} onVerdicts={setVerdicts} />
            </Card>
          </>
        )
      )}
    </div>
  )

  const actionsPane = (
    <div className="flex min-w-0 flex-col gap-4">
      <ActionsEditor value={input.actions} onChange={v => set('actions', v)}
        catalogue={catalog.data?.actions ?? []} maxActions={limits.actions} disabled={readOnly} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-text-primary">{t('admin.rl_severity')}</label>
          <Combobox value={input.severity} onChange={v => set('severity', v as typeof input.severity)}
            options={SEVERITIES.map(s => ({ value: s, label: severityLabel(t, s) }))}
            disabled={readOnly} aria-label={t('admin.rl_severity')} />
          <p className="mt-1 text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
            {t('admin.rl_severity_hint')}
          </p>
        </div>
        <Input label={t('admin.rl_priority')} type="number" value={String(input.priority)}
          disabled={readOnly} onChange={e => set('priority', Number(e.target.value) || 0)}
          hint={t('admin.rl_priority_hint')} />
      </div>
    </div>
  )

  const scopePane = (
    <div className="flex min-w-0 flex-col gap-5">
      <ScopeEditor value={input.scope} onChange={v => set('scope', v)} dir={dir}
        maxRefs={limits.scope_refs} disabled={readOnly} />

      <Card title={t('admin.rl_threshold_title')} dense>
        <p className="mb-3 text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
          {t('admin.rl_threshold_hint')}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label={t('admin.rl_threshold_count')} type="number" min={2} disabled={readOnly}
            value={input.threshold_count === null ? '' : String(input.threshold_count)}
            onChange={e => set('threshold_count', e.target.value === '' ? null : Number(e.target.value))} />
          <Input label={t('admin.rl_threshold_window')} type="number" min={10} max={604800} disabled={readOnly}
            value={input.threshold_window_s === null ? '' : String(input.threshold_window_s)}
            onChange={e => set('threshold_window_s', e.target.value === '' ? null : Number(e.target.value))}
            hint={t('admin.rl_threshold_window_hint')} />
        </div>
      </Card>

      <Card title={t('admin.rl_rollout_title')} dense>
        <p className="mb-3 text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
          {t('admin.rl_rollout_hint')}
        </p>
        <Input type="number" min={0} max={100} disabled={readOnly}
          value={String(input.rollout_percent)} className="max-w-[8rem]"
          onChange={e => set('rollout_percent', Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
          aria-label={t('admin.rl_rollout_title')} />
      </Card>
    </div>
  )

  const modePane = (
    <div className="flex min-w-0 flex-col gap-4">
      <ModePicker value={input.mode} onChange={v => set('mode', v)}
        modes={catalog.data?.modes ?? ['inactive', 'simulate', 'monitor', 'enforce']}
        hasActions={input.actions.length > 0} disabled={readOnly} />
    </div>
  )

  const impactPane = (
    <ImpactPanel ruleId={ruleId} previous={detail.data?.backtests ?? []} />
  )

  const historyPane = (
    <div className="flex min-w-0 flex-col gap-2">
      {(detail.data?.versions ?? []).length === 0 && (
        <p className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
          {t('admin.rl_history_empty')}
        </p>
      )}
      {(detail.data?.versions ?? []).map(v => (
        <div key={v.version} className="rounded-lg border border-border bg-surface-0 px-3 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default" size="sm">v{v.version}</Badge>
            <span className="text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
              {formatWhen(v.created_at, i18n.language)}
            </span>
            <span className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
              {v.changed_by_label ?? t('admin.rl_history_unknown_author')}
            </span>
          </div>
          {v.change_note && (
            <p className="mt-1 text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>{v.change_note}</p>
          )}
        </div>
      ))}
    </div>
  )

  const PANES: Record<Pane, React.ReactNode> = {
    basics, conditions, actions: actionsPane, scope: scopePane,
    mode: modePane, impact: impactPane, history: historyPane,
  }

  // ── Chrome ─────────────────────────────────────────────────────────────────

  const wizardSteps: Pane[] = ['basics', 'conditions', 'actions', 'scope', 'mode']
  const steps: StepDef[] = wizardSteps.map(id => ({
    id,
    label: t(`admin.rl_pane_${id}`),
    status: id === 'basics' && !nameOk && pane !== 'basics' ? 'error' : undefined,
  }))

  const tabs = (['basics', 'conditions', 'actions', 'scope', 'mode', 'impact', 'history'] as Pane[])
    .map(id => ({ id, label: t(`admin.rl_pane_${id}`) }))

  const stepIndex = Math.max(0, wizardSteps.indexOf(pane))
  const busy = create.isPending || update.isPending

  const header = (
    <div className="mb-4 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
      <Button variant="ghost" size="sm" icon={<ArrowLeft size={15} />} onClick={onClose}>
        {t('admin.rl_back_to_list')}
      </Button>
      <h1 className="min-w-0 text-text-primary" style={{ fontSize: 'var(--kb-text-page)' }}>
        {isNew ? t('admin.rl_new_title') : (input.name || t('admin.rl_edit_title'))}
      </h1>
      {!isNew && detail.data && (
        <Badge variant="default" size="sm">v{detail.data.rule.version}</Badge>
      )}
      <div className="ms-auto flex items-center gap-2">
        {canWrite && (
          <Button variant="primary" size="sm" icon={isNew ? <Sparkles size={14} /> : <Save size={14} />}
            disabled={!canSave} loading={busy} onClick={save}>
            {isNew ? t('admin.rl_create') : t('admin.rl_save')}
          </Button>
        )}
      </div>
    </div>
  )

  if (catalog.isLoading || (!isNew && detail.isLoading)) {
    return <div className="py-10 text-center text-text-tertiary">{t('common.loading')}</div>
  }
  if (catalog.isError) {
    return <Callout variant="danger">{t('admin.rl_catalog_error')}</Callout>
  }

  return (
    <div className="min-w-0">
      {header}

      {readOnly && (
        <div className="mb-4">
          <Callout variant="info" title={t('admin.rl_readonly_title')}>{t('admin.rl_readonly_body')}</Callout>
        </div>
      )}
      {error && (
        <div className="mb-4">
          <Callout variant="danger" title={t('admin.rl_save_failed')}>{error}</Callout>
        </div>
      )}
      {/* Shown whichever pane is open: it is why the save button is greyed out,
          and an operator on the "Mode" step must not have to hunt for it. Each
          line is a refusal the server would return — a threshold that can never
          be met is exactly the state a console must not let somebody reach. */}
      {leafProblems.length > 0 && (
        <div className="mb-4">
          <Callout variant="danger" title={t('admin.rl_leaf_problems_title')}>
            <ul className="list-disc ps-4">
              {leafProblems.map((message, i) => <li key={i}>{message}</li>)}
            </ul>
          </Callout>
        </div>
      )}

      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0">
          {isNew ? (
            <Stepper
              steps={steps}
              current={stepIndex}
              onStepChange={id => setPane(id as Pane)}
              allowForward
              t={t}
            >
              <div className="pt-4">{PANES[pane]}</div>
            </Stepper>
          ) : (
            <>
              <Tabs tabs={tabs} value={pane} onChange={v => setPane(v as Pane)} size="sm" t={t} />
              <div className="pt-4">{PANES[pane]}</div>
            </>
          )}

          {isNew && (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Button variant="secondary" size="sm" disabled={stepIndex === 0}
                onClick={() => setPane(wizardSteps[Math.max(0, stepIndex - 1)])}>
                {t('admin.rl_step_prev')}
              </Button>
              {stepIndex < wizardSteps.length - 1 ? (
                <Button variant="secondary" size="sm"
                  onClick={() => setPane(wizardSteps[stepIndex + 1])}>
                  {t('admin.rl_step_next')}
                </Button>
              ) : (
                <Button variant="primary" size="sm" icon={<Check size={14} />}
                  disabled={!canSave} loading={busy} onClick={save}>
                  {t('admin.rl_create')}
                </Button>
              )}
            </div>
          )}
        </div>

        <RuleSummaryPanel input={{ ...input, conditions: wire }} tree={tree} ctx={summaryCtx}
          preview={preview} flat={isMobile} />
      </div>

      {/* On a phone the summary IS the condition surface, so it is repeated at
          the bottom of the conditions pane where the builder would have been. */}
      {isMobile && pane === 'conditions' && (
        <div className="mt-4 rounded-xl border border-border bg-surface-1 p-4">
          <RuleSentence input={{ ...input, conditions: wire }} tree={tree} ctx={summaryCtx} />
        </div>
      )}
    </div>
  )
}
