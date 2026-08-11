import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Checkbox } from '@ui'
import { Globe2, Unplug } from 'lucide-react'
import type { Privilege } from '../../authz/types'
import { useAuthzLabels } from '../../authz/labels'

/**
 * The privilege set of a role, banded by domain — read-only in the role sheet,
 * checkable in the editor.
 *
 * Wording comes from `useAuthzLabels`: the core's own translation for the
 * `core.*` catalogue and the functional groups, the label stored in the database
 * for anything a module declared (see `authz/labels.ts`).
 *
 * Two flags are shown rather than hidden, because hiding either makes a role
 * read as something it is not:
 *
 *   * **orphan** — the declaring module is gone. Greyed and labelled, never
 *     dropped: a role that silently displays fewer privileges than it grants is
 *     the worst possible lie for this screen.
 *   * **non-scopable** — cannot be confined to an organisational subtree. One of
 *     these anywhere in the role makes the whole role instance-only, so the
 *     editor has to make the culprits visible while they are being picked.
 */

/** A key present in a role but absent from the catalogue: shown as an orphan. */
function unknownPrivilege(key: string): Privilege {
  const [namespace = key, domain = '?', verb = '?'] = key.split('.')
  return {
    key, namespace, domain, verb,
    label: key, description: null,
    is_ou_scopable: false, is_orphan: true,
  }
}

export interface PrivilegeGroup { domain: string; items: Privilege[] }

/** Buckets keys by domain, in catalogue order, resolving each against `catalogue`. */
export function groupPrivileges(keys: string[], catalogue: Privilege[]): PrivilegeGroup[] {
  const byKey = new Map(catalogue.map(p => [p.key, p]))
  const groups = new Map<string, Privilege[]>()
  for (const key of keys) {
    const priv = byKey.get(key) ?? unknownPrivilege(key)
    const bucket = groups.get(priv.domain)
    if (bucket) bucket.push(priv)
    else groups.set(priv.domain, [priv])
  }
  return [...groups.entries()].map(([domain, items]) => ({ domain, items }))
}

function Flags({ priv }: { priv: Privilege }) {
  const { t } = useTranslation()
  return (
    <span className="flex items-center gap-1.5 shrink-0">
      {priv.is_orphan && (
        <span
          title={t('admin.priv_orphan_hint')}
          className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-full bg-surface-2 text-text-tertiary whitespace-nowrap"
        >
          <Unplug size={11} />{t('admin.priv_orphan')}
        </span>
      )}
      {!priv.is_ou_scopable && !priv.is_orphan && (
        <span
          title={t('admin.priv_not_scopable_hint')}
          className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-full bg-warning-light text-warning whitespace-nowrap"
        >
          <Globe2 size={11} />{t('admin.priv_instance_only')}
        </span>
      )}
    </span>
  )
}

export interface PrivilegeListProps {
  /** Keys to render. In the editor this is the whole catalogue. */
  keys:      string[]
  catalogue: Privilege[]
  /** Present → checkable editor; absent → read-only display. */
  selected?: Set<string>
  onToggle?: (key: string) => void
  /** Bleed the bands to a `px-5` parent's edges, like the surrounding cards. */
  bleed?:    boolean
}

export default function PrivilegeList({
  keys, catalogue, selected, onToggle, bleed = false,
}: PrivilegeListProps) {
  const { t } = useTranslation()
  const { domainLabel, privilegeLabel } = useAuthzLabels()
  const groups = useMemo(() => groupPrivileges(keys, catalogue), [keys, catalogue])
  const editing = !!selected && !!onToggle

  if (groups.length === 0) {
    return <p className="text-sm text-text-tertiary py-3">{t('admin.priv_none')}</p>
  }

  const pad = bleed ? 'px-5' : 'px-3'
  return (
    <div className={bleed ? '-mx-5' : ''}>
      {groups.map(g => (
        <div key={g.domain}>
          <p className={`${pad} py-2 bg-surface-1 text-sm font-semibold text-text-primary`}>
            {domainLabel(g.domain)}
          </p>
          {g.items.map(p => {
            const row = (
              <>
                <span className="min-w-0 flex-1">
                  <span className={`block text-sm ${p.is_orphan ? 'text-text-tertiary' : 'text-text-primary'}`}>
                    {privilegeLabel(p)}
                  </span>
                  <span className="block text-sm text-text-tertiary font-mono truncate">{p.key}</span>
                </span>
                <Flags priv={p} />
              </>
            )
            return editing ? (
              <div
                key={p.key}
                onClick={() => onToggle!(p.key)}
                className={`${pad} py-2 flex items-center gap-3 border-b border-border last:border-0 cursor-pointer hover:bg-surface-1 transition-colors`}
              >
                {/* The checkbox owns its own click (it renders a <label>): stop
                    the bubble so the row handler does not undo it. */}
                <span onClick={e => e.stopPropagation()}>
                  <Checkbox checked={selected!.has(p.key)} onChange={() => onToggle!(p.key)} />
                </span>
                {row}
              </div>
            ) : (
              <div
                key={p.key}
                className={`${pad} py-2.5 flex items-center gap-3 border-b border-border last:border-0`}
              >
                {row}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
