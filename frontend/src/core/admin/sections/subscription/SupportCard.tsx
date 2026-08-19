import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BadgeCheck, FileKey, LifeBuoy, ShieldQuestion, Trash2, Users } from 'lucide-react'
import { Badge, Button, Callout, Card, Textarea } from '@ui'
import ConfirmDialog from '@ui/ConfirmDialog'
import { useConfirm } from '../../../hooks/useConfirm'
import { formatDay } from '../format'
import Field, { ExternalLink } from './Field'
import {
  errorMessage, useRegisterSupportKey, useRemoveSupportKey, type SupportInfo,
} from './api'

/**
 * Who is obliged to help, if anybody is.
 *
 * ## Having no contract is the normal state, not a degraded one
 *
 * The software is free and self-hosted: the overwhelming majority of instances
 * will never register anything here, and the card they see must read as a
 * complete answer — community support, with the real addresses of the real
 * repository — rather than as an empty slot waiting to be filled. There is no
 * locked feature behind this card, no counter, and nothing that stops working
 * without it.
 *
 * ## Why the paid offer is one sentence
 *
 * Support is what the publisher actually sells, so saying so is honest. Saying
 * it more than once, or with a coloured banner, would turn an administration
 * page into an advertisement — on a screen an operator opened to answer a
 * question, not to buy anything.
 *
 * ## Verified versus declarative
 *
 * A key is a document the publisher signed offline; the instance checks the
 * signature against a public key compiled into it, and never opens a socket to
 * do so. Until the publisher mints that signing key, nothing can be checked, and
 * the card says exactly that instead of dressing a typed contract as a proven
 * one. Both states are shown; only the label differs.
 */
export default function SupportCard({
  support, canManage,
}: {
  support:   SupportInfo
  canManage: boolean
}) {
  const { t, i18n } = useTranslation()
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm()
  const register = useRegisterSupportKey()
  const remove = useRemoveSupportKey()

  const [formOpen, setFormOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)

  const contract = support.contract

  const submit = async () => {
    setError(null)
    try {
      await register.mutateAsync(draft.trim())
      setDraft('')
      setFormOpen(false)
    } catch (e) {
      setError(errorMessage(e, t('admin.sub_key_failed')))
    }
  }

  const askRemove = async () => {
    const ok = await confirm({
      title:       t('admin.sub_remove_title'),
      message:     t('admin.sub_remove_message'),
      confirmLabel: t('admin.sub_remove_confirm'),
      variant:     'danger',
    })
    if (!ok) return
    setError(null)
    try {
      await remove.mutateAsync()
    } catch (e) {
      setError(errorMessage(e, t('admin.sub_remove_failed')))
    }
  }

  return (
    <Card
      title={t('admin.sub_support_title')}
      icon={<LifeBuoy size={16} />}
      subtitle={t('admin.sub_support_subtitle')}
      actions={canManage && contract ? (
        <Button
          variant="text"
          size="sm"
          icon={<Trash2 size={14} />}
          loading={remove.isPending}
          onClick={() => void askRemove()}
        >
          {t('admin.sub_remove')}
        </Button>
      ) : undefined}
    >
      {contract ? (
        <ContractDetails
          contract={contract}
          locale={i18n.language}
          verificationAvailable={support.verification_available}
        />
      ) : (
        <CommunitySupport support={support} />
      )}

      {/* ── Registering a key ───────────────────────────────────────────── */}
      {canManage && (
        <div className="mt-4 border-t border-border pt-4">
          {formOpen ? (
            <div className="min-w-0">
              <Textarea
                label={t('admin.sub_key_label')}
                hint={t('admin.sub_key_hint')}
                value={draft}
                onChange={e => setDraft(e.target.value)}
                placeholder={t('admin.sub_key_placeholder')}
                spellCheck={false}
                autoComplete="off"
                className="h-28 font-mono"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  loading={register.isPending}
                  disabled={!draft.trim()}
                  onClick={() => void submit()}
                >
                  {t('admin.sub_key_submit')}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => { setFormOpen(false); setDraft(''); setError(null) }}
                >
                  {t('admin.sub_key_cancel')}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              icon={<FileKey size={14} />}
              onClick={() => setFormOpen(true)}
            >
              {contract ? t('admin.sub_key_replace') : t('admin.sub_key_add')}
            </Button>
          )}

          {/* Said once, next to the button that would use it — not as a banner
              at the top of the page. */}
          {!contract && !formOpen && (
            <p className="mt-2 text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
              {t('admin.sub_offer_hint')}
            </p>
          )}

          {error && (
            <p className="mt-3 text-danger" role="alert" style={{ fontSize: 'var(--kb-text-body)' }}>
              {error}
            </p>
          )}
        </div>
      )}

      {confirmState && (
        <ConfirmDialog {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} />
      )}
    </Card>
  )
}

