// Automation ▸ Rules — the inventory.
//
// ── What the list is for ─────────────────────────────────────────────────────
// Answering, at a glance, the two questions an operator arrives with: what is
// armed right now, and what has it been doing. So the mode is the loudest column
// on the row, the one mode that ACTS is the only one painted as a danger, and
// the recent-run count sits next to it.
//
// ── Writing a rule is not "administering" ────────────────────────────────────
// Reads need `core.rules.read`; every write needs `core.rules.manage`, which no
// seeded role holds. That is not an oversight: a rule can suspend accounts and
// revoke sessions, at machine speed, over a population its author describes
// rather than names. The console mirrors the split — a reader sees everything
// and can run a backtest (which acts on nobody), and is offered no verb that
// arms anything.

import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertTriangle, Copy, FlaskConical, ListChecks, Pencil, Play, Plus, Power, ScrollText, Trash2,
} from 'lucide-react'
import {
  Badge, Button, Callout, ConfirmDialog, Combobox, DataTable, EmptyState, Input, useToast,
  type DataTableColumn, type DataTableRowAction,
} from '@ui'
import { Search, X } from 'lucide-react'
import { PRIV } from '../../authz/types'
import { usePrivileges } from '../../authz/usePrivileges'
import { useConfirm } from '../../hooks/useConfirm'
import { adminUrl, useAdminAction } from '../adminAction'
import type { AdminSectionProps } from '../sections/registry'
import { formatAgo, formatWhen } from '../sections/format'
import RuleEditor, { type Pane } from './RuleEditor'
import ExecutionsPanel from './ExecutionsPanel'
import {
  useCreateRule, useDeleteRule, useExecutions, useRuleCatalog, useRules, useSetRuleMode,
} from './api'
import { MODE_ORDER, modeLabel, modeVariant, severityLabel, severityVariant } from './labels'
import { ruleToInput, type Mode, type Rule } from './types'

/**
 * How many recent runs the counter is computed over.
 *
 * The API offers no per-rule run counter, so the console counts the rows it
 * loaded — and the column header says over how many, because "3" and "3 of the
 * last 200" are not the same claim.
 */
const RECENT_WINDOW = 200

