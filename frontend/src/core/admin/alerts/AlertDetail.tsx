import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, Ban, Check, CheckCircle2, ExternalLink, Hand, Layers, MessageSquare,
  RotateCcw, Send, Trash2, User,
} from 'lucide-react'
import {
  Button, Callout, Card, Combobox, Spinner, Textarea, useToast, type ComboboxOption,
} from '@ui'
import { formatAgo, formatWhen } from '../sections/format'
import { PRIV } from '../../authz/types'
import { usePrivileges } from '../../authz/usePrivileges'
import {
  useAlert, useAlertFacets, useAlertVerb, useAssignAlert, useCommentAlert, useSetAlertStatus,
} from './useAlerts'
import {
  actionLabel, alertSummary, alertTitle, eventLabel, kindLabel, severityLabel,
  skinOf, sourceLabel, statusLabel,
} from './labels'
import { actionHref, isOpen, type Alert, type AlertAction, type AlertEvent, type AlertStatus } from './types'
import { adminUrl } from '../adminAction'

/**
 * One alert: the context, what to do about it, and everything that has already
 * been done.
 *
 * The order on screen is the order of the operator's questions — *what is it*,
 * *what do I do*, *has anybody touched it*. The recommended actions sit above
 * the fold on purpose: an alert centre whose buttons are below a wall of
 * metadata is an alert centre people read and leave.
 */

// ── Recommended actions ──────────────────────────────────────────────────────

function ActionButtons({ alert, onExecute, busy }: {
  alert:     Alert
  onExecute: (verb: 'retry-jobs' | 'discard-jobs') => void
  busy:      boolean
}) {
  const { t } = useTranslation()

  // The server already dropped the actions the caller may not run, so an empty
  // list means "nothing this operator can do", not "nothing to do".
  if (alert.actions.length === 0) return null

  const render = (a: AlertAction, index: number) => {
    const label = actionLabel(t, a, alert)
    if (a.executes) {
      return (
        <Button
          key={a.id}
          variant={index === 0 ? 'primary' : 'secondary'}
          size="sm"
          disabled={busy}
          icon={a.id === 'retry-jobs' ? <RotateCcw size={14} /> : <Trash2 size={14} />}
          onClick={() => onExecute(a.id as 'retry-jobs' | 'discard-jobs')}
        >
          {label}
        </Button>
      )
    }
    return (
      <Link key={a.id} to={actionHref(a)}>
        <Button variant={index === 0 ? 'primary' : 'secondary'} size="sm" icon={<ExternalLink size={14} />}>
          {label}
        </Button>
      </Link>
    )
  }

  return (
    <Card className="mb-4" title={t('admin.al_actions_title')} subtitle={t('admin.al_actions_sub')}>
      <div className="flex flex-wrap gap-2">{alert.actions.map(render)}</div>
    </Card>
  )
}

// ── Timeline ─────────────────────────────────────────────────────────────────

const EVENT_ICON = {
  created:    Layers,
  status:     CheckCircle2,
  severity:   Hand,
  assigned:   User,
  comment:    MessageSquare,
  recurrence: RotateCcw,
} as const

