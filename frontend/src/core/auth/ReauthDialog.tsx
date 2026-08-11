import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ShieldCheck } from 'lucide-react'
import { Button, Callout, FloatingWindow, Input } from '@ui'
import { api } from '../api/client'

interface Challenge {
  methods: string[]
  token_ttl_seconds: number
  grace_seconds: number
  backup_codes_remaining: number
}

interface Props {
  /** Called with the fresh proof; the API client replays the request with it. */
  onProof: (token: string) => void
  onCancel: () => void
}

/**
 * Asks the operator to prove presence again before a sensitive action.
 *
 * Which proof is accepted is decided by the SERVER (`/auth/reauth/challenge`) and
 * merely rendered here: when the account carries a second factor the password is
 * not offered at all, because a stolen password is precisely the scenario the
 * second factor answers.
 */
export function ReauthDialog({ onProof, onCancel }: Props) {
  const { t } = useTranslation()
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    api
      .get<Challenge>('/auth/reauth/challenge')
      .then(({ data }) => { if (!cancelled) setChallenge(data) })
      .catch((err: { message?: string }) => {
        if (!cancelled) setError(err?.message ?? t('reauth.err_generic'))
      })
    return () => { cancelled = true }
  }, [t])

  useEffect(() => { inputRef.current?.focus() }, [challenge])

  const usesCode = challenge?.methods.includes('totp') ?? false
  const noMethod = challenge !== null && challenge.methods.length === 0

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim() || busy) return
    setBusy(true)
    setError('')
    try {
      // The submitted value is routed by the server: a backup code and a
      // time-based code arrive through the same field, because that is what
      // people type when they have lost their phone.
      const body = usesCode ? { code: value.trim() } : { password: value }
      const { data } = await api.post<{ reauth_token: string }>('/auth/reauth', body)
      onProof(data.reauth_token)
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? t('reauth.err_generic'))
      setValue('')
      inputRef.current?.focus()
    } finally {
      setBusy(false)
    }
  }

  return (
    <FloatingWindow
      title={t('reauth.title')}
      icon={<ShieldCheck size={16} />}
      onClose={onCancel}
      defaultWidth={420}
      backdrop
    >
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-text-secondary">{t('reauth.intro')}</p>

        {noMethod ? (
          <Callout variant="warning" title={t('reauth.no_method_title')} t={t}>
            {t('reauth.no_method_desc')}
          </Callout>
        ) : (
          <Input
            ref={inputRef}
            type={usesCode ? 'text' : 'password'}
            label={usesCode ? t('reauth.code_label') : t('reauth.password_label')}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoComplete={usesCode ? 'one-time-code' : 'current-password'}
            placeholder={usesCode ? t('reauth.code_ph') : undefined}
          />
        )}

        {usesCode && (
          <p className="text-xs text-text-tertiary">
            {t('reauth.backup_hint', { count: challenge?.backup_codes_remaining ?? 0 })}
          </p>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={onCancel}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={busy || noMethod || !value.trim()}
          >
            {t('reauth.confirm')}
          </Button>
        </div>
      </form>
    </FloatingWindow>
  )
}
