// Instance-wide (admin) settings for a module, rendered INSIDE the admin console.
//
// Admins configure a module's instance settings here — they stay in the admin panel
// and are never navigated into the module's own shell. Driven by the module's
// declarative schema (`GET /modules/:id/config`); only `global` and `overridable`
// scopes are editable here (per-user settings live in the module). Saved through
// PATCH /admin/settings (keys are prefixed with the module id).
//
// A module may legitimately declare NONE — `drive` and `media` do. The caller is
// what decides what to show then (see `ModuleAdminPage`), which is why the
// reading of the schema is exposed as a hook: the page must know there is
// nothing before it paints a heading promising something.
//
// A module may also declare a LOT: mail alone exposes forty-eight knobs across
// ten categories. Nothing here knows any of them. The schema drives everything —
// `advanced` folds the expert knobs away, `depends_on` hides what a switched-off
// feature does not need, `min`/`max` refuse a bad value before it is sent, and
// `risk` makes the console ask before something that can take the service down.
//
// ── One panel, two shapes ────────────────────────────────────────────────────
// A module that declares no PAGE (`[[setting_groups]]`) renders exactly as it
// always has: one card, its `category` values as collapsible sections. That is
// almost every module, and nothing about it changes.
//
// A module that declares pages is rendered one page at a time — the page is in
// the URL, it is a menu entry, and `category` becomes a TAB inside it. Forty-eight
// knobs stacked on one address is a wall; five addresses of ten is a panel.
//
// ── What stays whole across the pages ────────────────────────────────────────
// Two things refuse to be split, because splitting them is how an operator loses
// work or fails to find a setting:
//
//  • The PENDING EDITS. They live here, keyed by setting, for the whole module —
//    switching tab or page changes what is painted, never what is staged, and
//    the footer counts every one of them, not the visible ones. One "Enregistrer"
//    saves the lot, so there is no state in which leaving a page drops a change
//    (and therefore nothing to warn about on the way out).
//  • The FILTER. It searches the whole module and says where each hit lives —
//    "Filtrage ▸ Politique anti-spam" — and lets it be edited on the spot. Past
//    forty settings, typing what you came for is the main way in; a filter that
//    only searched the open tab would answer "no match" while the setting sits
//    two pages away.
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { Button, Card, ConfirmDialog, Input, Spinner, Tabs } from '@ui'
import { Check, RotateCcw, Save, Search } from 'lucide-react'
import { useConfirm } from '../hooks/useConfirm'
import { adminPath } from './adminRoute'
import type { ModuleSettingGroup } from './adminModules'
import type { ModuleAdminSection } from '../slots/SlotRegistry'
import { findIcon } from '../utils/iconMap'
import ModuleSettingRow from './settings/ModuleSettingRow'
import { CollapsibleCategory, SettingRows } from './settings/SettingsBlocks'
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
  /** The page being shown. `null` = the module declares none (single card). */
  group?:   string | null
  /** Every page the module declares — what the filter names its hits by. */
  groups?:  ModuleSettingGroup[]
  /** The module's own views that asked for a tab on THIS page. */
  extraTabs?: ModuleAdminSection[]
}

