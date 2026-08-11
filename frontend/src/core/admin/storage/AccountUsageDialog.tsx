import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, HardDrive, Shield } from 'lucide-react'
import { Callout, EmptyState, ProgressBar, Spinner } from '@ui'
import { FloatingWindow } from '@ui/FloatingWindow'
import { formatAgo, formatBytes } from '../sections/format'
import { Figure } from './charts'
import { CategoryComposition, CategoryRows, DelegatedNote } from './CategoryBreakdown'
import { useCategoryReading, useCategoryRules } from './categories'
import { useAccountStorageUsage, type Consumer } from './api'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PRIVACY — the hard line this sheet is built around.
 *
 * This sheet shows VOLUMES, OBJECT COUNTS and TECHNICAL CATEGORIES. It must
 * NEVER show a file name, a folder name, a path, a MIME type, an extension or a
 * document title, and no such field may be added to it or to the endpoint it
 * reads. An administrator has to be able to size a server and settle a quota
 * dispute; they must not be able to reconstruct a person's life from the
 * administration console. "How much" is operations. "What" is surveillance.
 *
 * The server sends nothing of the sort today. If it ever does, this component
 * drops it rather than renders it.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ## What the four figures mean, and why they can disagree
 *
 *  * **Counter** — `used_bytes` on the account. The number enforcement reads:
 *    it, and nothing else, decides whether the next upload is refused.
 *  * **Billed by the modules** — what the modules say they charge this account.
 *    Content, bin and versions: what the person can free themselves.
 *  * **Actually held** — everything stored for them, charged or not. Thumbnails,
 *    indexes and caches live here and nowhere else. It is the disk figure.
 *  * **The gap** — counter minus billed, either way round. Both directions are
 *    reported and neither is hidden: bytes counted that no module claims mean a
 *    module went quiet or a deletion was never declared; bytes claimed that were
 *    never counted mean the counter under-reports and the account is writing
 *    past a ceiling it has already passed.
 *
 * `delegated` appears in none of them, on purpose — see `CategoryBreakdown`.
 */
