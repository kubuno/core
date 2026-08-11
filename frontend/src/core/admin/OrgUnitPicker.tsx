import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { ChevronRight, Plus, Search } from 'lucide-react'
import { Input, foldIncludes } from '@ui'
import { FloatingWindow } from '@ui/FloatingWindow'
import type { OrgUnit } from '../types'

/** Deepest nesting this picker will walk. A parent cycle is refused server-side,
 *  but a tree that already holds one must not freeze the console — the same
 *  bound `orgUnitPath` (settings/scopeTypes.ts) puts on its own walk. */
const MAX_DEPTH = 32

const ouChildren = (units: OrgUnit[], parentId: string | null) =>
  units.filter(u => u.parent_id === parentId).sort((a, b) => a.name.localeCompare(b.name))

/** "Kubuno / Équipe support" — the ancestors of a unit, root first, itself excluded. */
function ouPath(units: OrgUnit[], unit: OrgUnit): string {
  const names: string[] = []
  const byId = new Map(units.map(u => [u.id, u]))
  let cur = unit.parent_id ? byId.get(unit.parent_id) : undefined
  // Bounded walk: a cycle is refused server-side, but a corrupted tree must not
  // freeze the picker.
  for (let i = 0; cur && i < 64; i++) {
    names.unshift(cur.name)
    cur = cur.parent_id ? byId.get(cur.parent_id) : undefined
  }
  return names.join(' / ')
}

/** A unit matches when its own name does, or any of its ancestors' — searching
 *  "support" must surface "Support N1" even though the word is only in its parent. */
function ouMatches(units: OrgUnit[], unit: OrgUnit, needle: string): boolean {
  return foldIncludes(`${unit.name} ${ouPath(units, unit)}`, needle)
}

