import { useTranslation } from 'react-i18next'
import { Download, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Badge, Button, Callout, EmptyState, ProgressBar } from '@ui'
import { formatBytes, formatDay } from '../../../admin/sections/format'
import { downloadUrl, type MyExportOverview, type MyExportRun } from './api'

/**
 * Step 3 — following the request, and fetching the archive.
 *
 * ## Everything on screen is a fact the server resolved
 *
 * `downloadable` and `downloads_left` are computed server-side and simply
 * displayed: a browser deriving them from `available_at`, `expires_at` and two
 * counters would eventually disagree with the route that enforces them, and the
 * disagreement always surfaces as a button that fails.
 *
 * ## Why there is no "cancel"
 *
 * One request at a time per account, and a personal archive takes minutes rather
 * than hours. A cancel button would exist to undo a mistaken selection, and its
 * cost — a second write path into a run the producer is walking through — is out
 * of proportion with waiting for a small export to finish.
 */
export interface RequestStatusProps {
  data:     MyExportOverview
  locale:   string
  /** Start a new request: shown once nothing is under way. */
  onRestart: () => void
}

function StatusBadge({ run }: { run: MyExportRun }) {
  const { t } = useTranslation()
  switch (run.status) {
    case 'pending':
    case 'running':
      return <Badge variant="primary">{t('settings.mde_st_running', { defaultValue: 'En cours' })}</Badge>
    case 'ready':
      return run.downloadable
        ? <Badge variant="success">{t('settings.mde_st_ready', { defaultValue: 'Prête' })}</Badge>
        : <Badge variant="neutral">{t('settings.mde_st_over', { defaultValue: 'Terminée' })}</Badge>
    case 'expired':
      return <Badge variant="neutral">{t('settings.mde_st_expired', { defaultValue: 'Expirée' })}</Badge>
    case 'cancelled':
      return <Badge variant="neutral">{t('settings.mde_st_cancelled', { defaultValue: 'Annulée' })}</Badge>
    default:
      return <Badge variant="danger">{t('settings.mde_st_failed', { defaultValue: 'Échec' })}</Badge>
  }
}

