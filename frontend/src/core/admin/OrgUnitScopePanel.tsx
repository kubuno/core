import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Building2 } from 'lucide-react'
import { Input, Checkbox, Radio, foldIncludes } from '@ui'
import type { OrgUnit } from '../types'
import { adminUrl } from './adminAction'

/** Deepest nesting the panel walks — the same bound `OrgUnitPicker` puts on its
 *  own walk. A parent cycle is refused server-side, but a tree that already
 *  holds one must not freeze the console. */
const MAX_DEPTH = 32

/**
 * What the accounts list is being asked to show.
 *
 * `descendants` is ours and deliberate: leaving "does a selected unit include
 * its sub-units?" implicit is the ambiguity that makes an operator read an empty
 * unit as a bug, when its three sub-units hold everyone.
 */
export interface OrgUnitScope {
  /** `all` ignores `unitIds`: the listing spans every unit the caller may see. */
  mode:        'all' | 'selected'
  unitIds:     string[]
  descendants: boolean
}

export const ALL_UNITS: OrgUnitScope = { mode: 'all', unitIds: [], descendants: true }

interface Props {
  units:    OrgUnit[]
  value:    OrgUnitScope
  onChange: (next: OrgUnitScope) => void
  /** Accounts per unit, own count only — the panel adds nothing up itself. */
  counts?:  Record<string, number>
  collapsed:          boolean
  onCollapsedChange:  (collapsed: boolean) => void
}

const childrenOf = (units: OrgUnit[], parentId: string | null) =>
  units.filter(u => u.parent_id === parentId).sort((a, b) => a.name.localeCompare(b.name))

/**
 * The organisational-unit panel that frames the accounts list.
 *
 * It does NOT navigate: it *scopes*. Everything downstream — the count, the bulk
 * bar, the export — reads the same scope, so what an operator acts on is always
 * what they are looking at. Structural work (create, rename, move, delete) lives
 * on the units page, one link away at the bottom: choosing a perimeter and
 * reshaping the hierarchy are different acts and should not share a surface.
 */