// Floating tree picker to select an organizational unit, with inline "add
// sub-unit". Shared by the role assignment flow and the OU manager.
export default function OrgUnitPicker({
  title, currentId, excludeId, onSelect, onClose,
}: {
  title: string
  currentId: string | null
  excludeId?: string          // hide this subtree (e.g. when moving a unit into a parent)
  onSelect: (id: string) => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { data } = useQuery({
    queryKey: ['admin-org-units'],
    queryFn: () => api.get<{ org_units: OrgUnit[] }>('/admin/org-units').then(r => r.data.org_units),
    staleTime: 30_000,
  })
  const units = data ?? []
  const root  = units.find(u => u.parent_id === null)
  const [sel, setSel]           = useState<string | null>(currentId ?? null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [addUnder, setAddUnder] = useState<string | null>(null)
  const [name, setName]         = useState('')
  const [needle, setNeedle]     = useState('')
  const [createError, setCreateError] = useState('')
  const treeRef = useRef<HTMLDivElement>(null)

  useEffect(() => { if (root) { setExpanded(s => new Set(s).add(root.id)); setSel(p => p ?? root.id) } }, [root])

  const create = useMutation({
    mutationFn: (p: { name: string; parent_id: string }) => api.post<{ org_unit: OrgUnit }>('/admin/org-units', p).then(r => r.data.org_unit),
    onSuccess: (u) => { setAddUnder(null); setName(''); setCreateError(''); if (u.parent_id) setExpanded(s => new Set(s).add(u.parent_id!)); setSel(u.id); qc.invalidateQueries({ queryKey: ['admin-org-units'] }) },
    // Both shapes: the API client rejects with a FLAT `{ message, code }`
    // (`normalizeError`, api/client.ts), so reading `response.data.message`
    // alone loses "a unit named X already exists under the same parent".
    onError: (err) => {
      const e = err as { message?: string; response?: { data?: { message?: string } } }
      setCreateError(e?.response?.data?.message ?? e?.message ?? t('admin.ou_create_error'))
    },
  })
  const toggle = (id: string) => setExpanded(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })

  // The VISIBLE rows, flattened once. Recursing at render time is what let a
  // cycle in the data spin forever; a bounded walk cannot, and the flat list is
  // also what the arrow keys need to move through the tree.
  const visible: { u: OrgUnit; depth: number; kids: number }[] = []
  const walk = (u: OrgUnit, depth: number) => {
    if (depth > MAX_DEPTH || u.id === excludeId) return
    const kids = ouChildren(units, u.id)
    visible.push({ u, depth, kids: kids.length })
    if (expanded.has(u.id)) kids.forEach(c => walk(c, depth + 1))
  }
  if (root) walk(root, 0)

  /** Tree keyboard map (WAI-ARIA): up/down walk the visible rows, right opens a
   *  node or steps into it, left closes it or steps back to its parent. */
  const onTreeKey = (e: React.KeyboardEvent) => {
    const i = visible.findIndex(v => v.u.id === sel)
    const at = (n: number) => { const v = visible[n]; if (v) { setSel(v.u.id); e.preventDefault() } }
    switch (e.key) {
      case 'ArrowDown': at(i + 1); break
      case 'ArrowUp':   at(i - 1); break
      case 'Home':      at(0); break
      case 'End':       at(visible.length - 1); break
      case 'ArrowRight': {
        const cur = visible[i]
        if (!cur || cur.kids === 0) return
        if (!expanded.has(cur.u.id)) { toggle(cur.u.id); e.preventDefault() }
        else at(i + 1)
        break
      }
      case 'ArrowLeft': {
        const cur = visible[i]
        if (!cur) return
        if (cur.kids > 0 && expanded.has(cur.u.id)) { toggle(cur.u.id); e.preventDefault() }
        else if (cur.u.parent_id) {
          const p = visible.findIndex(v => v.u.id === cur.u.parent_id)
          if (p >= 0) at(p)
        }
        break
      }
      case 'Enter':
        if (sel) { onSelect(sel); onClose(); e.preventDefault() }
        break
    }
  }

  const renderRow = ({ u, depth, kids }: { u: OrgUnit; depth: number; kids: number }) => {
    const open = expanded.has(u.id)
    return (
      <div key={u.id}>
        <div
          role="treeitem"
          aria-level={depth + 1}
          aria-selected={sel === u.id}
          aria-expanded={kids > 0 ? open : undefined}
          // Roving tabindex: one stop for the whole tree, the arrows do the rest.
          tabIndex={sel === u.id ? 0 : -1}
          ref={el => { if (el && sel === u.id && treeRef.current?.contains(document.activeElement)) el.focus() }}
          onClick={() => setSel(u.id)}
          className={`flex items-center gap-1 rounded outline-none focus-visible:ring-2 focus-visible:ring-primary
                      ${sel === u.id ? 'bg-primary-light text-primary' : 'hover:bg-surface-2 text-text-primary'}`}
          style={{ paddingLeft: depth * 18 }}
        >
          <button
            type="button" tabIndex={-1} aria-hidden="true"
            onClick={e => { e.stopPropagation(); toggle(u.id) }}
            className="w-5 h-5 flex items-center justify-center text-text-tertiary shrink-0"
          >
            {kids > 0 && <ChevronRight size={14} className={`transition-transform ${open ? 'rotate-90' : ''}`} />}
          </button>
          <span className="flex-1 text-left text-sm px-2 py-1.5">{u.name}</span>
          <button
            type="button" tabIndex={-1}
            onClick={e => { e.stopPropagation(); setAddUnder(u.id); setName(''); setCreateError(''); setExpanded(s => new Set(s).add(u.id)) }}
            title={t('admin.ou_add')}
            className="p-1 text-text-tertiary hover:text-primary"
          >
            <Plus size={14} />
          </button>
        </div>
        {addUnder === u.id && (
          // Nothing is POSTed until this form is validated: the `+` used to send
          // the request on the spot, so a unit outlived the dialog that was
          // cancelled right after.
          <div className="py-1.5" style={{ paddingLeft: depth * 18 + 28 }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              <Input
                value={name}
                autoFocus
                onChange={e => setName(e.target.value)}
                onKeyDown={e => {
                  e.stopPropagation()
                  if (e.key === 'Enter' && name.trim()) create.mutate({ name: name.trim(), parent_id: u.id })
                  if (e.key === 'Escape') { setAddUnder(null); setCreateError('') }
                }}
                placeholder={t('admin.ou_name_ph')}
              />
              <button
                type="button"
                disabled={!name.trim() || create.isPending}
                onClick={() => create.mutate({ name: name.trim(), parent_id: u.id })}
                className="text-sm text-primary disabled:opacity-40 whitespace-nowrap"
              >
                {t('admin.ou_create')}
              </button>
              <button
                type="button"
                onClick={() => { setAddUnder(null); setCreateError('') }}
                className="text-sm text-text-tertiary whitespace-nowrap"
              >
                {t('admin.ou_cancel')}
              </button>
            </div>
            {createError && <p className="text-sm text-danger mt-1">{createError}</p>}
          </div>
        )}
      </div>
    )
  }

  // Search results are FLAT: a filtered tree either hides the matches whose
  // parents do not match, or forces every ancestor open, and both read as noise.
  // Each row carries its path instead, so two units named "N1" stay tellable
  // apart. The excluded subtree is dropped here too — in tree mode a hidden node
  // takes its children with it, in a flat list nothing else would.
  const excluded = (u: OrgUnit): boolean => {
    if (!excludeId) return false
    const byId = new Map(units.map(x => [x.id, x]))
    let cur: OrgUnit | undefined = u
    for (let i = 0; cur && i < 64; i++) {
      if (cur.id === excludeId) return true
      cur = cur.parent_id ? byId.get(cur.parent_id) : undefined
    }
    return false
  }
  const results = needle.trim()
    ? units.filter(u => !excluded(u) && ouMatches(units, u, needle.trim()))
          .sort((a, b) => a.name.localeCompare(b.name))
    : []

  return (
    // The picker is usually opened FROM another FloatingWindow, and a portal's
    // events bubble along the React tree, not the DOM: without this stop, a click
    // inside the picker also reaches the parent window's "bring to front", which
    // then covers the picker and makes its own buttons unclickable.
    <div onMouseDown={e => e.stopPropagation()}>
      <FloatingWindow
        title={title}
        onClose={onClose}
        defaultWidth={420}
        backdrop
        t={t}
        actions={{
          confirm: {
            label:    t('admin.ou_done'),
            onClick:  () => { if (sel) { onSelect(sel); onClose() } },
            disabled: !sel,
          },
          cancel: { label: t('admin.ou_cancel') },
        }}
      >
        <div className="px-4 pt-4">
          <Input
            type="search"
            value={needle}
            onChange={e => setNeedle(e.target.value)}
            placeholder={t('admin.ou_search_ph')}
            leftIcon={<Search size={15} />}
          />
        </div>
        <div className="p-4 max-h-[55vh] overflow-y-auto">
          {needle.trim() ? (
            results.length === 0
              ? <p className="text-sm text-text-tertiary py-2">{t('admin.ou_no_results')}</p>
              : results.map(u => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setSel(u.id)}
                    className={`w-full text-left px-2 py-1.5 rounded ${sel === u.id ? 'bg-primary-light text-primary' : 'hover:bg-surface-2 text-text-primary'}`}
                  >
                    <span className="block text-sm">{u.name}</span>
                    {ouPath(units, u) && (
                      <span className="block text-xs text-text-tertiary">{ouPath(units, u)}</span>
                    )}
                  </button>
                ))
          ) : (
            root ? (
              <div
                ref={treeRef}
                role="tree"
                aria-label={title}
                onKeyDown={onTreeKey}
              >
                {visible.map(renderRow)}
              </div>
            ) : <p className="text-sm text-text-tertiary">…</p>
          )}
        </div>
      </FloatingWindow>
    </div>
  )
}
