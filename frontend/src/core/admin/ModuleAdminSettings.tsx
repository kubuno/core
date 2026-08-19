// Instance-wide (admin) settings for a module, rendered INSIDE the admin console.
//
// Admins configure a module's instance settings here — they stay in the admin
// panel and are never navigated into the module's own shell. Driven by the
// module's declarative schema (`GET /modules/:id/config`); only `global` and
// `overridable` scopes are editable here (per-user settings live in the module).
//
// A module may legitimately declare NONE — `drive` and `media` do. The caller is
// what decides what to show then (see `ModuleAdminPage`), which is why the
// reading of the schema is exposed as a hook: the page must know there is
// nothing before it paints a heading promising something.
//
// A module may also declare a LOT: mail alone exposes fifty knobs across ten
// categories. Nothing here knows any of them. The schema drives everything —
// `advanced` folds the expert knobs away, `depends_on` hides what a switched-off
// feature does not need, `min`/`max` refuse a bad value before it is sent, and
// `risk` makes the console ask before something that can take the service down.
//
// ── The page, from left to right ─────────────────────────────────────────────
//   ┌────────────┬────────────────────────────────────────────┐
//   │ module     │ filter                                     │
//   │ side card  │ ┌────────────────────────────────────────┐ │
//   │ pages ▾    │ │ section ▾     n réglages · m remplacés  │ │
//   │ units ▾    │ ├──────────────┬─────────────────────────┤ │
//   │            │ │ appliqué à … │ ☐ réglage               │ │
//   │            │ │              │ ☑ réglage               │ │
//   │            │ ├──────────────┴─────────────────────────┤ │
//   └────────────┤ │              ANNULER    ENREGISTRER    │ │
//                │ └────────────────────────────────────────┘ │
//                └────────────────────────────────────────────┘
//
// The card on the left belongs to the PAGE (`ModuleAdminPage`), not to this
// panel: it holds the module's pages as well as its scope tree, and it has to
// stay on screen while this component is swapped from one page to the next.
// Which scope is selected therefore arrives as a prop — the tree that changes
// it lives in that card.
//
// ── Two writes, one panel ────────────────────────────────────────────────────
// Instance scope keeps the batched `PATCH /admin/settings`: one request, one
// audit transaction, and the module-bounds validation the route already runs.
// A unit scope writes one key at a time through `PUT /admin/settings/scoped/:key`
// — a scoped write names its scope, and a refusal on one key (a lock upstream)
// must not silently drop the others. Both land in the same place: the database
// mirrors `core.settings.value` and the instance row of `core.setting_values`
// onto each other (migration `000060`), so nothing depends on which door a value
// came through.
//
// ── One panel, two shapes ────────────────────────────────────────────────────
// A module that declares no PAGE (`[[setting_groups]]`) renders as a stack of
// foldable sections, one per `category`. That is almost every module.
//
// A module that declares pages is rendered one page at a time — the page is in
// the URL, it is a menu entry, and `category` becomes a TAB inside it. Fifty
// knobs stacked on one address is a wall; five addresses of ten is a panel.
//
// ── What stays whole across the pages ────────────────────────────────────────
// Two things refuse to be split, because splitting them is how an operator loses
// work or fails to find a setting:
//
//  • The PENDING EDITS. They live here, keyed by setting, for the whole module —
//    switching tab or page changes what is painted, never what is staged. Only
//    the WRITE is per section: each section's bar sends its own keys and clears
//    only those, so saving one section never commits, and never discards, what
//    was typed in another. What that costs is a change with no bar in front of
//    it (folded section, other tab, other page), which is why every bar keeps
//    saying how many are waiting outside it and how to get back to them.
//  • The FILTER. It searches the whole module and says where each hit lives —
//    "Filtrage ▸ Politique anti-spam" — and lets it be edited on the spot. Past
//    forty settings, typing what you came for is the main way in; a filter that
//    only searched the open tab would answer "no match" while the setting sits
//    two pages away.
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { Callout, ConfirmDialog, Input, Spinner, Tabs } from '@ui'
import { Search } from 'lucide-react'
import { useConfirm } from '../hooks/useConfirm'
import { adminPath } from './adminRoute'
import type { ModuleSettingGroup } from './adminModules'
import type { ModuleAdminSection } from '../slots/SlotRegistry'
import { findIcon } from '../utils/iconMap'
import ModuleSettingRow from './settings/ModuleSettingRow'
import { SettingRows } from './settings/SettingsBlocks'
import SettingSectionCard from './settings/SettingSectionCard'
import SettingsSaveBar from './settings/SettingsSaveBar'
import { ScopeHeadline } from './settings/ScopeTree'
import ScopeStatusPill from './settings/ScopeStatusPill'
import ProvenanceLine from './settings/ProvenanceLine'
import InheritanceChainWindow from './settings/InheritanceChainWindow'
import {
  hasScopableSettings, prefixedKey, useResolvedModuleSettings,
} from './settings/moduleScope'
import { INSTANCE_SCOPE, type ActiveScope, type ResolvedSetting } from './settings/scopeTypes'
import {
  isVisible, outOfRange, sameValue, type SettingItem,
} from './settings/moduleSettingSchema'

