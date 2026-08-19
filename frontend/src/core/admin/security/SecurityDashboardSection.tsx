import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Info, Plus, RotateCcw, SlidersHorizontal } from 'lucide-react'
import { Button, Callout, Dropdown, EmptyState, Spinner } from '@ui'
import { PRIV } from '../../authz/types'
import { usePrivileges } from '../../authz/usePrivileges'
import type { AdminSectionProps } from '../sections/registry'
import { errorMessage, useSecurityDashboard, type SecurityPanel } from './api'
import PanelCard from '../panels/PanelCard'
import { reportUrl } from '../panels/report'
import { panelDef } from './panels'
import { applyLayout, usePanelLayout } from './usePanelLayout'

/**
 * Security dashboard — the instance's security posture, as panels of counted
 * facts, over a window the operator chooses.
 *
 * ## The rule this page is built on
 *
 * Every number is a `COUNT(*)` over a table the core itself writes. No
 * estimation, no extrapolation, no placeholder series. A panel with nothing to
 * count says so in words; a panel whose data lives somewhere the core cannot
 * read is **not rendered at all**.
 *
 * That last point is the whole architectural story. The console this page is
 * modelled on also charts message authentication, transport encryption, spam
 * filtering and external file shares. Those facts belong to modules, each of
 * which owns a PostgreSQL schema the core never reads — so the core cannot
 * produce them, and inventing a plausible curve would turn a security screen
 * into a reassurance machine. They will arrive the day a module *declares* them,
 * through a channel modelled on the storage-usage one; until then their absence
 * is the honest rendering, and the note under the grid says so out loud rather
 * than leaving the operator to assume the page is complete.
 *
 * ## Withheld, not empty
 *
 * Each panel is an instance-wide aggregate and is gated on its own privilege at
 * instance scope. A delegated administrator who holds `core.alerts.read` over one
 * unit is not shown an instance-wide alert count; the server withholds the panel
 * and names it, and the page says how many were withheld instead of quietly
 * rendering short.
 */