/** The state of an instance that has registered nothing — the ordinary one. */
function CommunitySupport({ support }: { support: SupportInfo }) {
  const { t } = useTranslation()
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="neutral"><span className="inline-flex items-center gap-1"><Users size={12} />{t('admin.sub_community_badge')}</span></Badge>
      </div>
      <p className="mt-3 text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>
        {t('admin.sub_community_desc')}
      </p>
      <div
        className="mt-3 flex flex-wrap gap-x-5 gap-y-1"
        style={{ fontSize: 'var(--kb-text-body)' }}
      >
        <ExternalLink href={support.community.issues_url}>
          {t('admin.sub_community_issues')}
        </ExternalLink>
        <ExternalLink href={support.community.source_url}>
          {t('admin.sub_community_repo')}
        </ExternalLink>
        <ExternalLink href={support.community.organisation_url}>
          {t('admin.sub_community_org')}
        </ExternalLink>
      </div>
    </div>
  )
}

/** The state of an instance that has one. */
function ContractDetails({
  contract, locale, verificationAvailable,
}: {
  contract: NonNullable<SupportInfo['contract']>
  locale:   string
  /** Whether this build carries any trusted signing key at all — the two
   *  reasons a contract can be declarative call for opposite explanations. */
  verificationAvailable: boolean
}) {
  const { t } = useTranslation()
  // Amber, then red: an operator has to be able to renew before the day it ends.
  const ending = contract.days_left != null && contract.days_left <= 30

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        {contract.verified ? (
          <Badge variant="success">
            <span className="inline-flex items-center gap-1">
              <BadgeCheck size={12} />{t('admin.sub_contract_verified')}
            </span>
          </Badge>
        ) : (
          <Badge variant="neutral">
            <span className="inline-flex items-center gap-1">
              <ShieldQuestion size={12} />{t('admin.sub_contract_declarative')}
            </span>
          </Badge>
        )}
        {contract.expired && <Badge variant="danger">{t('admin.sub_contract_expired')}</Badge>}
        {!contract.expired && ending && (
          <Badge variant="warning">
            {t('admin.sub_contract_ending', { days: contract.days_left })}
          </Badge>
        )}
      </div>

      {!contract.verified && (
        <Callout variant="info" className="mt-3" t={t}>
          {verificationAvailable
            ? t('admin.sub_contract_declarative_desc')
            : t('admin.sub_contract_no_verifier_desc')}
        </Callout>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t('admin.sub_contract_subject')}>{contract.subject}</Field>
        <Field label={t('admin.sub_contract_plan')}>{contract.plan ?? '—'}</Field>
        <Field label={t('admin.sub_contract_expires')}>
          {contract.expires_at ? formatDay(contract.expires_at, locale) : '—'}
        </Field>
        <Field label={t('admin.sub_contract_registered')}>
          {formatDay(contract.registered_at, locale)}
        </Field>
        <Field label={t('admin.sub_contract_contact')}>
          {contract.contact
            ? <ContactLink contact={contract.contact} />
            : '—'}
        </Field>
      </div>

      {contract.perimeter && (
        <div className="mt-4 border-t border-border pt-3">
          <Field label={t('admin.sub_contract_perimeter')}>
            <span className="whitespace-pre-line">{contract.perimeter}</span>
          </Field>
        </div>
      )}
    </div>
  )
}

/**
 * The contact, as a link when it is one.
 *
 * The server accepts only an e-mail address or an `https://` URL, so the scheme
 * chosen here can never be one the publisher smuggled in.
 */
function ContactLink({ contact }: { contact: string }) {
  if (contact.startsWith('https://')) return <ExternalLink href={contact}>{contact}</ExternalLink>
  return (
    <a
      href={`mailto:${contact}`}
      className="text-primary underline underline-offset-2 hover:text-primary-hover"
    >
      {contact}
    </a>
  )
}