export function OrgUnitScopePanel({
  units, value, onChange, counts, collapsed, onCollapsedChange,
}: Props) {
  const { t } = useTranslation()
  const [needle, setNeedle]   = useState('')
  const [multi, setMulti]     = useState(false)
  const root = units.find(u => u.parent_id === null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggle = (id: string) =>
    setExpanded(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })

  // Searching keeps a unit that matches AND its ancestors: a match three levels
  // down is invisible if the branches above it are filtered away.
  const matching = useMemo(() => {
    const q = needle.trim()
    if (!q) return null
    const byId = new Map(units.map(u => [u.id, u]))
    const keep = new Set<string>()
    for (const u of units) {
      if (!foldIncludes(u.name, q)) continue
      keep.add(u.id)
      let parent = u.parent_id ? byId.get(u.parent_id) : undefined
      for (let i = 0; parent && i < MAX_DEPTH * 2; i++) {
        keep.add(parent.id)
        parent = parent.parent_id ? byId.get(parent.parent_id) : undefined
      }
    }
    return keep
  }, [units, needle])

  // Flattened once, bounded: recursing at render time is what let a cycle spin
  // forever. While searching every kept branch is open, or the matches stay
  // hidden behind collapsed parents.
  const rows: { u: OrgUnit; depth: number; kids: number }[] = []
  const walk = (u: OrgUnit, depth: number) => {
    if (depth > MAX_DEPTH) return
    if (matching && !matching.has(u.id)) return
    const kids = childrenOf(units, u.id).filter(c => !matching || matching.has(c.id))
    rows.push({ u, depth, kids: kids.length })
    if (matching || expanded.has(u.id) || depth === 0) kids.forEach(c => walk(c, depth + 1))
  }
  if (root) walk(root, 0)

  const selected = new Set(value.unitIds)

  /** Clicking a unit means "show me this one" — so it also leaves `all` mode.
   *  Leaving the radio behind would show a selection that changes nothing. */
  const pick = (id: string) => {
    if (multi) {
      const next = new Set(selected)
      next.has(id) ? next.delete(id) : next.add(id)
      onChange({ ...value, mode: next.size ? 'selected' : 'all', unitIds: [...next] })
    } else {
      onChange({ ...value, mode: 'selected', unitIds: [id] })
    }
  }

  if (collapsed) {
    return (
      <div className="sticky top-[52px] self-start shrink-0 w-11 bg-white rounded-xl border border-border flex flex-col items-center py-3 gap-2">
        <button
          type="button"
          onClick={() => onCollapsedChange(false)}
          title={t('admin.nav_org_units')}
          aria-label={t('admin.nav_org_units')}
          className="w-8 h-8 rounded-full flex items-center justify-center text-text-secondary hover:bg-surface-2"
        >
          <ChevronRight size={16} />
        </button>
        <Building2 size={16} className="text-text-tertiary" />
      </div>
    )
  }

  return (
    // Sticky, not merely tall: the panel is the frame the list is read through,
    // so it has to stay under the eye while the accounts scroll past. It sticks
    // inside the console's own scrolling area (nothing above it clips), and the
    // tree — the only part that can grow without bound — scrolls within it
    // rather than stretching the block past the viewport.
    //
    // `top-[52px]`, not 0: the breadcrumb bar of the console is itself sticky at
    // the top of that same scrolling area and stands 52px tall (measured), so a
    // panel pinned at 0 slides underneath it and loses its own header.
    <div className="sticky top-[52px] self-start shrink-0 w-[300px] bg-white rounded-xl border border-border
                    flex flex-col max-h-[calc(100vh-160px)]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-sm font-medium text-text-primary truncate">{t('admin.nav_org_units')}</h2>
        <button
          type="button"
          onClick={() => onCollapsedChange(true)}
          title={t('admin.ou_panel_collapse')}
          aria-label={t('admin.ou_panel_collapse')}
          className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-text-secondary hover:bg-surface-2"
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      {/* Scope, stated rather than inferred: the title of the list repeats it,
          because a bulk action or an export obeys THIS, not the whole directory. */}
      <div className="px-4 py-3 flex flex-col gap-2 border-b border-border">
        <Radio
          checked={value.mode === 'all'}
          onChange={() => onChange({ ...value, mode: 'all', unitIds: [] })}
          label={t('admin.filter_ou_all')}
        />
        <Radio
          checked={value.mode === 'selected'}
          onChange={() => onChange({ ...value, mode: 'selected' })}
          label={t('admin.ou_scope_selected')}
        />
      </div>

      <div className="px-3 pt-3">
        <Input
          type="search"
          value={needle}
          onChange={e => setNeedle(e.target.value)}
          placeholder={t('admin.ou_search_ph')}
        />
      </div>

      {/* Single replaces the selection, multiple accumulates it: holding two
          branches at once is the point — acting on "Sales" and "Marketing"
          without touching the rest, and without repeating the operation. */}
      <div className="px-3 pt-3">
        <div className="flex rounded-lg border border-border overflow-hidden text-sm">
          {([false, true] as const).map(m => (
            <button
              key={String(m)}
              type="button"
              onClick={() => {
                setMulti(m)
                // Narrowing back to one: keep the first, or the list would still
                // be scoped to units the panel no longer shows as chosen.
                if (!m && value.unitIds.length > 1) onChange({ ...value, unitIds: value.unitIds.slice(0, 1) })
              }}
              className={`flex-1 px-3 py-1.5 transition-colors ${
                multi === m ? 'bg-primary-light text-primary font-medium' : 'text-text-secondary hover:bg-surface-2'}`}
            >
              {m ? t('admin.ou_pick_multi') : t('admin.ou_pick_single')}
            </button>
          ))}
        </div>
      </div>

      {/* `min-h-0` is what actually lets this scroll: a flex child defaults to
          its content height, so without it the tree pushes the panel taller than
          the viewport and the footer link walks off screen. */}
      <div className="px-3 py-3 flex-1 min-h-0 overflow-y-auto" role="tree" aria-label={t('admin.nav_org_units')}>
        {rows.length === 0 && (
          <p className="text-sm text-text-tertiary px-1 py-2">{t('admin.ou_no_results')}</p>
        )}
        <div>
          {rows.map(({ u, depth, kids }) => {
            const open = !!matching || expanded.has(u.id) || depth === 0
            const isOn = selected.has(u.id)
            return (
              <div
                key={u.id}
                role="treeitem"
                aria-level={depth + 1}
                aria-selected={isOn}
                aria-expanded={kids > 0 ? open : undefined}
                onClick={() => pick(u.id)}
                className={`flex items-center gap-1 rounded cursor-pointer ${
                  isOn ? 'bg-primary-light text-primary' : 'hover:bg-surface-2 text-text-primary'}`}
                style={{ paddingLeft: depth * 16 }}
              >
                <button
                  type="button"
                  tabIndex={-1}
                  aria-hidden="true"
                  onClick={e => { e.stopPropagation(); toggle(u.id) }}
                  className="w-5 h-5 flex items-center justify-center text-text-tertiary shrink-0"
                >
                  {kids > 0 && !matching && (
                    <ChevronRight size={14} className={`transition-transform ${open ? 'rotate-90' : ''}`} />
                  )}
                </button>
                {multi && (
                  <span onClick={e => e.stopPropagation()} className="flex items-center">
                    <Checkbox checked={isOn} onChange={() => pick(u.id)} />
                  </span>
                )}
                <span className="flex-1 text-left text-sm px-1 py-1.5 truncate">{u.name}</span>
                {counts?.[u.id] !== undefined && (
                  <span className="text-xs text-text-tertiary pr-2 tabular-nums">{counts[u.id]}</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Only meaningful once a unit is picked: an "include sub-units" switch
          with nothing selected has nothing to include into. */}
      {value.mode === 'selected' && value.unitIds.length > 0 && (
        <div className="px-4 pb-3">
          <Checkbox
            checked={value.descendants}
            onChange={v => onChange({ ...value, descendants: v })}
            label={t('admin.filter_ou_descendants')}
            labelClassName="text-sm text-text-secondary"
          />
        </div>
      )}

      <div className="mt-auto border-t border-border px-4 py-3">
        <Link
          to={adminUrl({ tab: 'org-units' })}
          className="text-sm font-medium text-primary hover:underline"
        >
          {t('admin.ou_manage_title')}
        </Link>
      </div>
    </div>
  )
}
