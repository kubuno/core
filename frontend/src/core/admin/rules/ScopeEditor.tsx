// Who a rule applies to.
//
// Two lists, and the asymmetry between them is the point: an empty `include`
// means the whole instance, and `exclude` ALWAYS wins. The exception an operator
// writes ("everyone in Support except the on-call account") must never be
// overridable by a broader inclusion added six months later, so the editor says
// so out loud rather than leaving it to be discovered.

import { useTranslation } from 'react-i18next'
import { Building2, Minus, Plus, User, Users } from 'lucide-react'
import { Badge, Button, Callout, Checkbox, Combobox, MenuDropdown, useMenuDropdown, type MenuItem } from '@ui'
import type { Scope, ScopeRef } from './types'
import type { Directory } from './useDirectory'

interface Props {
  value:     Scope
  onChange:  (next: Scope) => void
  dir:       Directory
  maxRefs:   number
  disabled?: boolean
}

type Bucket = 'include' | 'exclude'

function refKey(r: ScopeRef): string {
  return `${r.type}:${r.id}`
}

function RefRow({ r, dir, onRemove, onToggleDescendants, disabled }: {
  r: ScopeRef
  dir: Directory
  onRemove: () => void
  onToggleDescendants?: (v: boolean) => void
  disabled?: boolean
}) {
  const { t } = useTranslation()
  const Glyph = r.type === 'org_unit' ? Building2 : r.type === 'group' ? Users : User
  const name = r.type === 'org_unit' ? dir.unitName(r.id)
    : r.type === 'group' ? dir.groupName(r.id)
    : dir.userName(r.id)

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2 rounded-md border border-border bg-surface-0 px-2.5 py-1.5">
      <Glyph size={14} className="shrink-0 text-text-tertiary" aria-hidden />
      <span className="min-w-0 truncate text-text-primary">{name ?? r.id}</span>
      <Badge variant="default" size="sm">{t(`admin.rl_ref_kind_${r.type}`)}</Badge>
      {r.type === 'org_unit' && onToggleDescendants && (
        <Checkbox
          checked={r.descendants !== false}
          onChange={v => onToggleDescendants(v)}
          disabled={disabled}
          label={t('admin.rl_scope_descendants')}
          // Same reason as in the detector leaf: the primitive's default label
          // colour is a literal, unreadable on a dark theme.
          labelClassName="text-text-primary"
        />
      )}
      {!disabled && (
        <Button variant="ghost" size="sm" className="ms-auto" aria-label={t('admin.rl_scope_remove')}
          icon={<Minus size={14} />} onClick={onRemove} />
      )}
    </div>
  )
}

export default function ScopeEditor({ value, onChange, dir, maxRefs, disabled }: Props) {
  const { t } = useTranslation()
  const includeMenu = useMenuDropdown()
  const excludeMenu = useMenuDropdown()

  const total = (value.include?.length ?? 0) + (value.exclude?.length ?? 0)
  const full = total >= maxRefs

  const add = (bucket: Bucket, ref: ScopeRef) => {
    const list = value[bucket] ?? []
    if (list.some(r => refKey(r) === refKey(ref))) return
    onChange({ ...value, [bucket]: [...list, ref] })
  }
  const remove = (bucket: Bucket, key: string) =>
    onChange({ ...value, [bucket]: (value[bucket] ?? []).filter(r => refKey(r) !== key) })

  const buildMenu = (bucket: Bucket): MenuItem[] => {
    const used = new Set([...(value[bucket] ?? [])].map(refKey))
    const units = dir.units.filter(u => !used.has(`org_unit:${u.id}`))
    const groups = dir.groups.filter(g => !used.has(`group:${g.id}`))
    const items: MenuItem[] = []
    if (units.length) {
      items.push({ type: 'label', text: t('admin.rl_ref_kind_org_unit') })
      for (const u of units.slice(0, 40)) {
        items.push({
          type: 'action', label: u.name, disabled: full,
          onClick: () => add(bucket, { type: 'org_unit', id: u.id, descendants: true }),
        })
      }
    }
    if (groups.length) {
      items.push({ type: 'separator' })
      items.push({ type: 'label', text: t('admin.rl_ref_kind_group') })
      for (const g of groups.slice(0, 40)) {
        items.push({
          type: 'action', label: g.name, disabled: full,
          onClick: () => add(bucket, { type: 'group', id: g.id }),
        })
      }
    }
    if (items.length === 0) items.push({ type: 'label', text: t('admin.rl_scope_nothing_to_add') })
    return items
  }

  const userOptions = dir.users.map(u => ({
    value: u.id,
    label: u.display_name || u.username,
    description: u.email,
    keywords: `${u.username} ${u.email}`,
  }))

  const Bucket = ({ bucket, menu }: { bucket: Bucket; menu: ReturnType<typeof useMenuDropdown> }) => (
    <div className="min-w-0">
      <div className="mb-1.5 flex flex-wrap items-center gap-2">
        <h4 className="text-text-primary">{t(`admin.rl_scope_${bucket}`)}</h4>
        <span className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
          {t(`admin.rl_scope_${bucket}_hint`)}
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        {(value[bucket] ?? []).map(r => (
          <RefRow key={refKey(r)} r={r} dir={dir} disabled={disabled}
            onRemove={() => remove(bucket, refKey(r))}
            onToggleDescendants={r.type === 'org_unit'
              ? (v => onChange({
                ...value,
                [bucket]: (value[bucket] ?? []).map(x =>
                  refKey(x) === refKey(r) && x.type === 'org_unit' ? { ...x, descendants: v } : x),
              }))
              : undefined} />
        ))}
      </div>
      {!disabled && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" icon={<Plus size={14} />} disabled={full}
            onClick={e => menu.open(e)}>
            {t('admin.rl_scope_add_unit_group')}
          </Button>
          <Combobox
            value={null}
            onChange={id => add(bucket, { type: 'user', id })}
            options={userOptions}
            placeholder={t('admin.rl_scope_add_user')}
            disabled={full || userOptions.length === 0}
            width={240}
            aria-label={t('admin.rl_scope_add_user')}
          />
        </div>
      )}
      {menu.pos && <MenuDropdown pos={menu.pos} items={buildMenu(bucket)} onClose={menu.close} />}
    </div>
  )

  return (
    <div className="flex min-w-0 flex-col gap-5">
      {dir.denied && (
        <Callout variant="warning">{t('admin.rl_scope_directory_denied')}</Callout>
      )}
      {(value.include?.length ?? 0) === 0 && (
        <Callout variant="info">{t('admin.rl_scope_everyone_note')}</Callout>
      )}

      <Bucket bucket="include" menu={includeMenu} />
      <Bucket bucket="exclude" menu={excludeMenu} />

      <p className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
        {t('admin.rl_scope_counter', { used: total, max: maxRefs })} · {t('admin.rl_scope_exclusion_wins')}
      </p>
    </div>
  )
}