export default function RulesSection({ params, navigate }: AdminSectionProps) {
  const { t, i18n } = useTranslation()
  const { can } = usePrivileges()
  const toast = useToast()
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm()

  const canWrite = can(PRIV.RULES_MANAGE)

  const openId  = params.get('rule')
  const creating = params.get('new') === '1'
  const pane = (params.get('pane') as Pane | null) ?? undefined

  const [q, setQ] = useState('')
  const [modeFilter, setModeFilter] = useState('')
  const [moduleFilter, setModuleFilter] = useState('')

  const { data, isLoading, isError, refetch } = useRules(!openId && !creating)
  const catalog = useRuleCatalog()
  const recent = useExecutions({ limit: RECENT_WINDOW }, !openId && !creating)
  const setMode = useSetRuleMode()
  const remove = useDeleteRule()
  const create = useCreateRule()

  // Verbs this section claims, so a link from the search or an alert lands on
  // the surface that performs the task rather than on the page.
  useAdminAction('create', () => navigate(adminUrl({ tab: 'rules', params: { new: 1 } })))
  useAdminAction('simulate', id => { if (id) armSimulation(id) })
  useAdminAction('impact', id => { if (id) navigate(adminUrl({ tab: 'rules', params: { rule: id, pane: 'impact' } })) })

  const recentCount = useMemo(() => {
    const m = new Map<string, number>()
    for (const e of recent.data ?? []) m.set(e.rule_id, (m.get(e.rule_id) ?? 0) + 1)
    return m
  }, [recent.data])

  const triggerLabel = useMemo(() => {
    const m = new Map<string, string>()
    for (const x of catalog.data?.triggers ?? []) m.set(x.key, x.label)
    return m
  }, [catalog.data])

  const rules = data?.rules ?? []

  const modules = useMemo(
    () => [...new Set(rules.map(r => r.trigger.split('.')[0]))].sort(),
    [rules],
  )

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return rules.filter(r => {
      if (modeFilter && r.mode !== modeFilter) return false
      if (moduleFilter && !r.trigger.startsWith(`${moduleFilter}.`)) return false
      if (!needle) return true
      return r.name.toLowerCase().includes(needle)
        || (r.description ?? '').toLowerCase().includes(needle)
        || r.trigger.toLowerCase().includes(needle)
    })
  }, [rules, q, modeFilter, moduleFilter])

  function armSimulation(id: string) {
    setMode.mutate({ id, mode: 'simulate', change_note: 'Passage en simulation depuis la console' }, {
      onSuccess: () => toast.success(t('admin.rl_toast_simulating')),
      onError:   () => toast.error(t('admin.rl_toast_mode_failed')),
    })
  }

  const toggleMode = (rule: Rule) => {
    // Never straight to `enforce` from a menu: re-arming a rule that acts is a
    // decision taken in the editor, in front of the mode descriptions.
    const next: Mode = rule.mode === 'inactive' ? 'simulate' : 'inactive'
    setMode.mutate({ id: rule.id, mode: next }, {
      onSuccess: () => toast.success(t(next === 'inactive' ? 'admin.rl_toast_disabled' : 'admin.rl_toast_simulating')),
      onError:   () => toast.error(t('admin.rl_toast_mode_failed')),
    })
  }

  const duplicate = (rule: Rule) => {
    const input = ruleToInput(rule)
    create.mutate(
      // A copy is born inactive whatever the original was doing: duplicating a
      // rule must never be a way to arm a second one by accident.
      { ...input, name: t('admin.rl_copy_name', { name: rule.name }), mode: 'inactive' },
      {
        onSuccess: () => toast.success(t('admin.rl_toast_duplicated')),
        onError:   () => toast.error(t('admin.rl_toast_duplicate_failed')),
      },
    )
  }

  const askDelete = async (rule: Rule) => {
    const ok = await confirm({
      title: t('admin.rl_delete_title'),
      message: t('admin.rl_delete_body', { name: rule.name }),
      confirmLabel: t('common.delete'),
      variant: 'danger',
    })
    if (!ok) return
    remove.mutate(rule.id, {
      onSuccess: () => toast.success(t('admin.rl_toast_deleted')),
      onError:   () => toast.error(t('admin.rl_toast_delete_failed')),
    })
  }

  if (creating || openId) {
    return (
      <RuleEditor
        ruleId={creating ? null : openId}
        initialPane={pane}
        canWrite={canWrite}
        onClose={() => navigate(adminUrl({ tab: 'rules' }))}
      />
    )
  }

  const columns: DataTableColumn<Rule>[] = [
    {
      id: 'name',
      header: t('admin.rl_col_name'),
      primary: true,
      required: true,
      minWidth: 220,
      cell: r => (
        <div className="min-w-0">
          <div className="line-clamp-2 whitespace-normal break-words text-text-primary">{r.name}</div>
          {r.description && (
            <div className="line-clamp-2 whitespace-normal break-words text-text-tertiary"
              style={{ fontSize: 'var(--kb-text-meta)' }}>
              {r.description}
            </div>
          )}
        </div>
      ),
      sortValue: r => r.name,
    },
    {
      id: 'mode',
      header: t('admin.rl_col_mode'),
      width: 150,
      cell: r => (
        <Badge variant={modeVariant(r.mode)} size="sm">
          {r.mode === 'simulate' && <FlaskConical size={10} />}
          {r.mode === 'enforce' && <AlertTriangle size={10} />}
          {modeLabel(t, r.mode)}
        </Badge>
      ),
      sortValue: r => MODE_ORDER.indexOf(r.mode),
    },
    {
      id: 'trigger',
      header: t('admin.rl_col_trigger'),
      width: 190,
      cell: r => (
        <span className="truncate text-text-secondary">{triggerLabel.get(r.trigger) ?? r.trigger}</span>
      ),
      sortValue: r => triggerLabel.get(r.trigger) ?? r.trigger,
    },
    {
      id: 'module',
      header: t('admin.rl_col_module'),
      width: 110,
      cell: r => <Badge variant="default" size="sm">{r.trigger.split('.')[0]}</Badge>,
      sortValue: r => r.trigger.split('.')[0],
    },
    {
      id: 'actions',
      header: t('admin.rl_col_actions'),
      width: 90,
      align: 'right',
      cell: r => <span className="tabular-nums text-text-secondary">{r.actions.length}</span>,
      sortValue: r => r.actions.length,
    },
    {
      id: 'severity',
      header: t('admin.rl_col_severity'),
      width: 110,
      cell: r => (
        <Badge variant={severityVariant(r.severity)} size="sm">{severityLabel(t, r.severity)}</Badge>
      ),
      sortValue: r => ({ critical: 0, warning: 1, info: 2 } as Record<string, number>)[r.severity] ?? 3,
    },
    {
      id: 'recent',
      header: t('admin.rl_col_recent'),
      headerText: t('admin.rl_col_recent'),
      width: 110,
      align: 'right',
      cell: r => (
        <span className="tabular-nums text-text-secondary" title={t('admin.rl_col_recent_hint', { n: RECENT_WINDOW })}>
          {recentCount.get(r.id) ?? 0}
        </span>
      ),
      sortValue: r => recentCount.get(r.id) ?? 0,
    },
    {
      id: 'updated',
      header: t('admin.rl_col_updated'),
      width: 150,
      cell: r => (
        <span className="whitespace-nowrap text-text-secondary" title={formatWhen(r.updated_at, i18n.language)}>
          {formatAgo(r.updated_at)}
        </span>
      ),
      sortValue: r => new Date(r.updated_at),
    },
  ]

  const rowActions: DataTableRowAction<Rule>[] = [
    {
      id: 'edit',
      label: canWrite ? t('admin.rl_action_edit') : t('admin.rl_action_open'),
      icon: <Pencil size={15} />,
      onClick: r => navigate(adminUrl({ tab: 'rules', params: { rule: r.id } })),
    },
    {
      id: 'impact',
      label: t('admin.rl_action_impact'),
      icon: <Play size={15} />,
      onClick: r => navigate(adminUrl({ tab: 'rules', params: { rule: r.id, pane: 'impact' } })),
    },
    {
      id: 'log',
      label: t('admin.rl_action_log'),
      icon: <ScrollText size={15} />,
      onClick: r => navigate(adminUrl({ tab: 'rules-log', params: { rule: r.id } })),
    },
    ...(canWrite ? [
      {
        id: 'simulate',
        label: t('admin.rl_action_simulate'),
        icon: <FlaskConical size={15} />,
        onClick: (r: Rule) => armSimulation(r.id),
        hidden: (r: Rule) => r.mode === 'simulate',
      },
      {
        id: 'toggle',
        label: t('admin.rl_action_toggle'),
        icon: <Power size={15} />,
        onClick: (r: Rule) => toggleMode(r),
      },
      {
        id: 'duplicate',
        label: t('admin.rl_action_duplicate'),
        icon: <Copy size={15} />,
        onClick: (r: Rule) => duplicate(r),
      },
      {
        id: 'delete',
        label: t('common.delete'),
        icon: <Trash2 size={15} />,
        danger: true,
        onClick: (r: Rule) => void askDelete(r),
      },
    ] : []),
  ]

  const anyFilter = !!(q || modeFilter || moduleFilter)

  const toolbar = (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <Input value={q} onChange={e => setQ(e.target.value)} placeholder={t('admin.rl_search_ph')}
        leftIcon={<Search size={15} />} className="w-52 pl-9" />
      <Combobox
        value={modeFilter}
        onChange={setModeFilter}
        options={[
          { value: '', label: t('admin.rl_filter_all_modes') },
          ...MODE_ORDER.map(m => ({ value: m, label: modeLabel(t, m) })),
        ]}
        width={170}
        aria-label={t('admin.rl_filter_all_modes')}
      />
      <Combobox
        value={moduleFilter}
        onChange={setModuleFilter}
        options={[
          { value: '', label: t('admin.rl_filter_all_modules') },
          ...modules.map(m => ({ value: m, label: m })),
        ]}
        width={160}
        aria-label={t('admin.rl_filter_all_modules')}
      />
      {anyFilter && (
        <Button variant="ghost" size="sm" icon={<X size={14} />}
          onClick={() => { setQ(''); setModeFilter(''); setModuleFilter('') }}>
          {t('admin.rl_reset_filters')}
        </Button>
      )}
    </div>
  )

  const armed = rules.filter(r => r.mode === 'enforce').length
  const simulating = rules.filter(r => r.mode === 'simulate').length

  return (
    <div className="min-w-0">
      <div className="mb-4 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
        <h1 className="min-w-0 text-text-primary" style={{ fontSize: 'var(--kb-text-page)' }}>
          {t('admin.nav_rules')}
        </h1>
        {data && (
          <span className="text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
            {t('admin.rl_counts', { count: rules.length, armed, simulating })}
          </span>
        )}
        <div className="ms-auto flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={<ScrollText size={14} />}
            onClick={() => navigate(adminUrl({ tab: 'rules-log' }))}>
            {t('admin.nav_rules_log')}
          </Button>
          {canWrite && (
            <Button variant="primary" size="sm" icon={<Plus size={14} />}
              onClick={() => navigate(adminUrl({ tab: 'rules', params: { new: 1 } }))}>
              {t('admin.rl_new')}
            </Button>
          )}
        </div>
      </div>

      {/* The engine can be switched off instance-wide; a list of armed rules
          that are not running is the most dangerous thing this page could show
          without saying so. */}
      {data && !data.engine_enabled && (
        <div className="mb-3">
          <Callout variant="warning" title={t('admin.rl_engine_off_title')}>
            {t('admin.rl_engine_off_body')}
          </Callout>
        </div>
      )}
      {data && data.indexed < rules.filter(r => r.mode !== 'inactive').length && (
        <div className="mb-3">
          <Callout variant="info">
            {t('admin.rl_indexed_note', {
              count: data.indexed,
              active: rules.filter(r => r.mode !== 'inactive').length,
            })}
          </Callout>
        </div>
      )}
      {!canWrite && (
        <div className="mb-3">
          <Callout variant="info" title={t('admin.rl_readonly_title')}>{t('admin.rl_readonly_body')}</Callout>
        </div>
      )}

      <DataTable
        rows={rows}
        columns={columns}
        rowKey={r => r.id}
        loading={isLoading}
        error={isError ? t('admin.rl_list_error') : undefined}
        onRetry={() => void refetch()}
        filtered={anyFilter}
        onClearFilters={() => { setQ(''); setModeFilter(''); setModuleFilter('') }}
        toolbar={toolbar}
        rowActions={rowActions}
        onRowClick={r => navigate(adminUrl({ tab: 'rules', params: { rule: r.id } }))}
        configurableColumns
        pageSize={25}
        t={t}
        emptyState={
          <EmptyState
            icon={<ListChecks size={26} />}
            variant="first-use"
            title={t('admin.rl_empty_title')}
            description={t('admin.rl_empty_desc')}
            action={canWrite ? {
              label: t('admin.rl_new'),
              icon: <Plus size={14} />,
              onClick: () => navigate(adminUrl({ tab: 'rules', params: { new: 1 } })),
            } : undefined}
          />
        }
      />

      {confirmState && (
        <ConfirmDialog {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} />
      )}
    </div>
  )
}

/** The run log as its own place, so it is findable rather than buried. */
export function RulesLogSection({ params }: AdminSectionProps) {
  return <ExecutionsPanel ruleId={params.get('rule')} />
}