export type { SettingItem } from './settings/moduleSettingSchema'

/**
 * The settings of `moduleId` an ADMINISTRATOR may set — the instance-level ones.
 * Per-user scopes are filtered out here rather than in the view: "does this
 * module expose anything to administer" is a question about this list, and the
 * page asks it before rendering anything.
 */
export function useModuleInstanceSettings(moduleId: string, enabled = true) {
  const query = useQuery({
    queryKey: ['module-config', moduleId],
    queryFn:  () => api.get<{ settings: SettingItem[] }>(`/modules/${moduleId}/config`).then(r => r.data),
    enabled,
  })
  const items = useMemo(
    () => (query.data?.settings ?? []).filter(s => s.scope === 'global' || s.scope === 'overridable'),
    [query.data],
  )
  return { items, isLoading: query.isLoading, isError: query.isError, refetch: query.refetch }
}

/**
 * Which page a setting belongs to, for a module that declares pages.
 *
 * A setting naming no page — or naming one the manifest no longer declares —
 * lands on the FIRST page rather than nowhere. The API refuses that
 * inconsistency at registration, so this is the belt to that braces; a knob
 * that exists and is reachable nowhere is the one outcome worth ruling out.
 */
function pageOf(item: SettingItem, known: Set<string>, fallback: string): string {
  const declared = item.group ?? ''
  return known.has(declared) ? declared : fallback
}

export interface ModuleAdminSettingsProps {
  moduleId: string
  /** The page being shown. `null` = the module declares none (single stack). */
  group?:   string | null
  /** Every page the module declares — what the filter names its hits by. */
  groups?:  ModuleSettingGroup[]
  /** The module's own views that asked for a tab on THIS page. */
  extraTabs?: ModuleAdminSection[]
  /** WHO the values on screen belong to — chosen in the page's side card. */
  scope?:   ActiveScope
}

