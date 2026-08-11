// One domain's sheet: the proof, the mail diagnosis, and the two acts that are
// hard to undo.
//
// The verification card is the reason this screen exists. It shows the exact
// three fields a registrar's form asks for — type, name, value — each with a
// copy button, because the single most common failure is a value retyped by
// hand with a character dropped. What the last probe saw is printed underneath:
// "non vérifié" alone sends somebody to check their zone file; "l'enregistrement
// n'a pas été trouvé, en voici d'autres publiés ici" tells them what to fix.

import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, Copy, RefreshCw, ShieldCheck, Trash2, Star } from 'lucide-react'
import { Badge, Button, Callout, Card, useToast } from '@ui'
import ConfirmDialog from '@ui/ConfirmDialog'
import { useConfirm } from '../../../hooks/useConfirm'
import { useAdminCrumbs } from '../../AdminBreadcrumb'
import DomainDiagnosticsCard from './DomainDiagnosticsCard'
import {
  errorMessage, useDomainDetail, usePromoteDomain, useRemoveDomain, useVerifyDomain,
} from './api'

/** One line of the DNS record, with the value people actually mistype. */
function RecordField({ label, value }: { label: string; value: string }) {
  const { t } = useTranslation()
  const toast = useToast()
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-text-secondary" style={{ fontSize: 'var(--kb-text-small)' }}>{label}</span>
      <div className="flex min-w-0 items-center gap-2 rounded border border-border bg-surface-1 px-2 py-1.5">
        <code className="min-w-0 flex-1 truncate font-mono text-text-primary" style={{ fontSize: 'var(--kb-text-body)' }}>
          {value}
        </code>
        <button
          type="button"
          className="shrink-0 rounded p-1 text-text-tertiary transition-colors hover:bg-surface-2 hover:text-text-primary"
          title={t('admin.dom_copy')}
          aria-label={t('admin.dom_copy')}
          onClick={() => {
            void navigator.clipboard?.writeText(value)
            toast.success(t('admin.dom_copied'))
          }}
        >
          <Copy size={14} />
        </button>
      </div>
    </div>
  )
}

