// The condition-tree builder.
//
// ── What it is not ───────────────────────────────────────────────────────────
// It is not an expression editor. The vocabulary is closed server-side (an enum,
// deserialised by serde), so the builder can only ever offer nodes the engine
// accepts — and it offers them from the catalogue, never from a list baked in
// here: triggers come from the server, queryable fields come from the trigger,
// and the OPERATORS come from the field. Comparing a timestamp with
// `starts_with` is not merely refused at save time, it is never proposed.
//
// ── Ceilings are shown, not discovered ───────────────────────────────────────
// Depth and leaf count are capped server-side. The counters below are computed
// with the same arithmetic on the same wire tree, so an operator sees "4 / 5
// levels" before they add the fifth — instead of writing a rule for ten minutes
// and reading a 422.
//
// ── Leaf kinds are a registry ────────────────────────────────────────────────
// Nothing in this file knows what a leaf contains. A module registering a new
// leaf kind (a content detector with a confidence threshold, say) gets an editor
// row, a sentence in the summary and a verdict in the tester without a line
// changing here. See leafKinds.tsx.

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, ChevronRight, CircleSlash, Minus, Plus, Trash2, X } from 'lucide-react'
import { Badge, Button, Combobox, MenuDropdown, useMenuDropdown, type MenuItem } from '@ui'
import {
  addChild, flatten, newGroup, newLeaf, removeNode, toWire, updateNode, wireDepth, wireLeaves,
  type GroupOp, type UiGroup, type UiNode, type Verdict,
} from './condition'
import { leafKindOf, leafKinds, leafQuotas, type LeafContext } from './leafKinds'
import type { CondNode, RuleLimits } from './types'

interface Props {
  root:      UiGroup
  onChange:  (next: UiGroup) => void
  ctx:       LeafContext
  limits:    RuleLimits
  /** Verdicts of the last test run, by node id. Absent ⇒ no test has run. */
  verdicts?: Record<string, Verdict>
  disabled?: boolean
}

const GROUP_OPS: GroupOp[] = ['all', 'any', 'none']

/** Every leaf of the tree, as the wire carries it — what the quotas count. */
function leafNodesOf(root: UiGroup): CondNode[] {
  return flatten(root).flatMap(n => (n.kind === 'leaf' ? [n.node] : []))
}

/** Ring + tint per verdict. Tokens only — never a literal colour. */
function verdictSkin(v: Verdict | undefined): string {
  if (v === true)  return 'border-success bg-success-light'
  if (v === false) return 'border-danger bg-danger-light'
  return 'border-border bg-surface-1'
}

function VerdictMark({ v }: { v: Verdict | undefined }) {
  const { t } = useTranslation()
  if (v === undefined) return null
  if (v === 'unknown') {
    return (
      <span title={t('admin.rl_verdict_unknown_hint')}>
        <Badge variant="default" size="sm">{t('admin.rl_verdict_unknown')}</Badge>
      </span>
    )
  }
  return v
    ? <span className="inline-flex items-center gap-1 text-success" style={{ fontSize: 'var(--kb-text-micro)' }}>
        <Check size={13} />{t('admin.rl_verdict_true')}
      </span>
    : <span className="inline-flex items-center gap-1 text-danger" style={{ fontSize: 'var(--kb-text-micro)' }}>
        <X size={13} />{t('admin.rl_verdict_false')}
      </span>
}

// ── One node ─────────────────────────────────────────────────────────────────

function GroupNode({ node, root, onChange, ctx, limits, verdicts, disabled, depth }: Props & {
  node: UiGroup
  depth: number
}) {
  const { t } = useTranslation()
  const menu = useMenuDropdown()
  const kinds = leafKinds(ctx)

  // The wire depth this group already sits at, so "add a sub-group" can be
  // disabled BEFORE it produces a tree the server refuses.
  const wire = toWire(root)
  const currentDepth = wireDepth(wire)
  const currentLeaves = wireLeaves(wire)
  const roomForGroup = currentDepth < limits.condition_depth
  const roomForLeaf  = currentLeaves < limits.condition_leaves

  // Ceilings a single kind carries (a detector leaf costs a scan per content
  // part, so it has one of its own). Read from the registry, never enumerated.
  const quotas = leafQuotas(leafNodesOf(root), ctx, t)
  const quotaFull = (type: string) => {
    const q = quotas.find(x => x.type === type)
    return q ? q.used >= q.max : false
  }

  const opOptions = GROUP_OPS.map(op => ({ value: op, label: t(`admin.rl_group_${op}`) }))

  const addItems: MenuItem[] = [
    ...kinds.map((k): MenuItem => ({
      type: 'action',
      label: k.label(t),
      disabled: !roomForLeaf || quotaFull(k.type),
      onClick: () => onChange(addChild(root, node.id, newLeaf(k.create(ctx)))),
    })),
    { type: 'separator' },
    {
      type: 'action',
      label: t('admin.rl_add_group'),
      disabled: !roomForGroup,
      onClick: () => onChange(addChild(root, node.id, newGroup('all', []))),
    },
  ]

  return (
    <div className={`rounded-lg border p-2.5 ${verdictSkin(verdicts?.[node.id])}`}>
      <div className="mb-2 flex min-w-0 flex-wrap items-center gap-2">
        <Combobox
          value={node.op}
          onChange={v => onChange(updateNode(root, node.id, n =>
            n.kind === 'group' ? { ...n, op: v as GroupOp } : n))}
          options={opOptions}
          disabled={disabled}
          width={200}
          aria-label={t('admin.rl_group_operator')}
        />
        <span className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
          {t('admin.rl_group_count', { count: node.children.length })}
        </span>
        <div className="ms-auto flex items-center gap-2">
          <VerdictMark v={verdicts?.[node.id]} />
          {!disabled && (
            <>
              <Button variant="ghost" size="sm" icon={<Plus size={14} />}
                onClick={e => menu.open(e)}>
                {t('admin.rl_add')}
              </Button>
              {depth > 0 && (
                <Button variant="ghost" size="sm" aria-label={t('admin.rl_remove_group')}
                  icon={<Trash2 size={14} />}
                  onClick={() => onChange(removeNode(root, node.id))} />
              )}
            </>
          )}
        </div>
      </div>

      {node.children.length === 0 ? (
        <p className="px-1 py-2 text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
          {node.op === 'any' ? t('admin.rl_group_empty_any') : t('admin.rl_group_empty_all')}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {node.children.map(child => (
            <TreeNode key={child.id} node={child} root={root} onChange={onChange} ctx={ctx}
              limits={limits} verdicts={verdicts} disabled={disabled} depth={depth + 1} />
          ))}
        </div>
      )}

      {menu.pos && <MenuDropdown pos={menu.pos} items={addItems} onClose={menu.close} />}
    </div>
  )
}

