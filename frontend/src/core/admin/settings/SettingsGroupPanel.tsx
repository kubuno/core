import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Callout } from '@ui'
import { api } from '../../api/client'
import { PRIV } from '../../authz/types'
import { usePrivileges } from '../../authz/usePrivileges'
import SettingScopeBar from './SettingScopeBar'
import ProvenanceLine from './ProvenanceLine'
import InheritanceChainWindow from './InheritanceChainWindow'
import SettingControl, { settingLabel } from './SettingControl'
import {
  DEDICATED_EDITOR, ENUM_OPTIONS, FALLBACK_TAB, TIMEZONE_KEYS, isClaimed, specForTab,
} from './settingsMap'
import {
  INSTANCE_SCOPE,
  type ActiveScope,
  type ResolvedSetting,
  type ResolvedSettingsResponse,
} from './scopeTypes'

/**
 * The settings block of ONE administration page.
 *
 * Every page that governs a subsystem paints its own knobs through this
 * component, and `settingsMap.ts` says which keys those are. The three things
 * that must not diverge between pages live here, once:
 *
 *   • the SCOPE BAR — instance or organisational unit — above every block, so
 *     inheritance survives the split intact. A page that silently edited the
 *     instance while the operator believed they were editing a unit would be
 *     worse than the single page it replaced;
 *   • the PROVENANCE LINE under every control (inherited / overridden / locked)
 *     with its revert, lock and "show the chain" affordances;
 *   • the action bar for buffered edits (free text and numbers), where booleans
 *     and closed value sets write immediately.
 *
 * Rendering nothing is a valid outcome: a caller who may not read settings, or
 * a page whose keys are all absent from this instance, gets no block at all
 * rather than an empty heading.
 */

interface Props {
  /** Nav leaf id whose keys this block paints. */
  tab: string
  /**
   * How the block sits in its page.
   *   • `standalone` — the block IS the page (a pure-settings leaf). One
   *     readable column, whatever the count.
   *   • `tab` — the block is the "Réglages" tab beside a subsystem's content.
   *     It takes the full width the content established, and flows its
   *     categories into two columns once there are enough to fill them.
   * The block never wears a heading of its own: the page title or the tab
   * already names it, and a second "Réglages" heading only repeated that.
   */
  layout?: 'standalone' | 'tab'
}

