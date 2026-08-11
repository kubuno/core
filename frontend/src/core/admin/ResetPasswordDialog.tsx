import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@tanstack/react-query'
import { Check, Copy, Eye, EyeOff, KeyRound } from 'lucide-react'
import { Button, Callout, Checkbox, FloatingWindow, Input, Radio } from '@ui'
import { api } from '../api/client'

/**
 * "Reset the password" — the administrator's way back in for a locked-out user.
 *
 * ## For whoever wires this into the user list or the user detail card
 *
 * ```tsx
 * const [resetting, setResetting] = useState<AdminUser | null>(null)
 * …
 * {resetting && (
 *   <ResetPasswordDialog
 *     userId={resetting.id}
 *     userLabel={resetting.display_name || resetting.username}
 *     userEmail={resetting.email}
 *     onClose={() => setResetting(null)}
 *     onDone={() => qc.invalidateQueries({ queryKey: ['admin', 'users'] })}
 *   />
 * )}
 * ```
 *
 * It owns its own request and its own two-step flow (form → outcome); the
 * caller only decides when it is mounted. `onDone` fires once the reset
 * succeeded, so a list showing `must_change_password` or a session count can
 * refresh — it is NOT a close signal.
 *
 * ## Why the generated password is shown here
 *
 * Only the server-generated one, and only once: the operator has no other copy
 * to hand over. A password the operator typed themselves is never echoed back —
 * they already have it, and displaying it again would only put it in one more
 * place.
 */

export interface ResetPasswordDialogProps {
  userId:     string
  /** Display name or username — shown in the dialog subtitle. */
  userLabel:  string
  /** Account address, used as the placeholder of the "send to" field. */
  userEmail?: string
  onClose:    () => void
  /** Called after a successful reset, for the caller to refresh its data. */
  onDone?:    () => void
}

interface ResetResponse {
  ok:               boolean
  password:         string | null
  generated:        boolean
  must_change:      boolean
  sessions_revoked: number
  email: {
    requested: boolean
    queued?:   boolean
    to?:       string
    reason?:   string
  }
}

const MIN_LENGTH = 8

