import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Check, Lock } from 'lucide-react'
import { FloatingWindow } from '@ui/FloatingWindow'
import { api } from '../../api/client'
import { scopeLabel } from './ProvenanceLine'
import type { ActiveScope, ChainResponse } from './scopeTypes'

const fmt = (v: unknown) =>
  typeof v === 'string' ? v : JSON.stringify(v)

/**
 * The whole chain of one setting, most general level first, with the winner
 * marked.
 *
 * "Where does this value come from" is answerable from the provenance line
 * alone; this window answers the follow-up an operator asks when the answer
 * surprises them — *which levels set it, and why did that one win*. Locked
 * levels are called out because they are the only reason a more specific level
 * can lose.
 */
export default function InheritanceChainWindow({
  settingKey, scope, onClose, title,
}: {
  settingKey: string
  scope:      ActiveScope
  onClose:    () => void
  /**
   * The name the control above used. Passed in rather than taken from the
   * server response so the window and the row it was opened from say the same
   * thing — the catalogue translates a key the database only stores once.
   */
  title?:     string
}) {
  const { t } = useTranslation()

  const { data } = useQuery({
    queryKey: ['setting-chain', settingKey, scope.type, scope.id],
    queryFn: () =>
      api
        .get<ChainResponse>(`/admin/settings/chain/${encodeURIComponent(settingKey)}`, {
          params: { scope_type: scope.type, scope_id: scope.id ?? undefined },
        })
        .then(r => r.data),
  })

  return (
    <FloatingWindow
      title={title ?? data?.label ?? settingKey}
      onClose={onClose}
      defaultWidth={520}
      backdrop
    >
      <div className="max-h-[60vh] overflow-y-auto p-4">
        <p className="mb-3 text-xs text-text-tertiary">{t('admin.chain_intro')}</p>

        <ol className="space-y-1">
          {(data?.levels ?? []).map((l, i) => (
            <li
              key={`${l.scope_type}-${l.scope_id ?? 'x'}-${i}`}
              className={`flex items-start gap-2 rounded-lg border px-3 py-2 ${
                l.is_winner ? 'border-primary bg-primary-light' : 'border-border bg-surface-1'
              }`}
              style={{ marginLeft: Math.min(i, 6) * 12 }}
            >
              <span className="mt-0.5 w-4 shrink-0">
                {l.is_winner && <Check size={14} className="text-primary" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm text-text-primary">
                    {scopeLabel(t, l.scope_type, l.scope_name)}
                  </span>
                  {l.is_own && (
                    <span className="rounded bg-surface-2 px-1.5 py-0.5 text-xs text-text-secondary">
                      {t('admin.chain_here')}
                    </span>
                  )}
                  {/* Tinted surface + neutral text, never amber text on the
                      card's own background — see ProvenanceLine. */}
                  {l.locked && (
                    <span className="inline-flex items-center gap-1 rounded bg-warning-light px-1.5 py-0.5 text-xs text-text-primary">
                      <Lock size={11} className="text-warning" />
                      {t('admin.chain_locked')}
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block break-all font-mono text-xs text-text-secondary">
                  {fmt(l.value)}
                </span>
              </span>
            </li>
          ))}
        </ol>

        {(data?.overrides.length ?? 0) > 0 && (
          <div className="mt-4 border-t border-border pt-3">
            <p className="mb-2 text-xs text-text-tertiary">
              {t('admin.chain_overrides_intro', { count: data?.overrides.length ?? 0 })}
            </p>
            <ul className="space-y-1">
              {data?.overrides.map(o => (
                <li key={`${o.scope_type}-${o.scope_id}`} className="flex items-center gap-2 text-sm text-text-secondary">
                  <span className="rounded bg-surface-2 px-1.5 py-0.5 text-xs">
                    {scopeLabel(t, o.scope_type, null)}
                  </span>
                  <span className="min-w-0 truncate">{o.scope_name}</span>
                  {o.locked && <Lock size={12} className="shrink-0 text-warning" />}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </FloatingWindow>
  )
}
