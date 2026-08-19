// The scope tree of a module's settings page: WHO the values beside it apply to.
//
// It is a tree in the page and not a dropdown on purpose. The unit being
// configured qualifies every control beside it, and it has to stay legible
// while the operator scrolls a long form — a value picked in a menu that then
// closes is exactly how someone reconfigures the whole instance believing they
// touched one branch. Keeping the tree in view also makes the hierarchy
// readable, which is what makes "inherited from the parent" mean anything.
//
// It carries no chrome of its own: it is a SECTION of the module's side card
// (`ModuleSidePanel`), which owns the card, the fold and the heading. On a
// narrow screen that card sits above the settings rather than beside them, so
// the tree is reachable at every width without a second, window-shaped copy of
// itself.

import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Building2, ChevronRight, Search } from 'lucide-react'
import { Input, foldIncludes } from '@ui'
import { api } from '../../api/client'
import type { OrgUnit } from '../../types'
import { orgUnitPath, type ActiveScope } from './scopeTypes'

/** Deepest nesting walked. A cycle is refused server-side; a stored one must
 *  truncate the panel rather than freeze the console — same bound as
 *  `OrgUnitPicker` and `orgUnitPath`. */
const MAX_DEPTH = 32

/**
 * The one line at the top of the settings column that names what is being
 * edited.
 *
 * The tree beside it already shows the selection, but a tree shows it as a
 * highlighted row twelve rows down a scrollable panel — and the operator's eye
 * is on the form, not on the panel. Every value below this line belongs to the
 * scope it names, and it says which level the unfilled ones follow, because
 * "inherited" means nothing until it says inherited FROM WHAT.
 *
 * It shares `admin-org-units` with the panel: same key, same cache, no second
 * request.
 */
export function ScopeHeadline({ scope }: { scope: ActiveScope }) {
  const { t } = useTranslation()
  // The list is only ever read to spell out the PATH of an organisational unit.
  // On the instance scope there is no path to resolve, and that is the scope
  // every module without an `overridable` setting sits on permanently — asking
  // the server for a list nobody reads, on every one of those pages, is a
  // request that exists only to be discarded.
  const { data } = useQuery({
    enabled: scope.type === 'org_unit',
    queryKey: ['admin-org-units'],
    queryFn: () => api.get<{ org_units: OrgUnit[] }>('/admin/org-units').then(r => r.data.org_units),
    staleTime: 30_000,
  })
  const units = data ?? []
  const path  = orgUnitPath(units, scope.type === 'org_unit' ? scope.id : null)
  const self  = path[path.length - 1]
  const parent = path.length >= 2 ? path[path.length - 2] : null

  const isInstance = scope.type === 'instance' || !self

  return (
    <div className="mb-4 flex flex-wrap items-baseline gap-x-2 gap-y-1 border-b border-border pb-3">
      <span className="text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
        {t('admin.m_scope_applies_to', { defaultValue: 'Réglages appliqués à' })}
      </span>
      <span className="min-w-0 truncate font-medium text-text-primary"
        style={{ fontSize: 'var(--kb-text-body)' }}>
        {isInstance
          ? t('admin.m_scope_instance', { defaultValue: "Toute l'instance" })
          : self.name}
      </span>
      {!isInstance && (
        <span className="min-w-0 truncate text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
          {t('admin.m_scope_inherits_from', {
            parent: parent
              ? parent.name
              : t('admin.m_scope_instance', { defaultValue: "Toute l'instance" }),
            defaultValue: `— un réglage non remplacé suit ${parent ? parent.name : "toute l'instance"}`,
          })}
        </span>
      )}
    </div>
  )
}

/** Past this many units, scanning the tree by eye stops being the fast way in. */
const FILTER_THRESHOLD = 8

const childrenOf = (units: OrgUnit[], parentId: string | null) =>
  units.filter(u => u.parent_id === parentId).sort((a, b) => a.name.localeCompare(b.name))

export interface ScopeTreeProps {
  scope:    ActiveScope
  onChange: (next: ActiveScope) => void
  /** Units holding their own value for at least one setting of this page —
   *  marked with a dot, so a branch that diverges is findable without opening
   *  it. Empty is the normal case and shows nothing. */
  overriding?: Set<string>
}