export default function ModuleAdminSettings({
  moduleId, group = null, groups = [], extraTabs = [], scope = INSTANCE_SCOPE,
}: ModuleAdminSettingsProps) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { items, isLoading } = useModuleInstanceSettings(moduleId)
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm()

  const [edits, setEdits]         = useState<Record<string, unknown>>({})
  // Which section is writing, and which one just wrote: with one bar per section
  // a single boolean would flash "Enregistré" on all of them at once.
  const [busySection, setBusy]    = useState<string | null>(null)
  const [savedSection, setSaved]  = useState<string | null>(null)
  const [error, setError]         = useState<string | null>(null)
  const [filter, setFilter]       = useState('')
  const [opened, setOpened]       = useState<Record<string, boolean>>({})
  const [advOpen, setAdvOpen]     = useState<Record<string, boolean>>({})
  const [tab, setTab]             = useState<string | null>(null)
  const [chainKey, setChainKey]   = useState<string | null>(null)

  // ── Scope ──────────────────────────────────────────────────────────────────
  // A module with nothing `overridable` is instance-wide by declaration; asking
  // the core to resolve its keys per unit would cost a request and answer
  // nothing the schema did not already say.
  const scopable = hasScopableSettings(items)
  const scoped   = scopable && scope.type === 'org_unit'

  // The instance reading is the one that applies while no unit is selected; the
  // side card asks for it too (same query key, one request) to mark the units
  // that have stopped following.
  const instanceResolved = useResolvedModuleSettings(moduleId, INSTANCE_SCOPE, scopable)
  const unitResolved     = useResolvedModuleSettings(moduleId, scope, scoped)
  const resolvedByKey    = scoped ? unitResolved.byKey : instanceResolved.byKey

  // Changing scope drops pending edits: they were typed against another level's
  // value, and carrying them over would write one unit's number into another.
  useEffect(() => { setEdits({}); setError(null) }, [scope.type, scope.id])

  // ── Values ─────────────────────────────────────────────────────────────────
  const byKey = useMemo(() => new Map(items.map(s => [s.key, s])), [items])

  /** What applies at the scope on screen, before anything was staged. */
  const storedValue = (s: SettingItem) => {
    const resolved = resolvedByKey.get(s.key)
    if (scoped && resolved) return resolved.value
    return s.global ?? s.default
  }
  const shown = (s: SettingItem) => (s.key in edits ? edits[s.key] : storedValue(s))
  const valueOf = (key: string) => {
    const parent = byKey.get(key)
    return parent ? shown(parent) : undefined
  }

  /** A unit may not touch what the module declared instance-wide. */
  const instanceOnly = (s: SettingItem) => s.scope !== 'overridable'
  const isReadOnly = (s: SettingItem) => {
    if (scoped && instanceOnly(s)) return true
    return !!resolvedByKey.get(s.key)?.locked_above
  }

  // A row whose gate is off is not rendered at all, so its pending edit would be
  // invisible AND saved. Dropping it when the gate closes is the only reading of
  // "hidden" that stays honest.
  const setValue = (item: SettingItem, v: unknown) =>
    setEdits(prev => {
      const next = { ...prev, [item.key]: v }
      if (item.type === 'bool' && !v) {
        for (const child of items) {
          if (child.depends_on === item.key) delete next[child.key]
        }
      }
      return next
    })

  // Bounds are checked on what will actually be SENT: a stored value that has
  // drifted out of range (bounds tightened by an update) must not block the
  // saving of an unrelated knob.
  const invalidKeys = useMemo(() => {
    const bad = new Set<string>()
    for (const key of Object.keys(edits)) {
      const item = byKey.get(key)
      if (item && outOfRange(item, edits[key])) bad.add(key)
    }
    return bad
  }, [edits, byKey])

  // ── Writing ────────────────────────────────────────────────────────────────
  const reportError = (e: unknown) => {
    const detail = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
    setError(detail ?? t('admin.setting_write_failed', {
      defaultValue: "L'enregistrement a échoué.",
    }))
  }

  /* The pending edits are what the controls display; the query cache still holds
   * the value from before the write. Dropping the edits before the refetch has
   * landed would show that stale value for the length of a round trip, so every
   * control would flip back to its old state and then forward again.
   *
   * Only the keys that were WRITTEN are dropped: a section save must leave what
   * is staged in the other sections exactly where the operator left it. */
  const afterWrite = async (written: string[]) => {
    setError(null)
    await qc.invalidateQueries({ queryKey: ['module-config', moduleId] })
    await qc.invalidateQueries({ queryKey: ['module-settings-resolved', moduleId] })
    await qc.invalidateQueries({ queryKey: ['setting-chain'] })
    setEdits(prev => {
      const next = { ...prev }
      for (const key of written) delete next[key]
      return next
    })
  }

  const save = useMutation({
    mutationFn: async (changes: Record<string, unknown>) => {
      if (scope.type === 'instance') {
        const payload: Record<string, unknown> = {}
        for (const [k, v] of Object.entries(changes)) payload[prefixedKey(moduleId, k)] = v
        await api.patch('/admin/settings', payload)
        return
      }
      for (const [k, v] of Object.entries(changes)) {
        await api.put(`/admin/settings/scoped/${encodeURIComponent(prefixedKey(moduleId, k))}`, {
          scope_type: scope.type,
          scope_id:   scope.id,
          value:      v,
        })
      }
    },
    onSuccess: (_data, changes) => afterWrite(Object.keys(changes)),
    onError:   reportError,
  })

  /** Back to following the level above — the row this scope owns is removed. */
  const revert = useMutation({
    mutationFn: (key: string) =>
      api.delete(`/admin/settings/scoped/${encodeURIComponent(prefixedKey(moduleId, key))}`, {
        params: { scope_type: scope.type, scope_id: scope.id ?? undefined },
      }),
    onSuccess: (_data, key) => afterWrite([key]),
    onError:   reportError,
  })

  const lock = useMutation({
    mutationFn: (p: { key: string; locked: boolean }) =>
      api.post(`/admin/settings/lock/${encodeURIComponent(prefixedKey(moduleId, p.key))}`, {
        scope_type: scope.type,
        scope_id:   scope.id,
        locked:     p.locked,
      }),
    onSuccess: (_data, p) => afterWrite([p.key]),
    onError:   reportError,
  })

  // ── Pages ──────────────────────────────────────────────────────────────────
  const paged      = groups.length > 0
  const groupIds   = useMemo(() => new Set(groups.map(g => g.id)), [groups])
  const firstGroup = groups[0]?.id ?? ''
  const page       = paged ? (groupIds.has(group ?? '') ? (group as string) : firstGroup) : ''
  const groupLabel = useMemo(() => new Map(groups.map(g => [g.id, g.label])), [groups])

  // Filtering is a search across the WHOLE module, so it opens everything it can
  // reach — a hit folded inside a collapsed "Avancé", or sitting on another
  // page, is a hit the reader never finds.
  const filtering = filter.trim().length > 0

  const visible = (s: SettingItem) => isVisible(s, valueOf, key => byKey.has(key))

  const matches = useMemo(() => {
    const needle = filter.trim().toLowerCase()
    if (!needle) return null
    const hit = (s: SettingItem) =>
      (s.label ?? '').toLowerCase().includes(needle) ||
      (s.description ?? '').toLowerCase().includes(needle) ||
      s.key.toLowerCase().includes(needle) ||
      s.category.toLowerCase().includes(needle) ||
      (groupLabel.get(s.group ?? '') ?? '').toLowerCase().includes(needle)
    return items.filter(s => visible(s) && hit(s))
    // `edits` matters: switching a gate off must re-run the visibility pass.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, filter, edits, byKey, groupLabel])

  /**
   * The section a setting is painted in.
   *
   * A module that declares no category is stored under its own id, which would
   * title the section "flow" or "drive" — the module name repeated under its own
   * page. That is treated as "no category at all".
   */
  const categoryOf = (s: SettingItem) => {
    const declared = s.category && s.category !== moduleId ? s.category : ''
    return declared || t('admin.m_other_settings', { defaultValue: 'Autres' })
  }

  /**
   * Settings split by category, in DECLARATION order — the order the module
   * wrote them in its manifest, which is the order it meant them to be read.
   */
  const splitByCategory = (list: SettingItem[]) => {
    const byCategory = new Map<string, SettingItem[]>()
    for (const s of list) {
      const key = categoryOf(s)
      const acc = byCategory.get(key) ?? []
      acc.push(s)
      byCategory.set(key, acc)
    }
    return [...byCategory.entries()].map(([category, all]) => ({
      category,
      basic:    all.filter(s => !s.advanced),
      advanced: all.filter(s => s.advanced),
      all,
    }))
  }

  /** The settings of the page on screen (all of them when there is no page). */
  const pageItems = useMemo(
    () => (paged ? items.filter(s => pageOf(s, groupIds, firstGroup) === page) : items),
    [items, paged, groupIds, firstGroup, page],
  )

  const pageCategories = useMemo(
    () => splitByCategory(pageItems.filter(visible)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pageItems, edits, byKey, t],
  )

  // ── Tabs of the page: its categories, then whatever the module contributes ──
  const CATEGORY_TAB = 'cat:'
  const tabs = useMemo(() => [
    ...pageCategories.map(c => ({ id: `${CATEGORY_TAB}${c.category}`, label: c.category })),
    ...extraTabs.map(s => ({
      id:    `sec:${s.id}`,
      label: s.labelKey ? t(s.labelKey, { defaultValue: s.label ?? s.id }) : (s.label ?? s.id),
      icon:  findIcon(s.icon) ?? undefined,
    })),
  ], [pageCategories, extraTabs, t])

  // Derived rather than stored: the page changes under us when the operator
  // clicks another entry in the menu, and a remembered tab id from the previous
  // page would then select nothing at all.
  const activeTab = tabs.some(x => x.id === tab) ? (tab as string) : (tabs[0]?.id ?? '')

  if (isLoading) {
    return <div className="py-6 flex justify-center"><Spinner /></div>
  }
  // The caller is expected to have asked `useModuleInstanceSettings` first and
  // shown its own empty state; this is only the last line of defence.
  if (items.length === 0) {
    return (
      <p className="py-6 text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
        {t('admin.m_no_settings_title')}
      </p>
    )
  }

  const dirtyCount = Object.keys(edits).length

  /** Writes the staged edits of ONE section, and clears only those. */
  const submitSection = async (sectionKey: string, keys: string[]) => {
    const changes: Record<string, unknown> = {}
    for (const key of keys) if (key in edits) changes[key] = edits[key]
    const staged = Object.keys(changes)
    // Out-of-bounds values are refused per section too: a bad number in another
    // section is that section's problem, and must not hold this one hostage.
    if (staged.length === 0 || staged.some(k => invalidKeys.has(k))) return

    // A setting flagged `danger` can make the server unreachable or lose mail.
    // The panel says so once, plainly, before the value leaves the browser.
    const risky = staged
      .map(k => byKey.get(k))
      .filter((s): s is SettingItem => !!s && s.risk === 'danger')
    if (risky.length > 0) {
      const names = risky.map(s => `• ${s.label ?? s.key}`).join('\n')
      const ok = await confirm({
        title:   t('admin.m_confirm_danger_title', { defaultValue: 'Réglage sensible' }),
        message: t('admin.m_confirm_danger_message', {
          count: risky.length,
          names,
          defaultValue: `Vous modifiez ${risky.length} réglage(s) sensible(s) :\n${names}\n\nUne valeur erronée peut rendre le service injoignable ou faire perdre des messages. Confirmer l'enregistrement ?`,
        }),
        variant: 'danger',
        confirmLabel: t('common.save', { defaultValue: 'Enregistrer' }),
      })
      if (!ok) return
    }

    setBusy(sectionKey)
    try {
      await save.mutateAsync(changes)
      setSaved(sectionKey)
      // Guarded: another section may have written in the meantime, and clearing
      // the flag blind would take the flash off the wrong bar.
      setTimeout(() => setSaved(current => (current === sectionKey ? null : current)), 2500)
    } catch {
      // Already surfaced by the mutation's `onError`; caught so the rejection of
      // `mutateAsync` does not escape as an unhandled one.
    } finally {
      setBusy(null)
    }
  }

  /** Undoes the staged edits of ONE section, leaving the others alone. */
  const cancelSection = (keys: string[]) =>
    setEdits(prev => {
      const next = { ...prev }
      for (const key of keys) delete next[key]
      return next
    })

  /**
   * The way back to a staged edit that has no bar in front of it — folded away,
   * on another tab, or on another page. One target is enough: it is a pointer,
   * not an inventory, and following it lands the operator where the rest are.
   */
  const elsewhereAction = (keys: string[]) => {
    const item = keys.map(k => byKey.get(k)).find((s): s is SettingItem => !!s)
    if (!item) return null
    const label = t('admin.m_pending_elsewhere_goto', { defaultValue: 'Voir' })
    const itemPage = paged ? pageOf(item, groupIds, firstGroup) : ''
    if (paged && itemPage !== page) {
      // A real href: the operator must be able to see where it goes, and to open
      // it in another tab.
      return (
        <Link to={adminPath('modules', moduleId, itemPage)} className="text-primary hover:underline">
          {label}
        </Link>
      )
    }
    const category = categoryOf(item)
    return (
      <button
        type="button"
        // Both at once, because the two shapes of the panel name their sections
        // differently: a tab id when the module declares pages, the bare
        // category when it declares none.
        onClick={() => {
          setTab(`${CATEGORY_TAB}${category}`)
          setOpened(o => ({ ...o, [category]: true }))
        }}
        className="text-primary hover:underline"
      >
        {label}
      </button>
    )
  }

  const renderRow = (s: SettingItem) => {
    const current  = shown(s)
    const resolved = resolvedByKey.get(s.key)
    const readOnly = isReadOnly(s)
    return (
      <ModuleSettingRow
        key={s.key}
        item={s}
        value={current}
        modified={!sameValue(current, s.default)}
        pending={s.key in edits}
        invalid={invalidKeys.has(s.key)}
        readOnly={readOnly}
        showFactoryReset={!scoped}
        statusPill={scopable
          ? <ScopeStatusPill resolved={resolved} scoped={scoped} instanceOnly={instanceOnly(s)} />
          : undefined}
        // Only where there IS something above to inherit from. At instance level
        // the "rétablir la valeur par défaut" link on the row already says the
        // one thing reverting can mean.
        provenance={scoped && resolved && !instanceOnly(s)
          ? (
            <>
              <ProvenanceLine
                setting={resolved}
                onRevert={() => revert.mutate(s.key)}
                onLock={locked => lock.mutate({ key: s.key, locked })}
                onShowChain={() => setChainKey(s.key)}
              />
              {/* Going back to following the parent is one of the three things
                  this page can do to a value, so it is a button under the
                  sentence that states the value's origin — not an entry of a
                  menu the operator has to go looking for. */}
              {resolved.has_own_value && !resolved.locked_above && (
                <button
                  type="button"
                  onClick={() => revert.mutate(s.key)}
                  disabled={revert.isPending}
                  className="block text-left text-primary transition-colors hover:underline disabled:opacity-50"
                  style={{ fontSize: 'var(--kb-text-meta)' }}
                >
                  {t('admin.m_inherit', { defaultValue: 'Hériter la valeur du parent' })}
                </button>
              )}
            </>
          )
          : undefined}
        onChange={v => setValue(s, v)}
        onReset={() => setValue(s, s.default)}
      />
    )
  }

  /** How many of a run differ from what the scope on screen would inherit. */
  const changedCount = (list: SettingItem[]) => list.filter(s => {
    if (scoped) return resolvedByKey.get(s.key)?.has_own_value ?? false
    return !sameValue(s.global ?? s.default, s.default)
  }).length

  /**
   * WHO the values of a section belong to, in its left gutter.
   *
   * `ScopeHeadline` is drawn for a full-width strip — a rule under it and a
   * margin below that. In the gutter the section's own hairlines already do that
   * work, so its spacing is stripped rather than repeated.
   */
  const scopeAside = (
    <div className="[&>div]:mb-0 [&>div]:border-0 [&>div]:pb-0">
      <ScopeHeadline scope={scope} />
    </div>
  )

  /** A category as a foldable section — the shape of the whole page. */
  const categorySection = (
    key: string,
    category: string,
    basic: SettingItem[],
    advanced: SettingItem[],
    onlyOne: boolean,
  ) => {
    const all = [...basic, ...advanced]
    const changed = changedCount(all)
    // What this section's bar commits, and what it must NOT commit.
    const keys      = all.map(s => s.key)
    const here      = keys.filter(k => k in edits)
    const outside   = Object.keys(edits).filter(k => !keys.includes(k))
    // Writing on a scope that holds no value yet REMOVES it from its parent's
    // authority for that key. The action says which of the two it is about to do.
    const overriding = scoped && here.some(k => !resolvedByKey.get(k)?.has_own_value)
    // "Autres" is a name given RELATIVE to other sections. When the page holds a
    // single unnamed run of settings there is nothing to be other than, and the
    // page heading above already says what they are — so it carries no title.
    const synthetic = category === t('admin.m_other_settings', { defaultValue: 'Autres' })
    return (
      <SettingSectionCard
        key={key}
        title={onlyOne && synthetic ? '' : category}
        status={
          <>
            {t('admin.m_settings_count', {
              count: all.length,
              defaultValue: `${all.length} réglages`,
            })}
            {changed > 0 && ' · '}
            {changed > 0 && (
              <span className="text-primary">
                {scoped
                  ? t('admin.m_section_overridden', {
                      count: changed,
                      defaultValue: `${changed} remplacé(s) ici`,
                    })
                  : t('admin.m_section_modified', {
                      count: changed,
                      defaultValue: `${changed} modifié(s)`,
                    })}
              </span>
            )}
          </>
        }
        // While filtering, everything is open: a hit hidden behind a fold the
        // operator has to guess at is not a hit. A page made of ONE section has
        // nothing to choose between, so folding it only adds a click.
        open={filtering || (opened[key] ?? onlyOne)}
        onToggle={() => setOpened(o => ({ ...o, [key]: !(o[key] ?? onlyOne) }))}
        aside={scopeAside}
        footer={
          <SettingsSaveBar
            count={here.length}
            elsewhere={outside.length}
            elsewhereAction={elsewhereAction(outside)}
            invalid={here.filter(k => invalidKeys.has(k)).length}
            saving={busySection === key}
            saved={savedSection === key}
            overriding={overriding}
            onSave={() => void submitSection(key, keys)}
            onCancel={() => cancelSection(keys)}
          />
        }
      >
        <SettingRows
          basic={basic}
          advanced={advanced}
          advancedOpen={filtering || (advOpen[key] ?? false)}
          onToggleAdvanced={() => setAdvOpen(a => ({ ...a, [key]: !(a[key] ?? false) }))}
          renderRow={renderRow}
        />
      </SettingSectionCard>
    )
  }

  /** Search results, told apart by the page they were found on. */
  const renderMatches = (list: SettingItem[]) => {
    if (list.length === 0) {
      return (
        <p className="py-6 text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
          {t('admin.m_no_match', { defaultValue: 'Aucun réglage ne correspond.' })}
        </p>
      )
    }
    if (!paged) {
      return (
        <div className="space-y-3">
          {splitByCategory(list).map(c =>
            categorySection(c.category, c.category, c.basic, c.advanced, false))}
        </div>
      )
    }
    // Grouped by page, pages in menu order, so a result reads as an address:
    // "Filtrage ▸ Politique anti-spam".
    return groups.map(g => {
      const inPage = list.filter(s => pageOf(s, groupIds, firstGroup) === g.id)
      if (inPage.length === 0) return null
      const here = g.id === page
      return (
        <div key={g.id} className="mb-4">
          <div className="flex flex-wrap items-center gap-2 pb-2">
            <span className="text-sm font-bold text-text-primary">{g.label}</span>
            {here ? (
              <span className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-micro)' }}>
                {t('admin.m_group_current', { defaultValue: 'page courante' })}
              </span>
            ) : (
              // A real href: the result has to be openable in its own tab, and
              // the operator has to be able to see where it goes.
              <Link
                to={adminPath('modules', moduleId, g.id)}
                className="text-primary hover:underline"
                style={{ fontSize: 'var(--kb-text-micro)' }}
              >
                {t('admin.m_group_open', { defaultValue: 'ouvrir cette page' })}
              </Link>
            )}
          </div>
          <div className="space-y-3">
            {splitByCategory(inPage).map(c =>
              categorySection(`${g.id}::${c.category}`, c.category, c.basic, c.advanced, false))}
          </div>
        </div>
      )
    })
  }

  const ExtraTab = activeTab.startsWith('sec:')
    ? extraTabs.find(s => `sec:${s.id}` === activeTab)?.Component ?? null
    : null
  const activeCategory = activeTab.startsWith(CATEGORY_TAB)
    ? pageCategories.find(c => `${CATEGORY_TAB}${c.category}` === activeTab) ?? null
    : null

  // Every bar lives inside a section, so a view that paints no section at all —
  // one of the module's own tabs, a page with no settings, a fruitless filter —
  // would say nothing about work staged elsewhere. That is the one case the
  // panel still owes a standing sentence.
  const showsSections = filtering
    ? (matches?.length ?? 0) > 0
    : paged
      ? !ExtraTab && !!activeCategory
      : pageCategories.length > 0

  return (
    <>
      <div className="min-w-0">
        {/* Filter: the fastest way through a long panel is to type what you
            came for — and past forty settings it is the main way in, which is
            why it searches every page rather than the one on screen. */}
        <div className="mb-4">
          <div className="relative max-w-md">
            <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <Input
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder={paged
                ? t('admin.m_filter_all_settings', { defaultValue: 'Filtrer tous les réglages du module…' })
                : t('admin.m_filter_settings', { defaultValue: 'Filtrer les réglages…' })}
              className="pl-8"
            />
          </div>
          {filtering && matches && (
            <p className="mt-2 text-text-tertiary" style={{ fontSize: 'var(--kb-text-micro)' }}>
              {t('admin.m_filter_scope', {
                count: matches.length,
                defaultValue: `${matches.length} réglage(s) trouvé(s) dans tout le module`,
              })}
            </p>
          )}
        </div>

        {/* What the values below belong to is now said INSIDE each section, in
            its left gutter: a page-level headline scrolls out of sight long
            before the section an operator is editing does. */}

        {error && (
          <Callout variant="danger" className="mb-4" dismissible onDismiss={() => setError(null)}>
            {error}
          </Callout>
        )}

        {filtering ? (
          renderMatches(matches ?? [])
        ) : paged ? (
          <>
            {tabs.length > 1 && (
              <Tabs tabs={tabs} value={activeTab} onChange={setTab} className="mb-4" t={t} />
            )}
            {ExtraTab ? <ExtraTab /> : activeCategory ? (
              categorySection(
                activeTab, activeCategory.category,
                activeCategory.basic, activeCategory.advanced, true,
              )
            ) : (
              // Says what the page is still good for rather than only what it
              // has not got: on a page made of the module's own views, the
              // filter above is the way into the other pages' settings.
              <p className="py-6 text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
                {t('admin.m_group_empty', {
                  count: items.length,
                  defaultValue: `Cette page ne contient aucun réglage. Le filtre ci-dessus cherche dans les ${items.length} réglages du module.`,
                })}
              </p>
            )}
          </>
        ) : (
          <div className="space-y-3">
            {pageCategories.map(c => categorySection(
              c.category, c.category, c.basic, c.advanced, pageCategories.length === 1,
            ))}
          </div>
        )}

        {!showsSections && dirtyCount > 0 && (
          <p className="mt-4 text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
            {t('admin.m_pending_elsewhere_count', {
              count: dirtyCount,
              defaultValue: `${dirtyCount} autre(s) modification(s) non enregistrée(s)`,
            })}
            <span className="ml-2">{elsewhereAction(Object.keys(edits))}</span>
          </p>
        )}
      </div>

      {chainKey && (
        <InheritanceChainWindow
          settingKey={prefixedKey(moduleId, chainKey)}
          scope={scope}
          title={byKey.get(chainKey)?.label ?? chainKey}
          onClose={() => setChainKey(null)}
        />
      )}

      {confirmState && (
        <ConfirmDialog {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} />
      )}
    </>
  )
}

/** Re-exported so the panel's helpers stay reachable from one import. */
export type { ResolvedSetting }
