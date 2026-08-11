import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronRight, Clock, KeyRound, Search, X } from 'lucide-react'
import { Badge, Checkbox, Combobox, EmptyState, Input } from '@ui'
import { useAuthzLabels } from '../../authz/labels'
import type { TokenScope } from '../../types'

/**
 * Scope selector for a new API token.
 *
 * A tree by functional group rather than a flat list: the catalogue is already
 * around thirty entries and grows with every module that declares its own, and
 * "what can this key touch" is a question about subjects (accounts, settings,
 * modules), not about an alphabetical list of dotted strings.
 *
 * The list is whatever `GET /me/api-tokens/scopes` returned, which is exactly
 * what the creator holds at that instant — so the picker cannot offer a choice
 * the server will refuse. Nothing is pre-selected: there is no "all" default, and
 * offering one would quietly recreate the credential this work exists to remove.
 *
 * Scopes are privileges, so their wording goes through `useAuthzLabels`: the
 * core's translation for its own catalogue, the stored label for whatever a
 * module declared.
 */
export function ApiTokenScopePicker({
  scopes,
  selected,
  onChange,
}: {
  scopes:   TokenScope[]
  selected: string[]
  onChange: (keys: string[]) => void
}) {
  const { t } = useTranslation()
  const { domainLabel, privilegeLabel, privilegeDescription } = useAuthzLabels()
  const [query, setQuery] = useState('')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const chosen = useMemo(() => new Set(selected), [selected])

  // Group by domain, preserving the server's ordering (namespace, domain, verb)
  // so the same instance always renders the same tree.
  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase()
    // Matched on the displayed wording, so a search types what the eye reads.
    const match = (s: TokenScope) =>
      !needle ||
      privilegeLabel(s).toLowerCase().includes(needle) ||
      s.key.toLowerCase().includes(needle) ||
      (privilegeDescription(s) ?? '').toLowerCase().includes(needle)

    const byDomain = new Map<string, TokenScope[]>()
    for (const s of scopes) {
      if (!match(s)) continue
      const list = byDomain.get(s.domain)
      if (list) list.push(s)
      else byDomain.set(s.domain, [s])
    }
    return [...byDomain.entries()]
  }, [scopes, query, privilegeLabel, privilegeDescription])

  const toggle = (key: string) => {
    const next = new Set(chosen)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    onChange([...next])
  }

  const toggleGroup = (keys: string[], allOn: boolean) => {
    const next = new Set(chosen)
    for (const k of keys) {
      if (allOn) next.delete(k)
      else next.add(k)
    }
    onChange([...next])
  }

  if (scopes.length === 0) {
    return (
      <EmptyState
        icon={<KeyRound size={26} />}
        title={t('settings.tok_scopes_empty_title')}
        description={t('settings.tok_scopes_empty_desc')}
        variant="no-results"
        compact
        t={t}
      />
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 relative">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none"
          />
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('settings.tok_scopes_search')}
            className="pl-8"
            aria-label={t('settings.tok_scopes_search')}
          />
        </div>
        {/* Quick pick for someone who knows the key they want, next to the tree
            for someone who is discovering the catalogue. */}
        <Combobox
          value={null}
          onChange={(key) => { if (key && !chosen.has(key)) toggle(key) }}
          options={scopes
            .filter((s) => !chosen.has(s.key))
            .map((s) => ({ value: s.key, label: `${privilegeLabel(s)} — ${s.key}` }))}
          placeholder={t('settings.tok_scopes')}
          searchPlaceholder={t('settings.tok_scopes_search')}
          width={220}
          maxHeight={280}
          t={t}
        />
      </div>

      {selected.length > 0 && (
        <div className="flex items-start gap-2 flex-wrap">
          {selected.map((key) => {
            const scope = scopes.find((s) => s.key === key)
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggle(key)}
                title={t('settings.tok_scopes_clear')}
                className="inline-flex items-center gap-1 rounded-full bg-primary-light text-primary
                           px-2 py-0.5 text-xs hover:bg-primary hover:text-white transition-colors"
              >
                {scope ? privilegeLabel(scope) : key}
                <X size={11} />
              </button>
            )
          })}
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-xs text-text-tertiary hover:text-text-primary px-1 py-0.5"
          >
            {t('settings.tok_scopes_clear')}
          </button>
        </div>
      )}

      <div className="max-h-72 overflow-y-auto rounded-lg border border-border divide-y divide-border">
        {groups.map(([domain, items]) => {
          const keys = items.map((s) => s.key)
          const allOn = keys.every((k) => chosen.has(k))
          const isOpen = !collapsed.has(domain)
          return (
            <div key={domain}>
              <div className="flex items-center gap-2 px-3 py-2 bg-surface-1">
                <button
                  type="button"
                  onClick={() => {
                    const next = new Set(collapsed)
                    if (isOpen) next.add(domain)
                    else next.delete(domain)
                    setCollapsed(next)
                  }}
                  className="flex items-center gap-1.5 flex-1 min-w-0 text-left text-text-primary"
                  aria-expanded={isOpen}
                >
                  <ChevronRight
                    size={13}
                    className={`shrink-0 text-text-tertiary transition-transform ${isOpen ? 'rotate-90' : ''}`}
                  />
                  <span className="text-xs font-medium truncate">{domainLabel(domain)}</span>
                  <span className="text-xs text-text-tertiary shrink-0">
                    {keys.filter((k) => chosen.has(k)).length}/{keys.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleGroup(keys, allOn)}
                  className="text-xs text-text-secondary hover:text-primary shrink-0"
                >
                  {t('settings.tok_scopes_group_all')}
                </button>
              </div>

              {isOpen && (
                <div className="px-3 py-1.5 space-y-1.5">
                  {items.map((s) => (
                    <div key={s.key} className="flex items-start gap-2">
                      <Checkbox
                        checked={chosen.has(s.key)}
                        onChange={() => toggle(s.key)}
                        label={privilegeLabel(s)}
                        description={privilegeDescription(s) ?? undefined}
                        className="flex-1 min-w-0"
                      />
                      {s.requires_expiry && (
                        <Badge variant="warning" size="sm">
                          <Clock size={10} className="inline mr-0.5 -mt-px" />
                          {t('settings.tok_scope_requires_expiry')}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
        {groups.length === 0 && (
          <p className="px-3 py-4 text-xs text-text-tertiary text-center">
            {t('settings.tok_scopes_empty_title')}
          </p>
        )}
      </div>
    </div>
  )
}

/** Read-only rendering of a token's scopes, for the listing. */
export function TokenScopeList({ scopes }: { scopes: string[] }) {
  const { t } = useTranslation()
  if (scopes.length === 0) {
    return <span className="text-xs text-text-tertiary">{t('settings.tok_no_scopes')}</span>
  }
  return (
    <div className="flex flex-wrap gap-1">
      {scopes.map((key) => (
        <code
          key={key}
          className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-surface-2 text-text-secondary"
        >
          {key}
        </code>
      ))}
    </div>
  )
}