export default function RequestStatus({ data, locale, onRestart }: RequestStatusProps) {
  const { t } = useTranslation()
  const active = data.active
  const latest = data.history.find(r => r.status === 'ready' && r.downloadable)
  const past   = data.history.filter(r => r.id !== active?.id && r.id !== latest?.id)

  return (
    <div className="space-y-4">
      {/* ── Under way ─────────────────────────────────────────────────── */}
      {active && (
        <div className="rounded-lg border border-border bg-surface-1 p-4">
          <div className="flex items-center gap-2">
            <Clock size={18} className="shrink-0 text-text-secondary" />
            <p className="text-text-primary font-medium" style={{ fontSize: 'var(--kb-text-body)' }}>
              {t('settings.mde_building', { defaultValue: 'Votre archive est en préparation' })}
            </p>
          </div>
          <div className="mt-3">
            <ProgressBar
              value={data.progress?.percent ?? 0}
              variant="primary"
              indeterminate={!data.progress || data.progress.subjects_total === 0}
            />
          </div>
          <p className="mt-3 text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
            {t('settings.mde_building_desc', {
              defaultValue:
                'Selon le volume de vos données, cela prend de quelques minutes à plusieurs heures. Vous pouvez fermer cette page : la préparation continue, et vous retrouverez l’archive ici.',
            })}
          </p>
        </div>
      )}

      {/* ── Ready ─────────────────────────────────────────────────────── */}
      {latest && (
        <div className="rounded-lg border border-border bg-surface-1 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <CheckCircle2 size={18} className="shrink-0 text-success" />
            <p className="text-text-primary font-medium" style={{ fontSize: 'var(--kb-text-body)' }}>
              {t('settings.mde_ready', { defaultValue: 'Votre archive est prête' })}
            </p>
            <StatusBadge run={latest} />
          </div>

          <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2"
              style={{ fontSize: 'var(--kb-text-meta)' }}>
            <div className="flex justify-between gap-3">
              <dt className="text-text-secondary">
                {t('settings.mde_size', { defaultValue: 'Taille' })}
              </dt>
              <dd className="text-text-primary">{formatBytes(latest.size_bytes ?? 0)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-text-secondary">
                {t('settings.mde_expires', { defaultValue: 'Expire le' })}
              </dt>
              <dd className="text-text-primary">{formatDay(latest.expires_at, locale)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-text-secondary">
                {t('settings.mde_left', { defaultValue: 'Téléchargements restants' })}
              </dt>
              <dd className="text-text-primary">
                {latest.downloads_left ?? t('settings.mde_unlimited', { defaultValue: 'illimité' })}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-text-secondary">
                {t('settings.mde_requested', { defaultValue: 'Demandée le' })}
              </dt>
              <dd className="text-text-primary">{formatDay(latest.requested_at, locale)}</dd>
            </div>
          </dl>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              icon={<Download size={16} />}
              // A full-page navigation, not an XHR: the browser streams the
              // archive to disk with its own progress, and nothing of it ever
              // sits in this tab's memory.
              onClick={() => { window.location.href = downloadUrl(latest.id) }}
            >
              {t('settings.mde_download', { defaultValue: 'Télécharger' })}
            </Button>
            {!active && (
              <Button variant="secondary" onClick={onRestart}>
                {t('settings.mde_new', { defaultValue: 'Nouvelle demande' })}
              </Button>
            )}
          </div>

          <p className="mt-3 text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
            {t('settings.mde_keep_safe', {
              defaultValue:
                'Cette archive contient des données personnelles. Le serveur la supprimera à la date indiquée ; le fichier que vous aurez téléchargé, lui, reste sous votre responsabilité.',
            })}
          </p>
        </div>
      )}

      {/* ── Nothing at all ────────────────────────────────────────────── */}
      {!active && !latest && (
        <EmptyState
          icon={<Download size={26} />}
          variant="first-use"
          title={t('settings.mde_none', { defaultValue: 'Aucune archive disponible' })}
          description={t('settings.mde_none_desc', {
            defaultValue: 'Demandez un export pour récupérer une copie de vos données.',
          })}
          action={{
            label: t('settings.mde_new', { defaultValue: 'Nouvelle demande' }),
            onClick: onRestart,
          }}
        />
      )}

      {/* ── Previous requests ─────────────────────────────────────────── */}
      {past.length > 0 && (
        <div>
          <p className="mb-2 text-text-secondary font-medium"
             style={{ fontSize: 'var(--kb-text-body)' }}>
            {t('settings.mde_history', { defaultValue: 'Demandes précédentes' })}
          </p>
          <ul className="rounded-lg border border-border divide-y divide-border overflow-hidden">
            {past.map(run => (
              <li key={run.id}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 bg-surface-0 px-4 py-2.5">
                <span className="text-text-primary" style={{ fontSize: 'var(--kb-text-meta)' }}>
                  {formatDay(run.requested_at, locale)}
                </span>
                <StatusBadge run={run} />
                <span className="ml-auto text-text-secondary"
                      style={{ fontSize: 'var(--kb-text-meta)' }}>
                  {run.size_bytes ? formatBytes(run.size_bytes) : '—'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* A failure is stated in the person's own terms, with the only useful
          next step, rather than left as a status word in a list. */}
      {data.history[0]?.status === 'failed' && (
        <Callout variant="warning" icon={<AlertTriangle size={18} />}>
          {t('settings.mde_failed_desc', {
            defaultValue:
              'La dernière préparation n’a pas abouti. Vous pouvez en relancer une ; si cela se reproduit, signalez-le à l’administrateur de votre instance.',
          })}
        </Callout>
      )}
    </div>
  )
}