function LeafNode({ node, root, onChange, ctx, verdicts, disabled }: Props & { node: UiNode }) {
  const { t } = useTranslation()
  if (node.kind !== 'leaf') return null
  const kind = leafKindOf(node.node)

  return (
    <div className={`flex min-w-0 flex-wrap items-center gap-2 rounded-lg border px-2.5 py-2 ${verdictSkin(verdicts?.[node.id])}`}>
      <ChevronRight size={14} className="shrink-0 text-text-tertiary" aria-hidden />
      {kind ? (
        <kind.Editor
          node={node.node}
          onChange={next => onChange(updateNode(root, node.id, n =>
            n.kind === 'leaf' ? { ...n, node: next } : n))}
          ctx={ctx}
          disabled={disabled}
        />
      ) : (
        // Somebody else's feature, not a corrupt tree: shown, preserved, and
        // never silently dropped on save.
        <span className="min-w-0 flex-1 truncate text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
          <CircleSlash size={13} className="me-1 inline align-[-2px]" aria-hidden />
          {t('admin.rl_leaf_unknown', { type: (node.node as { type?: string }).type ?? '?' })}
        </span>
      )}
      <div className="ms-auto flex shrink-0 items-center gap-2">
        <VerdictMark v={verdicts?.[node.id]} />
        {!disabled && (
          <Button variant="ghost" size="sm" aria-label={t('admin.rl_remove_condition')}
            icon={<Minus size={14} />} onClick={() => onChange(removeNode(root, node.id))} />
        )}
      </div>
    </div>
  )
}

function TreeNode(props: Props & { node: UiNode; depth: number }) {
  return props.node.kind === 'group'
    ? <GroupNode {...props} node={props.node} />
    : <LeafNode {...props} node={props.node} />
}

// ── The builder ──────────────────────────────────────────────────────────────

export default function ConditionTree({ root, onChange, ctx, limits, verdicts, disabled }: Props) {
  const { t } = useTranslation()

  const { depth, leaves, nodes } = useMemo(() => {
    const wire = toWire(root)
    return { depth: wireDepth(wire), leaves: wireLeaves(wire), nodes: flatten(root).length }
  }, [root])

  // One counter per kind that declares a ceiling of its own, shown from zero for
  // the same reason depth is: a ceiling discovered by hitting it is not shown.
  const quotas = useMemo(() => leafQuotas(leafNodesOf(root), ctx, t), [root, ctx, t])

  const depthFull  = depth >= limits.condition_depth
  const leavesFull = leaves >= limits.condition_leaves

  return (
    <div className="min-w-0">
      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1"
        style={{ fontSize: 'var(--kb-text-meta)' }}>
        <span className={depthFull ? 'text-warning' : 'text-text-tertiary'}>
          {t('admin.rl_depth_counter', { used: depth, max: limits.condition_depth })}
        </span>
        <span className={leavesFull ? 'text-warning' : 'text-text-tertiary'}>
          {t('admin.rl_leaves_counter', { used: leaves, max: limits.condition_leaves })}
        </span>
        {quotas.map(q => (
          <span key={q.type} className={q.used >= q.max ? 'text-warning' : 'text-text-tertiary'}>
            {q.label}
          </span>
        ))}
        <span className="text-text-tertiary">{t('admin.rl_nodes_counter', { count: nodes })}</span>
      </div>

      <TreeNode node={root} root={root} onChange={onChange} ctx={ctx} limits={limits}
        verdicts={verdicts} disabled={disabled} depth={0} />
    </div>
  )
}