export default function DomainDetail({
  domainId, canManage, onGone,
}: {
  domainId: string
  canManage: boolean
  /** Called after a removal, so the page can return to the list. */
  onGone: () => void
}) {
  const { t } = useTranslation()
  const toast = useToast()
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm()
  const [error, setError] = useState<string | null>(null)

  const { data, isLoading } = useDomainDetail(domainId)
  const verify   = useVerifyDomain()
  const promote  = usePromoteDomain()
  const remove   = useRemoveDomain()

  const domain = data?.domain
  const name   = domain?.name ?? ''
  useAdminCrumbs(useMemo(() => (name ? [{ label: name, title: name }] : []), [name]))

  if (isLoading || !domain) {
    return <p className="text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>{t('admin.dom_loading')}</p>
  }

  const fail = (e: unknown) => setError(errorMessage(e, t('admin.dom_save_failed')))
  const blockers = data?.removal_blockers ?? []

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="min-w-0 text-text-primary" style={{ fontSize: 'var(--kb-text-section)' }}>{domain.name}</h2>
        {domain.kind === 'primary'   && <Badge variant="primary">{t('admin.dom_kind_primary')}</Badge>}
        {domain.kind === 'secondary' && <Badge variant="neutral">{t('admin.dom_kind_secondary')}</Badge>}
        {domain.kind === 'alias'     && <Badge variant="neutral">{t('admin.dom_alias_of', { name: domain.parent_name })}</Badge>}
        {domain.verified
          ? <Badge variant="success">{t('admin.dom_verified')}</Badge>
          : <Badge variant="warning">{t('admin.dom_unverified')}</Badge>}
      </div>

      {error && <p className="text-danger" role="alert" style={{ fontSize: 'var(--kb-text-body)' }}>{error}</p>}

      {/* ── The proof ─────────────────────────────────────────────────── */}
      <Card title={<span className="flex items-center gap-2"><ShieldCheck size={16} /> {t('admin.dom_proof_title')}</span>}>
        <div className="flex flex-col gap-3 p-1">
          {domain.verified ? (
            <p className="flex items-center gap-2 text-text-primary" style={{ fontSize: 'var(--kb-text-body)' }}>
              <CheckCircle2 size={16} className="text-success" />
              {t('admin.dom_proof_done')}
            </p>
          ) : (
            <p className="text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>
              {t('admin.dom_proof_intro', { name: domain.name })}
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-[8rem_1fr_2fr]">
            <RecordField label={t('admin.dom_record_type')}  value={domain.record_type} />
            <RecordField label={t('admin.dom_record_name')}  value={domain.record_name} />
            <RecordField label={t('admin.dom_record_value')} value={domain.expected_record} />
          </div>
          <p className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-small)' }}>
            {t('admin.dom_record_hint')}
          </p>

          {domain.last_error && !domain.verified && (
            <Callout variant="warning" t={t}>{domain.last_error}</Callout>
          )}

          {canManage && (
            <div className="flex items-center gap-3">
              <Button
                variant={domain.verified ? 'secondary' : 'primary'}
                disabled={verify.isPending}
                onClick={() => {
                  setError(null)
                  verify.mutate(domain.id, {
                    onSuccess: d => d.verified
                      ? toast.success(t('admin.dom_verify_ok', { name: d.name }))
                      : toast.error(t('admin.dom_verify_ko')),
                    onError: fail,
                  })
                }}
              >
                <RefreshCw size={16} /> {domain.verified ? t('admin.dom_verify_again') : t('admin.dom_verify')}
              </Button>
              {domain.last_checked_at && (
                <span className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-small)' }}>
                  {t('admin.dom_last_checked', { when: new Date(domain.last_checked_at).toLocaleString() })}
                </span>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* ── The mail reading, or whoever reads it better ──────────────── */}
      <DomainDiagnosticsCard domain={domain} canManage={canManage} />

      {/* ── The two consequential acts ────────────────────────────────── */}
      {canManage && (
        <Card title={t('admin.dom_danger_title')}>
          <div className="flex flex-col gap-4 p-1">
            {domain.kind === 'secondary' && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="min-w-0 flex-1 text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>
                  {t('admin.dom_promote_desc')}
                </p>
                <Button
                  variant="secondary"
                  disabled={!domain.verified || promote.isPending}
                  title={domain.verified ? undefined : t('admin.dom_promote_needs_verify')}
                  onClick={async () => {
                    const ok = await confirm({
                      title: t('admin.dom_promote_title'),
                      message: t('admin.dom_promote_confirm', { name: domain.name }),
                      confirmLabel: t('admin.dom_promote'),
                    })
                    if (!ok) return
                    setError(null)
                    promote.mutate(domain.id, {
                      onSuccess: () => toast.success(t('admin.dom_promote_ok', { name: domain.name })),
                      onError: fail,
                    })
                  }}
                >
                  <Star size={16} /> {t('admin.dom_promote')}
                </Button>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>{t('admin.dom_remove_desc')}</p>
                {/* Named, not counted: "3 comptes portent une adresse ici" is
                    something somebody can act on; "impossible" is not. */}
                {blockers.length > 0 && (
                  <ul className="mt-1 list-disc ps-5 text-text-tertiary" style={{ fontSize: 'var(--kb-text-small)' }}>
                    {blockers.map(b => <li key={b}>{b}</li>)}
                  </ul>
                )}
              </div>
              <Button
                variant="danger"
                disabled={blockers.length > 0 || remove.isPending}
                onClick={async () => {
                  const ok = await confirm({
                    title: t('admin.dom_remove_title'),
                    message: t('admin.dom_remove_confirm', { name: domain.name }),
                    confirmLabel: t('admin.dom_remove'),
                    variant: 'danger',
                  })
                  if (!ok) return
                  setError(null)
                  remove.mutate(domain.id, { onSuccess: onGone, onError: fail })
                }}
              >
                <Trash2 size={16} /> {t('admin.dom_remove')}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {confirmState && <ConfirmDialog {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} />}
    </div>
  )
}
