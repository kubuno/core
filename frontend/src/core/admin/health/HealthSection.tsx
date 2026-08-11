import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  AlertTriangle, BellOff, EyeOff, HeartPulse, MoreVertical, RefreshCw, Undo2,
} from 'lucide-react'
import {
  Accordion, Button, Callout, Card, EmptyState, MenuDropdown, ProgressBar, Spinner,
  useMenuDropdown, useToast, type AccordionItemDef, type MenuItem,
} from '@ui'
import { formatWhen } from '../sections/format'
import { PRIV } from '../../authz/types'
import { usePrivileges } from '../../authz/usePrivileges'
import {
  blockLabel, checkActionLabel, checkTitle, checkValue, checkWhy, severityLabel,
  skinOf, statusLabel,
} from './labels'
import { useHealthChecks, useMuteCheck, useRefreshHealthChecks } from './useHealthChecks'
import { actionHref, BLOCK_ORDER, isFailing, SEVERITY_RANK, type HealthCheck } from './types'

/**
 * "Instance health" — the permanent page.
 *
 * It replaces the placeholder that used to sit three levels deep under
 * Security ▸ Security centre. Depth was the problem: a page that says the
 * instance has no backups is not something an operator finds by exploring, so
 * it now hangs directly off Security, and its findings are surfaced on the
 * landing page and in a banner on every administration screen.
 *
 * Everything shown here is computed server-side (`crate::health`). The page
 * sorts and paints; it never decides.
 */

// ── One row ──────────────────────────────────────────────────────────────────