function Timeline({ events }: { events: AlertEvent[] }) {
  const { t, i18n } = useTranslation()

  if (events.length === 0) {
    return <p className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>{t('admin.al_timeline_empty')}</p>
  }

  return (
    <ol className="min-w-0 space-y-3">
      {events.map(e => {
        const Icon = EVENT_ICON[e.kind] ?? Layers
        // A transition reads as "from → to"; a recurrence carries its running
        // count; a comment is its own body.
        const detail = e.kind === 'recurrence'
          ? t('admin.al_ev_recurrence_n', { n: e.to_value ?? '?' })
          : e.from_value || e.to_value
            ? `${translateValue(t, e.from_value)} → ${translateValue(t, e.to_value)}`
            : null

        return (
          <li key={e.id} className="flex min-w-0 items-start gap-2.5">
            <span className="mt-0.5 shrink-0 text-text-tertiary"><Icon size={15} /></span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-text-primary" style={{ fontSize: 'var(--kb-text-meta)' }}>
                  {eventLabel(t, e.kind)}
                </span>
                {detail && (
                  <span className="text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>{detail}</span>
                )}
                <span className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-micro)' }}>
                  {e.actor_label} · {formatWhen(e.occurred_at, i18n.language)}
                </span>
              </div>
              {e.body && (
                <p className="mt-0.5 break-words text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
                  {e.body}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

/** A transition value is a status, a severity or a person's name. */
function translateValue(t: ReturnType<typeof useTranslation>['t'], raw: string | null): string {
  if (!raw) return '—'
  const known = ['new', 'acknowledged', 'resolved', 'ignored']
  if (known.includes(raw)) return statusLabel(t, raw as AlertStatus)
  if (['critical', 'warning', 'info'].includes(raw)) return severityLabel(t, raw as 'critical')
  return raw
}

// ── The page ─────────────────────────────────────────────────────────────────

export default function AlertDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const { t, i18n } = useTranslation()
  const { can } = usePrivileges()
  const toast = useToast()
  const { data, isLoading, isError } = useAlert(id)
  const { data: facets } = useAlertFacets()
  const setStatus = useSetAlertStatus()
  const assign = useAssignAlert()
  const comment = useCommentAlert()
  const verb = useAlertVerb()
  const [draft, setDraft] = useState('')

  const canManage = can(PRIV.ALERTS_MANAGE)

  if (isLoading) return <div className="flex justify-center py-16"><Spinner /></div>

  if (isError || !data) {
    return (
      <div className="min-w-0">
        <Button variant="ghost" size="sm" icon={<ArrowLeft size={15} />} onClick={onBack}>
          {t('admin.al_back')}
        </Button>
        <Callout className="mt-3" variant="danger" title={t('admin.al_detail_error')} />
      </div>
    )
  }

  const { alert, timeline, related } = data
  const skin = skinOf(alert)

  const move = (status: AlertStatus) => setStatus.mutate(
    { id: alert.id, status },
    {
      onSuccess: () => toast.success(t('admin.al_toast_moved', { status: statusLabel(t, status) })),
      onError:   () => toast.error(t('admin.al_toast_failed')),
    },
  )

  const runVerb = (v: 'retry-jobs' | 'discard-jobs') => verb.mutate(
    { id: alert.id, verb: v },
    {
      onSuccess: () => toast.success(t(v === 'retry-jobs' ? 'admin.al_toast_retried' : 'admin.al_toast_discarded')),
      onError:   () => toast.error(t('admin.al_toast_failed')),
    },
  )

  const assigneeOptions: ComboboxOption[] = (facets?.assignees ?? []).map(a => ({ value: a.id, label: a.label }))

  const send = () => {
    const body = draft.trim()
    if (!body) return
    comment.mutate({ id: alert.id, comment: body }, {
      onSuccess: () => { setDraft(''); toast.success(t('admin.al_toast_commented')) },
      onError:   () => toast.error(t('admin.al_toast_failed')),
    })
  }

  return (
    <div className="min-w-0">
      <Button variant="ghost" size="sm" icon={<ArrowLeft size={15} />} onClick={onBack}>
        {t('admin.al_back')}
      </Button>

      {/* Header: what it is, how bad, and since when. */}
      <div className="mb-4 mt-2 min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className={`h-2 w-2 shrink-0 rounded-full ${skin.dot}`} aria-hidden />
          <h1 className="min-w-0 text-text-primary" style={{ fontSize: 'var(--kb-text-page)' }}>
            {alertTitle(t, alert)}
          </h1>
          <span className={`rounded-full px-1.5 py-0.5 ${skin.chip}`} style={{ fontSize: 'var(--kb-text-micro)' }}>
            {severityLabel(t, alert.severity)}
          </span>
          <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-text-secondary" style={{ fontSize: 'var(--kb-text-micro)' }}>
            {statusLabel(t, alert.status)}
          </span>
        </div>
        <p className="mt-1 max-w-prose text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>
          {alertSummary(t, alert)}
        </p>
      </div>

      <ActionButtons alert={alert} onExecute={runVerb} busy={verb.isPending} />

      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-4">
          {/* Lifecycle. Secondary buttons throughout: the project forbids a bold
              button, and "resolve" is not more legitimate than "ignore". */}
          {canManage && (
            <Card title={t('admin.al_lifecycle_title')}>
              <div className="flex flex-wrap gap-2">
                {alert.status !== 'acknowledged' && (
                  <Button variant="secondary" size="sm" icon={<Hand size={14} />} onClick={() => move('acknowledged')}>
                    {t('admin.al_take')}
                  </Button>
                )}
                {alert.status !== 'resolved' && (
                  <Button variant="secondary" size="sm" icon={<Check size={14} />} onClick={() => move('resolved')}>
                    {t('admin.al_resolve')}
                  </Button>
                )}
                {alert.status !== 'ignored' && (
                  <Button variant="secondary" size="sm" icon={<Ban size={14} />} onClick={() => move('ignored')}>
                    {t('admin.al_ignore')}
                  </Button>
                )}
                {!isOpen(alert.status) && (
                  <Button variant="secondary" size="sm" icon={<RotateCcw size={14} />} onClick={() => move('new')}>
                    {t('admin.al_reopen')}
                  </Button>
                )}
              </div>

              <div className="mt-3 max-w-sm">
                <label className="mb-1 block text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
                  {t('admin.al_assignee')}
                </label>
                <Combobox
                  value={alert.assignee_id}
                  onChange={(v) => assign.mutate({ id: alert.id, assignee_id: v }, {
                    onSuccess: () => toast.success(t('admin.al_toast_assigned')),
                    onError:   () => toast.error(t('admin.al_toast_assign_failed')),
                  })}
                  options={assigneeOptions}
                  placeholder={t('admin.al_assignee_none')}
                  searchPlaceholder={t('admin.al_assignee_search')}
                  emptyLabel={t('admin.al_assignee_empty')}
                  clearable
                  onClear={() => assign.mutate({ id: alert.id, assignee_id: null })}
                  aria-label={t('admin.al_assignee')}
                />
                <p className="mt-1 text-text-tertiary" style={{ fontSize: 'var(--kb-text-micro)' }}>
                  {t('admin.al_assignee_hint')}
                </p>
              </div>
            </Card>
          )}

          <Card title={t('admin.al_timeline_title')}>
            <Timeline events={timeline} />
            {canManage && (
              <div className="mt-4 border-t border-border pt-3">
                <Textarea
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  rows={2}
                  placeholder={t('admin.al_comment_ph')}
                  aria-label={t('admin.al_comment_ph')}
                />
                <div className="mt-2 flex justify-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Send size={14} />}
                    disabled={!draft.trim() || comment.isPending}
                    onClick={send}
                  >
                    {t('admin.al_comment_send')}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Context. Deliberately after the actions in the DOM as well as on
            screen: it answers "why", which is the second question. */}
        <div className="min-w-0 space-y-4">
          <Card title={t('admin.al_context_title')}>
            <dl className="space-y-1.5" style={{ fontSize: 'var(--kb-text-meta)' }}>
              <Row label={t('admin.al_field_kind')} value={kindLabel(t, alert.kind)} />
              <Row label={t('admin.al_field_source')} value={sourceLabel(t, alert.source)} />
              <Row label={t('admin.al_field_occurrences')} value={String(alert.occurrences)} />
              <Row label={t('admin.al_field_first_seen')} value={formatWhen(alert.first_seen_at, i18n.language)} />
              <Row label={t('admin.al_field_last_seen')} value={`${formatWhen(alert.last_seen_at, i18n.language)} (${formatAgo(alert.last_seen_at)})`} />
              {alert.module_id && <Row label={t('admin.al_field_module')} value={alert.module_id} />}
              {alert.subject_label && <Row label={t('admin.al_field_subject')} value={alert.subject_label} />}
              {alert.assignee_label && <Row label={t('admin.al_field_assignee')} value={alert.assignee_label} />}
              {alert.closed_at && <Row label={t('admin.al_field_closed')} value={formatWhen(alert.closed_at, i18n.language)} />}
            </dl>
          </Card>

          {related.length > 0 && (
            <Card title={t('admin.al_related_title')} subtitle={t('admin.al_related_sub')}>
              <ul className="min-w-0 space-y-2">
                {related.map(r => (
                  <li key={r.id} className="min-w-0">
                    <Link
                      to={adminUrl({ tab: 'alerts', params: { alert: r.id } })}
                      className="block truncate rounded-sm text-primary underline-offset-2 hover:underline
                                 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      style={{ fontSize: 'var(--kb-text-meta)' }}
                    >
                      {alertTitle(t, r)}
                    </Link>
                    <span className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-micro)' }}>
                      {statusLabel(t, r.status)} · {formatAgo(r.last_seen_at)}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 gap-2">
      <dt className="shrink-0 text-text-tertiary">{label}</dt>
      <dd className="min-w-0 break-words text-text-primary">{value}</dd>
    </div>
  )
}