export default function ModuleAdminSettings({
  moduleId, group = null, groups = [], extraTabs = [],
}: ModuleAdminSettingsProps) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { items, isLoading } = useModuleInstanceSettings(moduleId)
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm()

  const [edits, setEdits]         = useState<Record<string, unknown>>({})
  const [savedFlag, setSaved]     = useState(false)
  const [filter, setFilter]       = useState('')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [advOpen, setAdvOpen]     = useState<Record<string, boolean>>({})
  const [tab, setTab]             = useState<string | null>(null)

  const save = useMutation({
    mutationFn: async (changes: Record<string, unknown>) => {
      const payload: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(changes)) payload[`${moduleId}.${k}`] = v
      await api.patch('/admin/settings', payload)
    },
    onSuccess: async () => {
      setSaved(true); setTimeout(() => setSaved(false), 2500)
      // Clear the edits only once the refetch has landed — see SettingsPanel: dropping
      // them first falls back to the stale cached value and flips the controls back.
      await qc.invalidateQueries({ queryKey: ['module-config', moduleId] })
      setEdits({})
    },
  })

  const byKey = useMemo(() => new Map(items.map(s => [s.key, s])), [items])
  const shown = (s: SettingItem) => (s.key in edits ? edits[s.key] : (s.global ?? s.default))
  const valueOf = (key: string) => {
    const parent = byKey.get(key)
    return parent ? shown(parent) : undefined
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

  // ── Pages ──────────────────────────────────────────────────────────────────
  const paged      = groups.length > 0
  const groupIds   = useMemo(() => new Set(groups.map(g => g.id)), [groups])
  const firstGroup = groups[0]?.id ?? ''
  const page       = paged ? (groupIds.has(group ?? '') ? (group as string) : firstGroup) : ''
  const groupLabel = useMemo(
    () => new Map(groups.map(g => [g.id, g.label])),
    [groups],
  )

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
   * Settings split by category, in DECLARATION order — the order the module
   * wrote them in its manifest, which is the order it meant them to be read.
   */
  const splitByCategory = (list: SettingItem[]) => {
    const byCategory = new Map<string, SettingItem[]>()
    for (const s of list) {
      const key = s.category || t('admin.m_other_settings', { defaultValue: 'Autres' })
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
  const isDirty = dirtyCount > 0
  const hasInvalid = invalidKeys.size > 0
  // Staged changes that are NOT on the page being looked at. The footer says so
  // rather than counting only what is visible: an operator who edits two pages
  // then reads "1 modification" has been told something false.
  const pendingElsewhere = paged
    ? Object.keys(edits).filter(k => {
        const item = byKey.get(k)
        return item ? pageOf(item, groupIds, firstGroup) !== page : false
      }).length
    : 0

  const submit = async () => {
    if (hasInvalid) return
    // A setting flagged `danger` can make the server unreachable or lose mail.
    // The panel says so once, plainly, before the value leaves the browser.
    const risky = Object.keys(edits)
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
    save.mutate(edits)
  }

  const renderRow = (s: SettingItem) => {
    const current = shown(s)
    return (
      <ModuleSettingRow
        key={s.key}
        item={s}
        value={current}
        modified={!sameValue(current, s.default)}
        pending={s.key in edits}
        invalid={invalidKeys.has(s.key)}
        onChange={v => setValue(s, v)}
        onReset={() => setValue(s, s.default)}
      />
    )
  }

  /** A category as a collapsible section — used unpaged, and by the filter. */
  const categorySection = (
    key: string,
    category: string,
    basic: SettingItem[],
    advanced: SettingItem[],
    aside?: React.ReactNode,
  ) => {
    const all = [...basic, ...advanced]
    return (
      <CollapsibleCategory
        key={key}
        title={category}
        aside={aside}
        count={all.length}
        changed={all.filter(s => !sameValue(s.global ?? s.default, s.default)).length}
        // While filtering, everything is open: a hit hidden behind a fold the
        // operator has to guess at is not a hit.
        collapsed={filtering ? false : (collapsed[key] ?? false)}
        onToggle={() => setCollapsed(c => ({ ...c, [key]: !(c[key] ?? false) }))}
      >
        <SettingRows
          basic={basic}
          advanced={advanced}
          advancedOpen={filtering || (advOpen[key] ?? false)}
          onToggleAdvanced={() => setAdvOpen(a => ({ ...a, [key]: !(a[key] ?? false) }))}
          renderRow={renderRow}
        />
      </CollapsibleCategory>
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
      return splitByCategory(list).map(c =>
        categorySection(c.category, c.category, c.basic, c.advanced))
    }
    // Grouped by page, pages in menu order, so a result reads as an address:
    // "Filtrage ▸ Politique anti-spam".
    return groups.map(g => {
      const inPage = list.filter(s => pageOf(s, groupIds, firstGroup) === g.id)
      if (inPage.length === 0) return null
      const here = g.id === page
      return (
        <div key={g.id}>
          <div className="flex flex-wrap items-center gap-2 pt-4 pb-1">
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
          {splitByCategory(inPage).map(c =>
            categorySection(`${g.id}::${c.category}`, c.category, c.basic, c.advanced))}
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

  return (
    <>
      <Card
        flush
        footer={
          <div className="flex items-center justify-between gap-4">
            <span
              className={hasInvalid ? 'text-danger' : 'text-text-tertiary'}
              style={{ fontSize: 'var(--kb-text-meta)' }}
            >
              {hasInvalid
                ? t('admin.m_invalid_values', {
                    count: invalidKeys.size,
                    defaultValue: `${invalidKeys.size} valeur(s) hors bornes`,
                  })
                : isDirty
                ? t('admin.m_pending_changes', {
                    count: dirtyCount,
                    defaultValue: `${dirtyCount} modification(s) non enregistrée(s)`,
                  })
                : t('admin.m_settings_count', {
                    count: items.length,
                    defaultValue: `${items.length} réglages`,
                  })}
              {isDirty && !hasInvalid && pendingElsewhere > 0 && (
                <span className="ml-1 text-text-tertiary">
                  {t('admin.m_pending_elsewhere', {
                    count: pendingElsewhere,
                    defaultValue: `(dont ${pendingElsewhere} sur d'autres pages)`,
                  })}
                </span>
              )}
            </span>
            <div className="flex items-center gap-2">
              {isDirty && (
                <Button variant="ghost" onClick={() => setEdits({})} icon={<RotateCcw size={14} />}>
                  {t('common.cancel', { defaultValue: 'Annuler' })}
                </Button>
              )}
              <Button
                onClick={submit}
                disabled={!isDirty || hasInvalid || save.isPending}
                icon={savedFlag ? <Check size={14} /> : <Save size={15} />}
              >
                {savedFlag ? t('admin.m_saved') : t('common.save')}
              </Button>
            </div>
          </div>
        }
      >
        {/* Filter: the fastest way through a long panel is to type what you came
            for — and past forty settings it is the main way in, which is why it
            searches every page rather than the one on screen. */}
        <div className="px-5 pt-4 pb-1">
          <div className="relative max-w-sm">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
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

        {filtering ? (
          <div className="px-5 pb-2">{renderMatches(matches ?? [])}</div>
        ) : paged ? (
          <>
            {tabs.length > 1 && (
              <Tabs tabs={tabs} value={activeTab} onChange={setTab} className="px-5" t={t} />
            )}
            <div className="px-5 pb-2 pt-1">
              {ExtraTab ? <ExtraTab /> : activeCategory ? (
                <SettingRows
                  basic={activeCategory.basic}
                  advanced={activeCategory.advanced}
                  advancedOpen={advOpen[activeTab] ?? false}
                  onToggleAdvanced={() => setAdvOpen(a => ({ ...a, [activeTab]: !(a[activeTab] ?? false) }))}
                  renderRow={renderRow}
                />
              ) : (
                // Says what the card is still good for rather than only what it
                // has not got: on a page made of the module's own views, this
                // box is the way into the other pages' settings.
                <p className="py-6 text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
                  {t('admin.m_group_empty', {
                    count: items.length,
                    defaultValue: `Cette page ne contient aucun réglage. Le filtre ci-dessus cherche dans les ${items.length} réglages du module.`,
                  })}
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="px-5 pb-2">
            {pageCategories.map(c => categorySection(c.category, c.category, c.basic, c.advanced))}
          </div>
        )}
      </Card>

      {confirmState && (
        <ConfirmDialog {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} />
      )}
    </>
  )
}