export default function AccountUsageDialog({
  account, onClose, onEditQuota,
}: {
  account:      Consumer
  onClose:      () => void
  /** Offered only where the caller can actually write the quota. */
  onEditQuota?: () => void
}) {
  const { t } = useTranslation()
  const { data, isLoading, isError, refetch } = useAccountStorageUsage(account.id)

  const rules   = useCategoryRules(data?.catalog)
  const reading = useCategoryReading(data?.categories, rules, t)

  const name = account.display_name?.trim() || account.username

  // Whoever holds the most, first. Sorted on what is physically held rather
  // than on what is billed: this list is read to find where the room went.
  const modules = useMemo(
    () => [...(data?.modules ?? [])].sort(
      (a, b) => (b.held_bytes - a.held_bytes) || (b.billable_bytes - a.billable_bytes),
    ),
    [data],
  )

  return (
    <div onMouseDown={e => e.stopPropagation()}>
      <FloatingWindow
        title={t('admin.sto_acct_title', { name })}
        icon={<HardDrive size={16} />}
        onClose={onClose}
        defaultWidth={720}
        resizable
        backdrop
        t={t}
        actions={{
          confirm: onEditQuota
            ? { label: t('admin.sto_action_quota'), onClick: onEditQuota }
            : undefined,
          cancel: { label: t('admin.sto_acct_close') },
        }}
      >
        <div className="max-h-[70vh] overflow-y-auto overflow-x-hidden p-4">
          {isLoading && (
            <div className="flex justify-center py-12"><Spinner /></div>
          )}

          {isError && !isLoading && (
            <EmptyState
              icon={<HardDrive size={26} />}
              variant="error"
              compact
              title={t('admin.sto_acct_failed')}
              description={t('admin.sto_acct_failed_desc')}
              action={{ label: t('admin.sto_retry'), onClick: () => void refetch() }}
              t={t}
            />
          )}

          {data && !isLoading && (
            <div className="flex flex-col gap-5">
              {/* ── Who, and against what ceiling ─────────────────────────── */}
              <div>
                <p className="truncate text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
                  {account.email}
                </p>
                <div className="mt-2">
                  <ProgressBar
                    value={data.used_bytes}
                    max={Math.max(data.quota_bytes, 1)}
                    label={t('admin.sto_quota_current', {
                      used:  formatBytes(data.used_bytes),
                      quota: formatBytes(data.quota_bytes),
                    })}
                    showValue
                    t={t}
                  />
                </div>
              </div>

              {/* ── The four numbers ──────────────────────────────────────── */}
              <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-4">
                <Figure label={t('admin.sto_acct_fig_counter')}>{formatBytes(data.used_bytes)}</Figure>
                <Figure label={t('admin.sto_acct_fig_billed')}>{formatBytes(data.billable_bytes)}</Figure>
                <Figure label={t('admin.sto_acct_fig_held')}>{formatBytes(data.held_bytes)}</Figure>
                <Figure label={t('admin.sto_acct_fig_gap')}>
                  {data.unattributed_bytes > 0
                    ? `+${formatBytes(data.unattributed_bytes)}`
                    : data.over_declared_bytes > 0
                      ? `−${formatBytes(data.over_declared_bytes)}`
                      : t('admin.sto_acct_gap_none')}
                </Figure>
              </div>

              {/* Both directions are named. A gap folded into an absolute value
                  loses the only thing that tells the operator which side to go
                  looking at. */}
              {data.unattributed_bytes > 0 && (
                <Callout variant="warning" title={t('admin.sto_acct_gap_unclaimed_title')} t={t}>
                  {t('admin.sto_acct_gap_unclaimed_desc', { bytes: formatBytes(data.unattributed_bytes) })}
                </Callout>
              )}
              {data.over_declared_bytes > 0 && (
                <Callout variant="warning" title={t('admin.sto_acct_gap_uncounted_title')} t={t}>
                  {t('admin.sto_acct_gap_uncounted_desc', { bytes: formatBytes(data.over_declared_bytes) })}
                </Callout>
              )}

              {/* ── By category ───────────────────────────────────────────── */}
              <div className="border-t border-border pt-4">
                <h4 className="font-medium text-text-primary" style={{ fontSize: 'var(--kb-text-body)' }}>
                  {t('admin.sto_acct_cats_title')}
                </h4>
                <p className="mt-1 text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
                  {t('admin.sto_acct_cats_sub')}
                </p>
                <div className="mt-3">
                  <CategoryComposition
                    reading={reading}
                    heldBytes={data.held_bytes}
                    ariaLabel={t('admin.sto_acct_cats_aria')}
                    delegatedBytes={data.delegated_bytes}
                    delegatedObjects={data.delegated_objects}
                  />
                </div>
              </div>

              {/* ── By module ─────────────────────────────────────────────── */}
              <div className="border-t border-border pt-4">
                <h4 className="font-medium text-text-primary" style={{ fontSize: 'var(--kb-text-body)' }}>
                  {t('admin.sto_acct_mods_title')}
                </h4>

                {modules.length === 0 ? (
                  <p className="mt-2 text-text-tertiary" style={{ fontSize: 'var(--kb-text-body)' }}>
                    {t('admin.sto_acct_mods_empty')}
                  </p>
                ) : (
                  <div className="mt-3 flex flex-col gap-3">
                    {modules.map(m => (
                      <section key={m.module_id} className="rounded-lg border border-border">
                        <header className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border px-3 py-2">
                          <span className="min-w-0 flex-1 truncate font-medium text-text-primary"
                                style={{ fontSize: 'var(--kb-text-body)' }}>
                            {m.display_name}
                          </span>

                          {m.stale && (
                            <span className="inline-flex shrink-0 items-center gap-1 text-warning"
                                  style={{ fontSize: 'var(--kb-text-meta)' }}>
                              <AlertTriangle size={13} aria-hidden />
                              {t('admin.sto_mod_stale')}
                            </span>
                          )}

                          <span className="shrink-0 tabular-nums text-text-tertiary"
                                style={{ fontSize: 'var(--kb-text-meta)' }}>
                            {[
                              t('admin.sto_cat_objects', { n: m.object_count.toLocaleString(), count: m.object_count }),
                              t('admin.sto_acct_mod_held', { bytes: formatBytes(m.held_bytes) }),
                              m.last_declared_at
                                ? t('admin.sto_mod_declared', { ago: formatAgo(m.last_declared_at) })
                                : null,
                            ].filter(Boolean).join(' · ')}
                          </span>

                          <span className="shrink-0 tabular-nums text-text-primary"
                                style={{ fontSize: 'var(--kb-text-body)' }}>
                            {formatBytes(m.billable_bytes)}
                          </span>
                        </header>

                        <div className="px-3 py-1">
                          <CategoryRows rows={m.categories ?? []} rules={rules} />
                          <DelegatedNote
                            bytes={m.delegated_bytes}
                            objects={m.delegated_objects}
                            scope="module"
                            className="my-2"
                          />
                        </div>
                      </section>
                    ))}
                  </div>
                )}
              </div>

              {/* The line stated in the interface too, not only in the code: an
                  operator reading somebody's storage should be told out loud
                  what this screen does not know about them. */}
              <p className="flex items-start gap-2 border-t border-border pt-4 text-text-tertiary"
                 style={{ fontSize: 'var(--kb-text-meta)' }}>
                <Shield size={13} className="mt-0.5 shrink-0" aria-hidden />
                <span className="min-w-0">{t('admin.sto_acct_privacy')}</span>
              </p>
            </div>
          )}
        </div>
      </FloatingWindow>
    </div>
  )
}