export default function ResetPasswordDialog({
  userId, userLabel, userEmail, onClose, onDone,
}: ResetPasswordDialogProps) {
  const { t } = useTranslation()

  const [mode, setMode] = useState<'generate' | 'manual'>('generate')
  const [password, setPassword] = useState('')
  const [requireChange, setRequireChange] = useState(true)
  const [sendEmail, setSendEmail] = useState(false)
  const [emailTo, setEmailTo] = useState('')
  const [error, setError] = useState<string | null>(null)

  const [outcome, setOutcome] = useState<ResetResponse | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)

  const reset = useMutation({
    mutationFn: () =>
      api
        .post<ResetResponse>(`/admin/users/${userId}/reset-password`, {
          mode,
          password:       mode === 'manual' ? password : undefined,
          require_change: requireChange,
          send_email:     sendEmail,
          email_to:       sendEmail && emailTo.trim() ? emailTo.trim() : undefined,
        })
        .then(r => r.data),
    onSuccess: data => {
      setOutcome(data)
      setError(null)
      onDone?.()
    },
    onError: (e: unknown) => {
      const detail = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(detail || t('pwreset.err_generic'))
    },
  })

  const submit = () => {
    if (mode === 'manual' && password.length < MIN_LENGTH) {
      setError(t('pwreset.err_min'))
      return
    }
    setError(null)
    reset.mutate()
  }

  const copy = () => {
    if (!outcome?.password) return
    navigator.clipboard?.writeText(outcome.password).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    })
  }

  // ── Step 2: what happened ────────────────────────────────────────────────
  if (outcome) {
    const sessions = outcome.sessions_revoked
    return (
      <FloatingWindow
        title={t('pwreset.done_title')}
        icon={<KeyRound size={16} />}
        onClose={onClose}
        defaultWidth={460}
        backdrop
      >
        <div className="flex flex-col gap-4 p-5">
          {outcome.password ? (
            <div>
              <p className="text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
                {t('pwreset.password')}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <code
                  className="min-w-0 flex-1 truncate rounded-lg border border-border bg-surface-1 px-3 py-2 font-mono text-text-primary"
                  style={{ fontSize: 'var(--kb-text-body)' }}
                >
                  {revealed ? outcome.password : '•'.repeat(outcome.password.length)}
                </code>
                <button
                  type="button"
                  onClick={() => setRevealed(v => !v)}
                  aria-label={revealed ? t('pwreset.hide') : t('pwreset.show')}
                  title={revealed ? t('pwreset.hide') : t('pwreset.show')}
                  className="rounded-lg p-2 text-text-secondary hover:bg-surface-2"
                >
                  {revealed ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <button
                  type="button"
                  onClick={copy}
                  aria-label={t('pwreset.copy')}
                  title={t('pwreset.copy')}
                  className="rounded-lg p-2 text-text-secondary hover:bg-surface-2"
                >
                  {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
                </button>
              </div>
              {copied && (
                <p className="mt-1 text-success" style={{ fontSize: 'var(--kb-text-meta)' }}>
                  {t('pwreset.copied')}
                </p>
              )}
            </div>
          ) : (
            <p className="text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>
              {t('pwreset.no_password_shown')}
            </p>
          )}

          <ul className="space-y-1 text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>
            <li>{sessions === 1 ? t('pwreset.done_sessions_one') : t('pwreset.done_sessions', { count: sessions })}</li>
            {outcome.must_change && <li>{t('pwreset.done_must_change')}</li>}
          </ul>

          {outcome.email.requested && (
            outcome.email.queued
              ? <Callout variant="success">{t('pwreset.email_queued', { to: outcome.email.to })}</Callout>
              : <Callout variant="warning">{t('pwreset.email_not_configured')}</Callout>
          )}

          {/* Single-button dialog: full width, so it never reads as half of a
              pair the user should be choosing between. */}
          <Button className="w-full" onClick={onClose}>{t('pwreset.close')}</Button>
        </div>
      </FloatingWindow>
    )
  }

  // ── Step 1: the form ─────────────────────────────────────────────────────
  return (
    <FloatingWindow
      title={t('pwreset.title')}
      icon={<KeyRound size={16} />}
      onClose={onClose}
      defaultWidth={460}
      backdrop
    >
      <div className="flex flex-col gap-4 p-5">
        <p className="text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>
          {t('pwreset.subtitle', { user: userLabel })}
        </p>

        <div>
          <p className="mb-2 text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
            {t('pwreset.mode')}
          </p>
          {/* `flex flex-col`, not `space-y`: Radio and Checkbox are `inline-flex`
              labels, so siblings flow onto one line and the vertical rhythm of a
              `space-y` wrapper never applies. */}
          <div className="flex flex-col items-start gap-2">
            <Radio
              checked={mode === 'generate'}
              onChange={() => setMode('generate')}
              label={t('pwreset.mode_generate')}
            />
            <Radio
              checked={mode === 'manual'}
              onChange={() => setMode('manual')}
              label={t('pwreset.mode_manual')}
            />
          </div>
        </div>

        {mode === 'manual' && (
          <Input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(null) }}
            placeholder={t('pwreset.password')}
            hint={t('pwreset.password_hint')}
            autoComplete="new-password"
            autoFocus
          />
        )}

        <div className="flex flex-col items-start gap-2">
          <Checkbox
            checked={requireChange}
            onChange={setRequireChange}
            label={t('pwreset.require_change')}
          />
          <Checkbox
            checked={sendEmail}
            onChange={setSendEmail}
            label={t('pwreset.send_email')}
          />
        </div>

        {sendEmail && (
          <Input
            type="email"
            value={emailTo}
            onChange={e => setEmailTo(e.target.value)}
            placeholder={userEmail ?? ''}
            hint={t('pwreset.send_email_to')}
            autoComplete="off"
          />
        )}

        <Callout variant="warning">{t('pwreset.warn_sessions')}</Callout>

        {error && <Callout variant="danger">{error}</Callout>}

        {/* Equal-width buttons, per the project rule. */}
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button className="flex-1" onClick={submit} loading={reset.isPending}>
            {t('pwreset.submit')}
          </Button>
        </div>
      </div>
    </FloatingWindow>
  )
}