function CheckRow({ check, canManage }: { check: HealthCheck; canManage: boolean }) {
  const { t, i18n } = useTranslation()
  const toast = useToast()
  const menu = useMenuDropdown()
  const refresh = useRefreshHealthChecks()
  const mute = useMuteCheck()
  const skin = skinOf(check)

  const failing = isFailing(check.status)
  const muted = check.status === 'ignored'

  const setMuted = (next: boolean) => {
    mute.mutate(
      { id: check.id, muted: next },
      {
        onSuccess: () => toast.success(
          next ? t('admin.hc_toast_ignored') : t('admin.hc_toast_restored'),
        ),
        onError: () => toast.error(t('admin.hc_toast_failed')),
      },
    )
  }

  const items: MenuItem[] = [
    {
      type: 'action',
      label: t('admin.hc_menu_recheck'),
      icon: <RefreshCw size={15} />,
      onClick: () => refresh.mutate(undefined, {
        onError: () => toast.error(t('admin.hc_toast_failed')),
      }),
    },
    ...(canManage && check.ignorable
      ? [{
          type: 'action' as const,
          label: muted ? t('admin.hc_menu_restore') : t('admin.hc_menu_ignore'),
          icon: muted ? <Undo2 size={15} /> : <BellOff size={15} />,
          onClick: () => setMuted(!muted),
        }]
      : []),
  ]

  return (
    <li className="border-t border-border px-4 py-3 first:border-t-0">
      {/* Mobile stacks: pill + title, then value, then the action. From `sm`
          the action moves opposite the text. */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${skin.dot}`} aria-hidden />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-text-primary">{checkTitle(t, check)}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 ${skin.chip}`}
                  style={{ fontSize: 'var(--kb-text-micro)' }}
                >
                  {failing ? severityLabel(t, check.severity) : statusLabel(t, check.status)}
                </span>
              </div>
              <p className="mt-0.5 text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
                {checkValue(t, check, i18n.language)}
              </p>
              <p
                className="mt-1 max-w-prose leading-relaxed text-text-tertiary"
                style={{ fontSize: 'var(--kb-text-meta)' }}
              >
                {checkWhy(t, check)}
              </p>
              {muted && check.muted && (
                <p className="mt-1 text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
                  {t('admin.hc_muted_by', {
                    who: check.muted.by_label ?? t('admin.hc_muted_unknown'),
                    when: formatWhen(check.muted.at, i18n.language),
                  })}
                </p>
              )}
              {check.doc_href && (
                <a
                  href={check.doc_href}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block rounded-sm text-primary underline-offset-2 hover:underline
                             focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  style={{ fontSize: 'var(--kb-text-meta)' }}
                >
                  {t('admin.hc_doc')}
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 self-start ps-4 sm:ps-0">
          {check.action && failing && (
            <Link to={actionHref(check.action)}>
              <Button variant="secondary" size="sm">{checkActionLabel(t, check)}</Button>
            </Link>
          )}
          <button
            type="button"
            aria-label={t('admin.hc_menu_label')}
            onClick={menu.open}
            className="rounded-md p-1.5 text-text-secondary transition-colors
                       hover:bg-surface-2 hover:text-text-primary
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <MoreVertical size={16} />
          </button>
          {menu.pos && <MenuDropdown items={items} pos={menu.pos} onClose={menu.close} minWidth={200} />}
        </div>
      </div>
    </li>
  )
}

// ── The page ─────────────────────────────────────────────────────────────────

export default function HealthSection() {
  const { t, i18n } = useTranslation()
  const { can } = usePrivileges()
  const toast = useToast()
  const { data, isLoading, isError, refetch } = useHealthChecks()
  const refresh = useRefreshHealthChecks()
  // Blocks holding something to settle open by default: a collapsed accordion
  // hiding the one critical finding would defeat the page.
  const [open, setOpen] = useState<string[] | null>(null)

  const canManage = can(PRIV.SETTINGS_MANAGE)

  const byBlock = useMemo(() => {
    const map = new Map<string, HealthCheck[]>()
    for (const c of data?.checks ?? []) {
      const list = map.get(c.block) ?? []
      list.push(c)
      map.set(c.block, list)
    }
    for (const list of map.values()) {
      list.sort((a, b) => {
        // Still to settle first, then by severity, then by title — so the row
        // that needs attention is never below a row that does not.
        const fa = isFailing(a.status) ? 0 : 1
        const fb = isFailing(b.status) ? 0 : 1
        if (fa !== fb) return fa - fb
        return SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
      })
    }
    return map
  }, [data])

  const defaultOpen = useMemo(
    () => BLOCK_ORDER.filter(b => (byBlock.get(b) ?? []).some(c => isFailing(c.status))),
    [byBlock],
  )

  if (isLoading) {
    return <div className="flex justify-center py-16"><Spinner /></div>
  }

  if (isError || !data) {
    return (
      <EmptyState
        icon={<AlertTriangle size={26} />}
        variant="error"
        title={t('admin.hc_error_title')}
        description={t('admin.hc_error_body')}
        action={{ label: t('admin.hc_retry'), onClick: () => void refetch() }}
      />
    )
  }

  if (data.checks.length === 0) {
    return (
      <EmptyState
        icon={<EyeOff size={26} />}
        variant="unavailable"
        title={t('admin.hc_none_title')}
        description={t('admin.hc_none_body')}
      />
    )
  }

  const { counts, score } = data
  const scoreable = counts.ok + counts.todo + counts.blocked
  const items: AccordionItemDef[] = BLOCK_ORDER
    .filter(b => (byBlock.get(b) ?? []).length > 0)
    .map(b => {
      const rows = byBlock.get(b) ?? []
      const pending = rows.filter(c => isFailing(c.status)).length
      return {
        id: b,
        title: blockLabel(t, b),
        badge: pending > 0 ? pending : undefined,
        content: (
          <ul className="-mx-4 -mb-3 min-w-0">
            {rows.map(c => <CheckRow key={c.id} check={c} canManage={canManage} />)}
          </ul>
        ),
      }
    })

  const onRefreshAll = () => refresh.mutate(undefined, {
    onSuccess: () => toast.success(t('admin.hc_toast_rechecked')),
    onError: () => toast.error(t('admin.hc_toast_failed')),
  })

  return (
    <div className="min-w-0">
      <Card
        className="mb-4"
        icon={<HeartPulse size={18} />}
        // No title: the page already carries "Instance health" as its <h1>, and
        // repeating it inside the card only starved the header row — at 390 px
        // the duplicate was truncated to "Santé de l'insta…" next to the button.
        subtitle={t('admin.hc_generated', { when: formatWhen(data.generated_at, i18n.language) })}
        actions={
          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCw size={14} />}
            loading={refresh.isPending}
            onClick={onRefreshAll}
          >
            {t('admin.hc_recheck_all')}
          </Button>
        }
      >
        {score !== null && (
          <>
            <div className="mb-2 flex items-baseline gap-2">
              <span className="text-text-primary" style={{ fontSize: 'var(--kb-text-page)' }}>
                {score}
              </span>
              <span className="text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>
                {t('admin.hc_score_of_100')}
              </span>
            </div>
            <ProgressBar
              value={score}
              max={100}
              variant={counts.critical > 0 ? 'danger' : counts.warning > 0 ? 'warning' : 'success'}
            />
          </>
        )}
        <p className="mt-3 text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>
          {t('admin.hc_summary', {
            ok: counts.ok,
            total: scoreable,
            pending: counts.todo + counts.blocked,
          })}
          {counts.ignored > 0 && ` · ${t('admin.hc_summary_ignored', { count: counts.ignored })}`}
        </p>
      </Card>

      {counts.critical > 0 && (
        <Callout className="mb-4" variant="danger" title={t('admin.hc_banner_critical_title', { n: counts.critical })}>
          {t('admin.hc_banner_critical_body')}
        </Callout>
      )}

      <Accordion
        items={items}
        open={open ?? defaultOpen}
        onOpenChange={setOpen}
      />
    </div>
  )
}