export default function SettingsGroupPanel({ tab, layout = 'standalone' }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { can } = usePrivileges()

  const canRead   = can(PRIV.SETTINGS_READ)
  const canManage = can(PRIV.SETTINGS_MANAGE)

  const [edits, setEdits]   = useState<Record<string, unknown>>({})
  const [saved, setSaved]   = useState(false)
  const [error, setError]   = useState<string | null>(null)
  const [scope, setScope]   = useState<ActiveScope>(INSTANCE_SCOPE)
  const [chainKey, setChainKey] = useState<string | null>(null)

  // `?highlight=<key>` — where the admin search lands when a SETTING (not a
  // page) is picked. The row itself is scrolled to and outlined.
  const [params] = useSearchParams()
  const highlight = params.get('highlight')
  const highlightRef = useRef<HTMLDivElement>(null)

  const scopeParams = { scope_type: scope.type, scope_id: scope.id ?? undefined }

  // Same key on every page: opening a second settings block reuses the payload
  // the first one already fetched instead of asking again.
  const { data: settings } = useQuery({
    queryKey: ['admin-settings-resolved', scope.type, scope.id] as const,
    queryFn: () =>
      api
        .get<ResolvedSettingsResponse>('/admin/settings/resolved', { params: scopeParams })
        .then(r => r.data.settings),
    enabled: canRead,
  })

  /* The pending edits are what the controls display; the query cache still holds
   * the value from before the save. Dropping the edits before the refetch has
   * landed would show that stale value for the length of a round trip, so every
   * control would flip back to its old state and then forward again. */
  const afterWrite = async () => {
    setSaved(true)
    setError(null)
    setTimeout(() => setSaved(false), 2000)
    await queryClient.invalidateQueries({ queryKey: ['admin-settings-resolved'] })
    await queryClient.invalidateQueries({ queryKey: ['setting-chain'] })
    setEdits({})
  }

  const reportError = (e: unknown) => {
    const detail = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
    setError(detail ?? t('admin.setting_write_failed'))
  }

  const update = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      // One request per key: a scoped write names its scope, and refusing one
      // key (a lock upstream) must not silently drop the others.
      for (const [key, value] of Object.entries(updates)) {
        await api.put(`/admin/settings/scoped/${encodeURIComponent(key)}`, {
          scope_type: scope.type,
          scope_id:   scope.id,
          value,
        })
      }
    },
    onSuccess: afterWrite,
    onError:   reportError,
  })

  const revert = useMutation({
    mutationFn: (key: string) =>
      api.delete(`/admin/settings/scoped/${encodeURIComponent(key)}`, { params: scopeParams }),
    onSuccess: afterWrite,
    onError:   reportError,
  })

  const lock = useMutation({
    mutationFn: (p: { key: string; locked: boolean }) =>
      api.post(`/admin/settings/lock/${encodeURIComponent(p.key)}`, {
        scope_type: scope.type,
        scope_id:   scope.id,
        locked:     p.locked,
      }),
    onSuccess: afterWrite,
    onError:   reportError,
  })

  // Changing scope drops pending edits: they were typed against another level's
  // value, and carrying them over would write one scope's number into another.
  useEffect(() => { setEdits({}); setError(null) }, [scope.type, scope.id])

  useEffect(() => {
    if (!highlight || !highlightRef.current) return
    highlightRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' })
    // `settings` is a dependency because the row does not exist before the list
    // has loaded, which is exactly when the deep link arrives.
  }, [highlight, settings])

  // ── What this page shows ──────────────────────────────────────────────────
  const sections = useMemo(() => {
    if (!settings) return []
    const byKey = new Map(settings.map(s => [s.key, s]))
    const out: { id: string; title: string; desc: string; items: ResolvedSetting[] }[] = []

    for (const group of specForTab(tab)?.groups ?? []) {
      const items = group.keys
        .map(k => byKey.get(k))
        .filter((s): s is ResolvedSetting => !!s && !(s.key in DEDICATED_EDITOR))
      if (items.length) {
        out.push({
          id:    group.id,
          title: t(`admin.sgrp_${group.id}`),
          desc:  t(`admin.sgrp_${group.id}_desc`, { defaultValue: '' }),
          items,
        })
      }
    }

    // The page of last resort collects whatever no page claims — a key added to
    // the core, or declared by a module, without an entry in the cartography.
    // Grouped by its declared category, which is all that is known about it.
    if (tab === FALLBACK_TAB) {
      const orphans = settings.filter(s => !isClaimed(s.key))
      const cats = [...new Set(orphans.map(s => s.category))].sort()
      for (const cat of cats) {
        out.push({
          id:    `cat:${cat}`,
          title: t(`admin.cat_${cat}`, { defaultValue: cat }),
          desc:  t('admin.sgrp_unfiled_desc'),
          items: orphans.filter(s => s.category === cat),
        })
      }
    }
    return out
  }, [settings, tab, t])

  /** Written from the action bar rather than on the keystroke. */
  const isBuffered = (s: ResolvedSetting) =>
    typeof s.value !== 'boolean'
    && s.key !== 'auth.api_token_allowed_roles'
    && !(s.key in ENUM_OPTIONS)
    && !TIMEZONE_KEYS.has(s.key)

  const pendingKeys = Object.keys(edits).filter(k => {
    const s = settings?.find(x => x.key === k)
    return s ? isBuffered(s) : false
  })

  if (!canRead || !settings || sections.length === 0) return null

  const currentValue = (s: ResolvedSetting) => (s.key in edits ? edits[s.key] : s.value)
  const chainSetting = chainKey ? settings.find(s => s.key === chainKey) : undefined

  // Two columns only pay off past a couple of categories; a single one in a
  // two-column flow just leaves the right half empty. So a lone-category tab
  // stays a readable single column, exactly like a standalone page.
  const twoColumn = layout === 'tab' && sections.length >= 2
  const containerClass = twoColumn ? 'w-full' : 'max-w-2xl'

  return (
    <div className={containerClass}>
      <SettingScopeBar scope={scope} onChange={setScope} sticky />

      {!canManage && (
        <div className="mb-4">
          <Callout variant="info">{t('admin.settings_read_only')}</Callout>
        </div>
      )}

      {error && (
        <div className="mb-4">
          <Callout variant="danger" dismissible onDismiss={() => setError(null)}>
            {error}
          </Callout>
        </div>
      )}

      {/* Two columns only when there are enough categories to fill them — a lone
          category in a two-column flow leaves a visibly empty half. CSS columns
          (not a grid) so categories of unequal height pack without ragged gaps;
          `break-inside-avoid` keeps a category whole across the column break. */}
      <div className={twoColumn ? 'lg:columns-2 lg:gap-x-10' : ''}>
        {sections.map(section => (
        <section key={section.id} className={`mb-8 ${twoColumn ? 'break-inside-avoid' : ''}`}>
          <h3 className="border-b border-border pb-2 text-sm font-semibold text-text-primary">
            {section.title}
          </h3>
          {section.desc && (
            <p className="mt-2 text-sm text-text-tertiary">{section.desc}</p>
          )}

          <div className="mt-3 space-y-3">
            {section.items.map(s => (
              <SettingControl
                key={s.key}
                setting={s}
                value={currentValue(s)}
                readOnly={s.locked_above || !canManage}
                onCommit={v => {
                  setEdits(prev => ({ ...prev, [s.key]: v }))
                  update.mutate({ [s.key]: v })
                }}
                onDraft={v => setEdits(prev => ({ ...prev, [s.key]: v }))}
                highlighted={highlight === s.key}
                innerRef={highlight === s.key ? highlightRef : undefined}
              >
                <ProvenanceLine
                  setting={s}
                  onRevert={() => revert.mutate(s.key)}
                  onLock={locked => lock.mutate({ key: s.key, locked })}
                  onShowChain={() => setChainKey(s.key)}
                />
              </SettingControl>
            ))}
          </div>
        </section>
        ))}
      </div>

      {pendingKeys.length > 0 && (
        <div className="sticky bottom-4 mt-4 flex items-center gap-3 rounded-xl border border-border bg-surface-0 px-4 py-3 shadow-md">
          <Button
            onClick={() => update.mutate(
              Object.fromEntries(pendingKeys.map(k => [k, edits[k]]))
            )}
            loading={update.isPending}
          >
            {saved ? t('settings.profile_saved') : t('admin.save_changes')}
          </Button>
          <Button variant="ghost" onClick={() => setEdits({})}>
            {t('common.cancel')}
          </Button>
        </div>
      )}

      {chainKey && (
        <InheritanceChainWindow
          settingKey={chainKey}
          scope={scope}
          title={chainSetting ? settingLabel(t, chainSetting) : undefined}
          onClose={() => setChainKey(null)}
        />
      )}
    </div>
  )
}