export default function ScopeTree({ scope, onChange, overriding }: ScopeTreeProps) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [needle, setNeedle]     = useState('')

  const { data } = useQuery({
    queryKey: ['admin-org-units'],
    queryFn: () => api.get<{ org_units: OrgUnit[] }>('/admin/org-units').then(r => r.data.org_units),
    staleTime: 30_000,
  })
  const units = useMemo(() => data ?? [], [data])
  const root  = units.find(u => u.parent_id === null) ?? null

  // The branch leading to the selected unit is open on arrival: landing on a
  // scope whose row is folded out of sight would read as "nothing selected".
  const openPath = useMemo(() => {
    const ids = new Set<string>()
    if (root) ids.add(root.id)
    for (const u of orgUnitPath(units, scope.type === 'org_unit' ? scope.id : null)) ids.add(u.id)
    return ids
  }, [units, root, scope.type, scope.id])

  const isOpen = (id: string) => expanded.has(id) || openPath.has(id)
  const toggle = (id: string) =>
    setExpanded(prev => {
      const next = new Set(prev)
      // A row opened by the path has no entry of its own; closing it has to add
      // every other open id first, or the click would look ignored.
      if (isOpen(id)) { for (const o of openPath) next.add(o); next.delete(id) }
      else next.add(id)
      return next
    })

  // Flattened once, bounded: recursing at render time is what lets a cycle in
  // the data spin forever.
  const rows: { unit: OrgUnit; depth: number; kids: number }[] = []
  const walk = (u: OrgUnit, depth: number) => {
    if (depth > MAX_DEPTH) return
    const kids = childrenOf(units, u.id)
    rows.push({ unit: u, depth, kids: kids.length })
    if (isOpen(u.id)) kids.forEach(k => walk(k, depth + 1))
  }
  if (root) walk(root, 0)

  const filtering = needle.trim().length > 0
  // Results are FLAT and carry their path: a filtered tree either hides matches
  // whose parents do not match, or forces every ancestor open. Both read as noise.
  const results = filtering
    ? units
        .filter(u => foldIncludes(`${u.name} ${orgUnitPath(units, u.id).map(p => p.name).join(' ')}`, needle.trim()))
        .sort((a, b) => a.name.localeCompare(b.name))
    : []

  const isInstance = scope.type === 'instance'

  const rowClass = (selected: boolean) =>
    `flex w-full min-w-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-left transition-colors ${
      selected ? 'bg-primary-light text-primary' : 'text-text-primary hover:bg-surface-2'
    }`

  // ONE tree, not two lists side by side. The instance is a real level of the
  // chain — every unit resolves through it — so it is the ROOT of the tree and
  // the units hang under it. Painted as a sibling of the top unit it read as a
  // second, competing "everything" entry, and the operator had to work out
  // which of the two rows meant the whole instance.
  const instanceRow = (
    <div className="flex items-center">
      <span className="h-6 w-5 shrink-0" aria-hidden />
      <button
        type="button"
        onClick={() => onChange({ type: 'instance', id: null })}
        className={rowClass(isInstance)}
        aria-current={isInstance ? 'true' : undefined}
      >
        <Building2 size={15} className="shrink-0" />
        <span className="min-w-0 flex-1 truncate text-sm">
          {t('admin.m_scope_instance', { defaultValue: "Toute l'instance" })}
        </span>
      </button>
    </div>
  )

  return (
    <div aria-label={t('admin.m_scope_panel', { defaultValue: 'Portée des réglages' })}>
      {units.length > FILTER_THRESHOLD && (
        <div className="px-2 pt-2">
          <Input
            type="search"
            value={needle}
            onChange={e => setNeedle(e.target.value)}
            placeholder={t('admin.ou_search_ph', { defaultValue: 'Rechercher une unité…' })}
            leftIcon={<Search size={14} />}
          />
        </div>
      )}

      <div className="max-h-[50vh] space-y-0.5 overflow-y-auto p-2">
        {instanceRow}

        {filtering ? (
          results.length === 0 ? (
            <p className="px-2 py-2 text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
              {t('admin.ou_no_results', { defaultValue: 'Aucune unité' })}
            </p>
          ) : (
            results.map(u => (
              <button
                key={u.id}
                type="button"
                onClick={() => onChange({ type: 'org_unit', id: u.id })}
                className={rowClass(scope.type === 'org_unit' && scope.id === u.id)}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{u.name}</span>
                  <span className="block truncate text-text-tertiary" style={{ fontSize: 'var(--kb-text-micro)' }}>
                    {orgUnitPath(units, u.id).slice(0, -1).map(p => p.name).join(' / ')}
                  </span>
                </span>
              </button>
            ))
          )
        ) : (
          rows.map(({ unit, depth, kids }) => {
            const selected = scope.type === 'org_unit' && scope.id === unit.id
            const open = isOpen(unit.id)
            return (
              // `depth + 1`: the units hang under the instance row above.
              <div key={unit.id} className="flex items-center" style={{ paddingLeft: (depth + 1) * 12 }}>
                <button
                  type="button"
                  tabIndex={-1}
                  aria-hidden="true"
                  onClick={() => toggle(unit.id)}
                  className="flex h-6 w-5 shrink-0 items-center justify-center text-text-tertiary"
                >
                  {kids > 0 && (
                    <ChevronRight size={13} className={`transition-transform ${open ? 'rotate-90' : ''}`} />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ type: 'org_unit', id: unit.id })}
                  className={rowClass(selected)}
                  aria-current={selected ? 'true' : undefined}
                >
                  <span className="min-w-0 flex-1 truncate text-sm">{unit.name}</span>
                  {/* A branch that no longer follows its parent, named before
                      it is opened. */}
                  {overriding?.has(unit.id) && (
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                      title={t('admin.m_scope_has_overrides', {
                        defaultValue: 'Cette unité remplace au moins un réglage',
                      })}
                    />
                  )}
                </button>
              </div>
            )
          })
        )}
      </div>

      <p className="px-3 pb-2 leading-relaxed text-text-tertiary"
        style={{ fontSize: 'var(--kb-text-micro)' }}>
        {t('admin.m_scope_panel_hint', {
          defaultValue: "Une unité hérite des valeurs de son parent tant qu'elle ne les remplace pas.",
        })}
      </p>
    </div>
  )
}
