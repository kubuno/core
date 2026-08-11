// The actions a rule runs, and the form for their parameters.
//
// ── Generated from the schema, like ModuleAdminSettings ──────────────────────
// An action's parameters come from `params_schema` in the catalogue — name,
// type, label, whether it is required, and the closed domain of an enum. The
// controls below are built from that and nothing else, exactly the way
// ModuleAdminSettings builds a module's instance settings from its declarative
// schema. A module shipping a new action tomorrow gets a working form here
// without a line changing.
//
// Unknown parameters are refused server-side rather than ignored (silently
// dropping one means the rule does not do what its author read back), so the
// editor only ever sends keys the schema declares.

import { useTranslation } from 'react-i18next'
import { AlertTriangle, Plus, Trash2, Undo2 } from 'lucide-react'
import { Badge, Button, Combobox, Input, MenuDropdown, Toggle, useMenuDropdown, type MenuItem } from '@ui'
import type { ActionRow, ActionSpec, ParamDef } from './types'

interface Props {
  value:     ActionSpec[]
  onChange:  (next: ActionSpec[]) => void
  catalogue: ActionRow[]
  maxActions: number
  disabled?: boolean
}

function ParamControl({ param, value, onChange, disabled }: {
  param:    ParamDef
  value:    unknown
  onChange: (v: unknown) => void
  disabled?: boolean
}) {
  const { t } = useTranslation()

  if (param.type === 'bool') {
    return <Toggle checked={value === true} onChange={() => onChange(value !== true)} disabled={disabled} />
  }
  if (param.type === 'enum') {
    const options = (param.values ?? []).map(v => ({ value: String(v), label: String(v) }))
    return (
      <Combobox
        value={value === undefined || value === null ? null : String(value)}
        onChange={v => onChange(v)}
        options={options}
        placeholder={t('admin.rl_param_default')}
        clearable={!param.required}
        onClear={() => onChange(null)}
        disabled={disabled}
        width={220}
        aria-label={param.label}
      />
    )
  }
  return (
    <Input
      type={param.type === 'number' ? 'number' : 'text'}
      value={value === null || value === undefined ? '' : String(value)}
      onChange={e => onChange(param.type === 'number'
        ? (e.target.value === '' ? null : Number(e.target.value))
        : e.target.value)}
      disabled={disabled}
      className="max-w-md"
      aria-label={param.label}
    />
  )
}

export default function ActionsEditor({ value, onChange, catalogue, maxActions, disabled }: Props) {
  const { t } = useTranslation()
  const menu = useMenuDropdown()

  const available = catalogue.filter(a => !a.is_orphan)
  const full = value.length >= maxActions

  const addItems: MenuItem[] = available.map((a): MenuItem => ({
    type: 'action',
    label: a.label,
    disabled: full,
    onClick: () => onChange([...value, { action: a.key, params: {} }]),
  }))

  const setParam = (index: number, name: string, v: unknown) => {
    onChange(value.map((spec, i) => {
      if (i !== index) return spec
      const params = { ...spec.params }
      // A cleared optional parameter is removed, not sent as an empty string:
      // the server checks the declared domain and "" is in nobody's domain.
      if (v === null || v === undefined || v === '') delete params[name]
      else params[name] = v
      return { ...spec, params }
    }))
  }

  return (
    <div className="min-w-0">
      {value.length === 0 && (
        <p className="mb-3 text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
          {t('admin.rl_actions_empty')}
        </p>
      )}

      <div className="flex flex-col gap-3">
        {value.map((spec, index) => {
          const def = catalogue.find(a => a.key === spec.action)
          const schema: ParamDef[] = def?.params_schema ?? []
          return (
            <div key={`${spec.action}-${index}`} className="rounded-lg border border-border bg-surface-0 p-3">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="text-text-primary">{def?.label ?? spec.action}</span>
                <Badge variant="default" size="sm">{def?.module_id ?? '?'}</Badge>
                {def?.is_reversible
                  ? <Badge variant="success" size="sm"><Undo2 size={11} />{t('admin.rl_action_reversible')}</Badge>
                  : <Badge variant="warning" size="sm"><AlertTriangle size={11} />{t('admin.rl_action_irreversible')}</Badge>}
                {def?.is_blocking && <Badge variant="neutral" size="sm">{t('admin.rl_action_blocking')}</Badge>}
                {def?.is_orphan && <Badge variant="danger" size="sm">{t('admin.rl_action_orphan')}</Badge>}
                {!disabled && (
                  <Button variant="ghost" size="sm" className="ms-auto"
                    aria-label={t('admin.rl_action_remove')} icon={<Trash2 size={14} />}
                    onClick={() => onChange(value.filter((_, i) => i !== index))} />
                )}
              </div>
              {def?.description && (
                <p className="mt-1 text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
                  {def.description}
                </p>
              )}

              {schema.length > 0 && (
                <div className="mt-3 flex flex-col gap-2.5 border-t border-border pt-3">
                  {schema.map(p => (
                    <div key={p.name} className="flex min-w-0 flex-wrap items-center gap-3">
                      <label className="w-56 shrink-0 text-text-secondary"
                        style={{ fontSize: 'var(--kb-text-meta)' }}>
                        {p.label}
                        {p.required && <span className="ms-1 text-danger" aria-hidden>*</span>}
                      </label>
                      <div className="min-w-0 flex-1">
                        <ParamControl param={p} value={spec.params?.[p.name]}
                          onChange={v => setParam(index, p.name, v)} disabled={disabled} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {!disabled && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button variant="secondary" size="sm" icon={<Plus size={14} />}
            disabled={full || available.length === 0} onClick={e => menu.open(e)}>
            {t('admin.rl_action_add')}
          </Button>
          <span className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
            {t('admin.rl_actions_counter', { used: value.length, max: maxActions })}
          </span>
        </div>
      )}

      {menu.pos && <MenuDropdown pos={menu.pos} items={addItems} onClose={menu.close} />}
    </div>
  )
}