export default function SecurityDashboardSection({ navigate }: AdminSectionProps) {
  const { t } = useTranslation()
  const { can } = usePrivileges()
  const [period, setPeriod] = useState('last_30_days')
  const [editing, setEditing] = useState(false)

  const { data, isLoading, isError, error } = useSecurityDashboard(period)
  const { layout, hide, show, move, reset } = usePanelLayout()

  // Only panels this build knows how to title AND the server actually sent. An
  // older console must never invent a heading for a newer server's panel.
  const received = useMemo(() => {
    const map = new Map<string, SecurityPanel>()
    for (const p of data?.panels ?? []) if (panelDef(p.id)) map.set(p.id, p)
    return map
  }, [data])

  const visible = useMemo(
    () => applyLayout([...received.keys()], layout),
    [received, layout],
  )

  /** In the catalogue, received from the server, but put away by the operator. */
  const hiddenAvailable = useMemo(
    () => [...received.keys()].filter(id => !visible.includes(id)),
    [received, visible],
  )

  const periodOptions = useMemo(
    () => (data?.periods ?? [period]).map(id => ({
      value: id, label: t(`admin.sec_period_${id}`, { defaultValue: id }),
    })),
    [data?.periods, period, t],
  )

  /**
   * The panel's own report — the printable document, over the window currently
   * on screen.
   *
   * It used to open the report page the records live in (the audit trail, the
   * alert queue), which is a different scope over a different period and has
   * never been printable. That queue is still one click away, from the report
   * itself (`def.reportTab`); what "afficher le rapport" opens is now a report.
   */
  const openReport = useCallback((id: string) => {
    if (!panelDef(id)) return
    navigate(reportUrl('security', id, period))
  }, [navigate, period])

  if (!can(PRIV.AUDIT_READ)) {
    return (
      <EmptyState
        icon={<Info size={28} />}
        title={t('admin.sec_forbidden')}
        description={t('admin.sec_forbidden_desc')}
      />
    )
  }

  const bucket = data?.period.bucket ?? 'day'
  const withheldCount = data?.withheld.length ?? 0

  return (
    <div>
      {/* ── Header: the place, the window, and the way to rearrange it ── */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-text-primary" style={{ fontSize: 'var(--kb-text-page)' }}>
            {t('admin.nav_security_dashboard')}
          </h1>
          <p className="mt-1 max-w-2xl text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>
            {t('admin.sec_intro')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Dropdown
            value={period}
            onChange={setPeriod}
            options={periodOptions}
            width={200}
            focusable
          />
          <Button
            variant={editing ? 'primary' : 'secondary'}
            onClick={() => setEditing(v => !v)}
            icon={editing ? <Check size={15} /> : <SlidersHorizontal size={15} />}
          >
            {editing ? t('admin.sec_done') : t('admin.sec_customise')}
          </Button>
        </div>
      </div>

      {isError && (
        <Callout variant="danger" className="mb-4">
          {errorMessage(error, t('admin.sec_load_failed'))}
        </Callout>
      )}

      {/* ── What the window can actually reach ── */}
      {data && <RetentionNotice periodId={data.period.id} retention={data.retention} />}

      {isLoading && (
        <div className="flex justify-center py-16"><Spinner /></div>
      )}

      {/* ── The grid ── */}
      {data && visible.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((id, i) => {
            const def = panelDef(id)
            const panel = received.get(id)
            if (!def || !panel) return null
            return (
              <PanelCard
                key={id}
                def={def}
                panel={panel}
                bucket={bucket}
                editing={editing}
                canMoveUp={i > 0}
                canMoveDown={i < visible.length - 1}
                onHide={() => hide(id, visible)}
                onMove={d => move(id, d, visible)}
                onReport={() => openReport(id)}
              />
            )
          })}
        </div>
      )}

      {data && visible.length === 0 && (
        <EmptyState
          icon={<SlidersHorizontal size={28} />}
          title={t('admin.sec_all_hidden')}
          description={t('admin.sec_all_hidden_desc')}
          action={{ label: t('admin.sec_reset'), onClick: reset, variant: 'secondary' }}
        />
      )}

      {/* ── Put back what was put away ── */}
      {editing && data && (
        <div className="mt-6 rounded-xl border border-border bg-surface-1 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-text-primary" style={{ fontSize: 'var(--kb-text-heading)' }}>
              {t('admin.sec_hidden_panels')}
            </h2>
            <Button variant="ghost" onClick={reset} icon={<RotateCcw size={14} />}>
              {t('admin.sec_reset')}
            </Button>
          </div>
          {hiddenAvailable.length === 0 ? (
            <p className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
              {t('admin.sec_nothing_hidden')}
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {hiddenAvailable.map(id => {
                const def = panelDef(id)
                if (!def) return null
                return (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => show(id, visible)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-0
                                 px-2.5 py-1.5 text-text-secondary hover:bg-surface-2"
                      style={{ fontSize: 'var(--kb-text-body)' }}
                    >
                      <Plus size={14} aria-hidden />
                      {t(def.titleKey)}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}

      {/* ── What this page does NOT measure, said out loud ── */}
      {data && (
        <div className="mt-6 rounded-xl border border-border bg-surface-1 p-4">
          <h2 className="mb-1 text-text-primary" style={{ fontSize: 'var(--kb-text-heading)' }}>
            {t('admin.sec_gaps_title')}
          </h2>
          <p className="max-w-3xl text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>
            {t('admin.sec_gaps_body')}
          </p>
          {withheldCount > 0 && (
            <p className="mt-2 text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
              {t('admin.sec_withheld', { count: withheldCount })}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Says when the chosen window reaches further back than a source can answer.
 *
 * Without it, a 180-day reading of the rule log opens on ninety flat weeks that
 * read as a quiet quarter, when they are a purged one — the single most likely
 * way for this page to mislead.
 */
function RetentionNotice({
  periodId, retention,
}: {
  periodId:  string
  retention: { audit_days: number; alerts_days: number; rule_executions_days: number }
}) {
  const { t } = useTranslation()
  const DAYS: Record<string, number> = {
    last_180_days: 180, last_90_days: 90, last_30_days: 30, last_7_days: 7,
  }
  const asked = DAYS[periodId] ?? 0
  const shortest = Math.min(retention.audit_days, retention.alerts_days, retention.rule_executions_days)
  if (asked <= shortest) return null
  return (
    <Callout variant="info" className="mb-4">
      {t('admin.sec_retention_notice', { days: asked, kept: shortest })}
    </Callout>
  )
}
