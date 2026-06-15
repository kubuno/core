import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../store/authStore'
import { api } from '../api/client'
import { formatDistanceToNow, format } from 'date-fns'
import { getDateLocale } from '../i18n/dateLocale'
import { Slot } from '../slots/SlotRegistry'
import type { Session, ApiToken } from '../types'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Key, Trash2, Copy, Check, Plus, X, ShieldCheck, ShieldOff, Shield } from 'lucide-react'
import QRCode from 'react-qr-code'
import { Button, Input, Tabs } from '@ui'

type Tab = 'profile' | 'security' | 'sessions' | 'api-tokens'

function fallbackCopy(text: string, onSuccess: () => void) {
  const el = document.createElement('textarea')
  el.value = text
  el.style.cssText = 'position:fixed;top:0;left:0;opacity:0'
  document.body.appendChild(el)
  el.focus()
  el.select()
  try { document.execCommand('copy'); onSuccess() } catch { /* rien */ }
  document.body.removeChild(el)
}

// ── Profil ────────────────────────────────────────────────────────────────────

function ProfileTab() {
  const { t } = useTranslation()
  const { user, updateUser } = useAuthStore()
  const [form, setForm] = useState({
    display_name: user?.display_name ?? '',
    avatar_url: user?.avatar_url ?? '',
  })
  const [saved, setSaved] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data } = await api.patch<{ user: typeof user }>('/me', form)
    if (data.user) updateUser(data.user as Parameters<typeof updateUser>[0])
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <Input
        label={t('settings.profile_display_name')}
        type="text"
        value={form.display_name}
        onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
      />
      <Input
        label={t('settings.profile_email')}
        type="email"
        value={user?.email ?? ''}
        disabled
      />
      <Input
        label={t('settings.profile_avatar_url')}
        type="url"
        value={form.avatar_url}
        onChange={(e) => setForm((f) => ({ ...f, avatar_url: e.target.value }))}
        placeholder="https://…"
      />
      <Button type="submit">
        {saved ? t('settings.profile_saved') : t('settings.save')}
      </Button>
    </form>
  )
}

// ── Sécurité ──────────────────────────────────────────────────────────────────

type TotpSetupStep = 'idle' | 'qr' | 'verify' | 'done'

function TwoFactorSection() {
  const { t } = useTranslation()
  const { user, updateUser } = useAuthStore()
  const [step, setStep] = useState<TotpSetupStep>('idle')
  const [uri, setUri] = useState('')
  const [secret, setSecret] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [disableCode, setDisableCode] = useState('')
  const [disableError, setDisableError] = useState('')
  const [showDisableForm, setShowDisableForm] = useState(false)

  const enabled = user?.totp_enabled ?? false

  const startSetup = async () => {
    setError('')
    try {
      const { data } = await api.post<{ uri: string; secret: string }>('/me/2fa/setup')
      setUri(data.uri)
      setSecret(data.secret)
      setStep('qr')
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? t('settings.error'))
    }
  }

  const enableTotp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await api.post('/me/2fa/enable', { code })
      updateUser({ totp_enabled: true })
      setStep('done')
      setCode('')
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? t('settings.tfa_code_wrong'))
    }
  }

  const disableTotp = async (e: React.FormEvent) => {
    e.preventDefault()
    setDisableError('')
    try {
      await api.delete('/me/2fa', { data: { code: disableCode } })
      updateUser({ totp_enabled: false })
      setShowDisableForm(false)
      setDisableCode('')
    } catch (err: unknown) {
      setDisableError((err as { message?: string })?.message ?? t('settings.tfa_code_wrong'))
    }
  }

  if (enabled) {
    return (
      <div>
        <h3 className="text-sm font-medium text-text-primary mb-3">{t('settings.tfa_title')}</h3>
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-success-light border border-success mb-4">
          <ShieldCheck size={18} className="text-success shrink-0" />
          <div>
            <p className="text-sm font-medium text-success">{t('settings.tfa_on')}</p>
            <p className="text-xs text-success/80">{t('settings.tfa_on_desc')}</p>
          </div>
        </div>

        {!showDisableForm ? (
          <Button variant="danger" size="sm" icon={<ShieldOff size={14} />} onClick={() => setShowDisableForm(true)}>
            {t('settings.tfa_disable_btn')}
          </Button>
        ) : (
          <form onSubmit={disableTotp} className="space-y-3 max-w-xs">
            <p className="text-sm text-text-secondary">{t('settings.tfa_disable_confirm')}</p>
            <Input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
              autoFocus
              placeholder={t('settings.tfa_code_ph')}
              className="tracking-widest text-center"
            />
            {disableError && <p className="text-xs text-danger">{disableError}</p>}
            <div className="flex gap-2">
              <Button type="submit" variant="danger" size="sm" disabled={disableCode.length !== 6}>{t('settings.tfa_disable')}</Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => { setShowDisableForm(false); setDisableCode(''); setDisableError('') }}>{t('common.cancel')}</Button>
            </div>
          </form>
        )}
      </div>
    )
  }

  if (step === 'done') {
    return (
      <div>
        <h3 className="text-sm font-medium text-text-primary mb-3">{t('settings.tfa_title')}</h3>
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-success-light border border-success">
          <ShieldCheck size={18} className="text-success shrink-0" />
          <p className="text-sm font-medium text-success">{t('settings.tfa_on_success')}</p>
        </div>
      </div>
    )
  }

  if (step === 'qr') {
    return (
      <div>
        <h3 className="text-sm font-medium text-text-primary mb-3">{t('settings.tfa_title')}</h3>
        <div className="space-y-4 max-w-sm">
          <p className="text-sm text-text-secondary">
            {t('settings.tfa_scan_desc')}
          </p>
          <div className="flex justify-center p-4 bg-white border border-border rounded-lg w-fit">
            <QRCode value={uri} size={180} />
          </div>
          <details className="text-xs">
            <summary className="cursor-pointer text-text-secondary hover:text-text-primary">
              {t('settings.tfa_manual')}
            </summary>
            <code className="block mt-2 px-3 py-2 bg-surface-2 rounded border border-border break-all font-mono text-text-primary select-all">
              {secret}
            </code>
          </details>
          <p className="text-sm text-text-secondary pt-1">{t('settings.tfa_then_enter')}</p>
          <form onSubmit={enableTotp} className="space-y-3">
            <Input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              autoFocus
              placeholder={t('settings.tfa_code_ph')}
              className="tracking-widest text-center"
            />
            {error && <p className="text-xs text-danger">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={code.length !== 6}>{t('settings.tfa_enable')}</Button>
              <Button type="button" variant="secondary" onClick={() => { setStep('idle'); setCode(''); setError('') }}>{t('common.cancel')}</Button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-sm font-medium text-text-primary mb-3">Double authentification (2FA)</h3>
      <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-surface-1 border border-border mb-4">
        <Shield size={18} className="text-text-tertiary shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-text-primary">{t('settings.tfa_off')}</p>
          <p className="text-xs text-text-secondary mt-0.5">
            {t('settings.tfa_off_desc')}
          </p>
        </div>
      </div>
      {error && <p className="text-sm text-danger mb-3">{error}</p>}
      <Button icon={<ShieldCheck size={15} />} onClick={startSetup}>
        {t('settings.tfa_enable_btn')}
      </Button>
    </div>
  )
}

function SecurityTab() {
  const { t } = useTranslation()
  const [form, setForm] = useState({ old_password: '', new_password: '', confirm: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.new_password !== form.confirm) {
      setError(t('register.err_mismatch'))
      return
    }
    try {
      await api.patch('/me/password', {
        old_password: form.old_password,
        new_password: form.new_password,
      })
      setSuccess(true)
      setForm({ old_password: '', new_password: '', confirm: '' })
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? t('settings.error'))
    }
  }

  return (
    <div className="max-w-md space-y-6">
      <div>
        <h3 className="text-sm font-medium text-text-primary mb-3">{t('settings.sec_change_password')}</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          {(['old_password', 'new_password', 'confirm'] as const).map((field) => (
            <Input
              key={field}
              type="password"
              label={field === 'old_password' ? t('settings.sec_old')
                : field === 'new_password' ? t('settings.sec_new')
                : t('settings.sec_confirm')}
              value={form[field]}
              onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
              autoComplete={field === 'old_password' ? 'current-password' : 'new-password'}
            />
          ))}
          {error && <p className="text-sm text-danger">{error}</p>}
          {success && <p className="text-sm text-success">{t('settings.sec_updated')}</p>}
          <Button type="submit">{t('settings.sec_update')}</Button>
        </form>
      </div>
      <div className="h-px bg-border" />
      <TwoFactorSection />
    </div>
  )
}

// ── Sessions ──────────────────────────────────────────────────────────────────

function SessionsTab() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { data } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => api.get<{ sessions: Session[] }>('/me/sessions').then((r) => r.data.sessions),
  })
  const revoke = useMutation({
    mutationFn: (id: string) => api.delete(`/me/sessions/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions'] }),
  })
  const revokeAll = useMutation({
    mutationFn: () => api.delete('/me/sessions'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions'] }),
  })

  return (
    <div className="max-w-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-text-primary">{t('settings.ses_active')}</h3>
        <button
          onClick={() => revokeAll.mutate()}
          className="text-xs text-danger hover:underline"
        >
          {t('settings.ses_revoke_all')}
        </button>
      </div>
      <div className="space-y-2">
        {data?.map((s) => (
          <div key={s.id} className="flex items-center justify-between px-3 py-2.5 bg-white rounded-lg border border-border">
            <div>
              <p className="text-sm font-medium text-text-primary">{s.device_name ?? t('settings.ses_unknown')}</p>
              <p className="text-xs text-text-tertiary">
                {s.ip_address} · {t('settings.ses_active_label')} {formatDistanceToNow(new Date(s.last_used_at), { addSuffix: true, locale: getDateLocale() })}
              </p>
            </div>
            <button
              onClick={() => revoke.mutate(s.id)}
              className="text-xs text-danger hover:underline px-2"
            >
              {t('settings.ses_revoke')}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Tokens d'API ──────────────────────────────────────────────────────────────

/** Bandeau affiché une seule fois après la création d'un token. */
function NewTokenBanner({ token, onClose }: { token: string; onClose: () => void }) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const copy = () => {
    const succeed = () => { setCopied(true); setTimeout(() => setCopied(false), 2000) }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(token).then(succeed).catch(() => fallbackCopy(token, succeed))
    } else {
      fallbackCopy(token, succeed)
    }
  }

  return (
    <div className="mb-6 rounded-lg border border-success bg-success-light p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-success mb-1">
            {t('settings.tok_created')}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <code className="flex-1 block px-3 py-2 bg-white rounded border border-border text-xs font-mono text-text-primary break-all select-all">
              {token}
            </code>
            <button
              onClick={copy}
              title={t('settings.copy')}
              className="shrink-0 flex items-center gap-1 px-3 py-2 rounded border border-border bg-white text-xs text-text-secondary hover:text-text-primary hover:bg-surface-1 transition-colors"
            >
              {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
              {copied ? t('settings.copied') : t('settings.copy')}
            </button>
          </div>
        </div>
        <button onClick={onClose} className="text-text-tertiary hover:text-text-primary mt-0.5">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

/** Formulaire de création d'un nouveau token. */
function CreateTokenForm({ onCreated }: { onCreated: (raw: string) => void }) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [expiresInDays, setExpiresInDays] = useState<string>('')
  const [error, setError] = useState('')
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: () =>
      api.post<{ token: string; id: string; name: string; expires_at: string | null; created_at: string }>(
        '/me/api-tokens',
        {
          name: name.trim(),
          expires_in_days: expiresInDays ? parseInt(expiresInDays, 10) : null,
        }
      ).then((r) => r.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['api-tokens'] })
      onCreated(data.token)
      setName('')
      setExpiresInDays('')
      setError('')
    },
    onError: (err: unknown) => {
      setError((err as { message?: string })?.message ?? t('settings.tok_create_error'))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError(t('settings.tok_name_required')); return }
    create.mutate()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface-1 rounded-lg border border-border p-4 mb-5">
      <h4 className="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
        <Plus size={15} /> {t('settings.tok_new')}
      </h4>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            label={t('settings.tok_name')}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('settings.tok_name_ph')}
            maxLength={255}
          />
        </div>
        <div className="sm:w-44">
          <Input
            label={t('settings.tok_expires')}
            type="number"
            value={expiresInDays}
            onChange={(e) => setExpiresInDays(e.target.value)}
            placeholder={t('settings.tok_no_expiration')}
            min={1}
            max={3650}
          />
        </div>
        <div className="flex items-end">
          <Button type="submit" loading={create.isPending} className="whitespace-nowrap">
            {t('settings.create')}
          </Button>
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </form>
  )
}

function ApiTokensTab() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [newToken, setNewToken] = useState<string | null>(null)

  const { data: tokens, isLoading } = useQuery({
    queryKey: ['api-tokens'],
    queryFn: () =>
      api.get<{ tokens: ApiToken[] }>('/me/api-tokens').then((r) => r.data.tokens),
  })

  const revoke = useMutation({
    mutationFn: (id: string) => api.delete(`/me/api-tokens/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['api-tokens'] }),
  })

  return (
    <div className="max-w-2xl">
      <div className="mb-5">
        <h3 className="text-sm font-medium text-text-primary">{t('settings.tok_title')}</h3>
        <p className="text-xs text-text-secondary mt-1">
          {t('settings.tok_desc')}
        </p>
      </div>

      {newToken && (
        <NewTokenBanner token={newToken} onClose={() => setNewToken(null)} />
      )}

      <CreateTokenForm onCreated={setNewToken} />

      {isLoading && (
        <p className="text-sm text-text-secondary py-4">{t('common.loading')}</p>
      )}

      {tokens && tokens.length === 0 && (
        <div className="text-center py-8 text-text-tertiary">
          <Key size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">{t('settings.tok_none')}</p>
        </div>
      )}

      {tokens && tokens.length > 0 && (
        <div className="space-y-2">
          {tokens.map((tok) => {
            const isExpired = tok.expires_at ? new Date(tok.expires_at) < new Date() : false
            return (
              <div
                key={tok.id}
                className={`flex items-center justify-between px-4 py-3 rounded-lg border bg-white
                  ${isExpired ? 'border-warning-light opacity-60' : 'border-border'}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Key size={15} className={isExpired ? 'text-warning shrink-0' : 'text-text-tertiary shrink-0'} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{tok.name}</p>
                    <p className="text-xs text-text-tertiary mt-0.5">
                      {t('settings.tok_created_prefix')} {format(new Date(tok.created_at), 'd MMM yyyy', { locale: getDateLocale() })}
                      {tok.last_used_at && (
                        <> · {t('settings.tok_used_prefix')} {formatDistanceToNow(new Date(tok.last_used_at), { addSuffix: true, locale: getDateLocale() })}</>
                      )}
                      {!tok.last_used_at && <> · {t('settings.tok_never_used')}</>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  {tok.expires_at ? (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      isExpired
                        ? 'bg-warning-light text-warning'
                        : 'bg-surface-2 text-text-secondary'
                    }`}>
                      {isExpired
                        ? t('settings.tok_expired')
                        : `${t('settings.tok_expires_prefix')} ${formatDistanceToNow(new Date(tok.expires_at), { addSuffix: true, locale: getDateLocale() })}`}
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-surface-2 text-text-secondary">
                      {t('settings.tok_no_expiration')}
                    </span>
                  )}
                  <button
                    onClick={() => revoke.mutate(tok.id)}
                    title={t('settings.tok_revoke')}
                    className="p-1.5 rounded-md text-text-tertiary hover:text-danger hover:bg-danger-light transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-6 p-3 bg-surface-1 rounded-lg border border-border">
        <p className="text-xs text-text-secondary">
          <strong className="text-text-primary">{t('settings.tok_cli')}</strong>{' '}
          <code className="font-mono bg-surface-2 px-1 py-0.5 rounded">
            kubuno &lt;module&gt;:&lt;commande&gt; --token kubuno_xxx
          </code>
          {' '}{t('settings.tok_or_env')}{' '}
          <code className="font-mono bg-surface-2 px-1 py-0.5 rounded">KUBUNO_TOKEN</code>.
        </p>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('profile')

  const TABS: { id: Tab; label: string }[] = [
    { id: 'profile',    label: t('settings.tab_profile') },
    { id: 'security',  label: t('settings.tab_security') },
    { id: 'sessions',  label: t('settings.tab_sessions') },
    { id: 'api-tokens', label: t('settings.tab_api') },
  ]

  return (
    <div>
      <h1 className="text-xl font-medium text-text-primary mb-6">{t('settings.page_title')}</h1>

      <Tabs tabs={TABS} value={tab} onChange={setTab} className="mb-6" />

      {tab === 'profile'    && <ProfileTab />}
      {tab === 'security'   && <SecurityTab />}
      {tab === 'sessions'   && <SessionsTab />}
      {tab === 'api-tokens' && <ApiTokensTab />}

      <Slot name="settings-sections" />
    </div>
  )
}
