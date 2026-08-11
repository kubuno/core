import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Mail, Send, Server, User } from 'lucide-react'
import { Button, Callout, Card, Dropdown, Input, Toggle, useToast } from '@ui'
import type { DropdownOption } from '@ui'
import { api } from '../api/client'
import { useAdminAction } from './adminAction'

/**
 * Administration → Email: the outgoing SMTP relay.
 *
 * Reads and writes `/admin/mail/settings`, which is the ONLY writer of the
 * `mail.*` keys — the generic settings route refuses them, because one of them
 * holds an encrypted credential and that route returns raw values.
 *
 * Two deliberate behaviours worth keeping:
 *  • the password field starts empty and is only sent when the operator typed
 *    something. `has_password` tells them one is stored; the value itself is
 *    never returned by the API, so there is nothing to prefill;
 *  • "Send a test email" is synchronous and shows the relay's own answer,
 *    truncated but verbatim. That raw line is what makes a misconfiguration
 *    diagnosable — a generic "sending failed" would not.
 */

interface MailSettings {
  enabled:      boolean
  host:         string
  port:         number
  security:     'none' | 'starttls' | 'tls'
  username:     string
  has_password: boolean
  from_address: string
  from_name:    string
  public_url:   string
  usable:       boolean
}

interface TestResult {
  ok:         boolean
  message:    string
  detail?:    string
  hint?:      string
  to:         string
  host:       string
  port:       number
  security:   string
  elapsed_ms: number
}

/** Form state — `password` is write-only and starts empty on every load. */
interface FormState {
  enabled:      boolean
  host:         string
  port:         string
  security:     string
  username:     string
  password:     string
  from_address: string
  from_name:    string
  public_url:   string
}

const toForm = (s: MailSettings): FormState => ({
  enabled:      s.enabled,
  host:         s.host,
  port:         String(s.port),
  security:     s.security,
  username:     s.username,
  password:     '',
  from_address: s.from_address,
  from_name:    s.from_name,
  public_url:   s.public_url,
})

/** Ports that go with each encryption mode, applied when the operator switches
 *  mode and the current port is the default of the previous one. Never
 *  overrides a port they typed themselves. */
const DEFAULT_PORT: Record<string, string> = { none: '25', starttls: '587', tls: '465' }
const IS_DEFAULT_PORT = (port: string) => Object.values(DEFAULT_PORT).includes(port)

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="text-text-secondary">{label}</span>
      <div className="mt-1">{children}</div>
      {hint && <p className="mt-1 text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>{hint}</p>}
    </label>
  )
}

export default function MailSettingsPanel() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const toast = useToast()

  const [form, setForm] = useState<FormState | null>(null)
  const [testTo, setTestTo] = useState('')
  const [result, setResult] = useState<TestResult | null>(null)

  // `/admin/email?action=test` brings the operator to the test card with the
  // recipient field focused — the point of the deep link is the task, not the
  // page. Deferred one frame: the card is below a form that only exists once the
  // settings have loaded.
  const testRef = useRef<HTMLInputElement>(null)
  const [wantTest, setWantTest] = useState(false)
  useAdminAction('test', () => setWantTest(true))
  useEffect(() => {
    if (!wantTest || !testRef.current) return
    setWantTest(false)
    testRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' })
    testRef.current.focus()
    // `form` is in the list on purpose: the card does not exist while the
    // settings are still loading, so the request has to be re-tried once it does.
  }, [wantTest, form])

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin', 'mail-settings'],
    queryFn: () => api.get<MailSettings>('/admin/mail/settings').then(r => r.data),
  })

  // Hydrate the form once the server answers, and re-hydrate after a save.
  useEffect(() => { if (settings) setForm(toForm(settings)) }, [settings])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm(prev => (prev ? { ...prev, [key]: value } : prev))

  const save = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.patch('/admin/mail/settings', payload),
    onSuccess: async () => {
      toast.success(t('mailsetup.saved'))
      // Await the refetch before dropping the local edits: dropping them first
      // would flash the pre-save values for the length of a round trip.
      await qc.invalidateQueries({ queryKey: ['admin', 'mail-settings'] })
    },
    onError: (e: unknown) => {
      const detail = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(detail || t('mailsetup.test_failed'))
    },
  })

  const sendTest = useMutation({
    mutationFn: () =>
      api.post<TestResult>('/admin/mail/test', { to: testTo.trim() || undefined }).then(r => r.data),
    onSuccess: setResult,
    onError: (e: unknown) => {
      const detail = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(detail || t('mailsetup.test_failed'))
    },
  })

  const securityOptions: DropdownOption[] = useMemo(() => ([
    { value: 'starttls', label: t('mailsetup.sec_starttls') },
    { value: 'tls',      label: t('mailsetup.sec_tls') },
    { value: 'none',     label: t('mailsetup.sec_none') },
  ]), [t])

  const dirty = useMemo(() => {
    if (!settings || !form) return false
    return form.enabled      !== settings.enabled
        || form.host         !== settings.host
        || form.port         !== String(settings.port)
        || form.security     !== settings.security
        || form.username     !== settings.username
        || form.password     !== ''
        || form.from_address !== settings.from_address
        || form.from_name    !== settings.from_name
        || form.public_url   !== settings.public_url
  }, [settings, form])

  if (isLoading || !form || !settings) {
    return <p className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-body)' }}>{t('common.loading')}</p>
  }

  const submit = () => {
    const payload: Record<string, unknown> = {
      enabled:      form.enabled,
      host:         form.host.trim(),
      port:         Number(form.port) || 587,
      security:     form.security,
      username:     form.username,
      from_address: form.from_address.trim(),
      from_name:    form.from_name,
      public_url:   form.public_url.trim(),
    }
    // Absent = unchanged. Sending an empty string would CLEAR the stored one,
    // which is what the explicit "clear" control below is for.
    if (form.password) payload.password = form.password
    save.mutate(payload)
  }

  const clearPassword = () => save.mutate({ password: '' })

  const onSecurityChange = (value: string) => {
    setForm(prev => {
      if (!prev) return prev
      const port = IS_DEFAULT_PORT(prev.port) ? DEFAULT_PORT[value] ?? prev.port : prev.port
      return { ...prev, security: value, port }
    })
  }

  return (
    <div className="max-w-3xl space-y-4">
      <p className="text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>
        {t('mailsetup.subtitle')}
      </p>

      {!settings.usable && (
        <Callout variant={settings.enabled ? 'warning' : 'info'}>
          {settings.enabled ? t('mailsetup.not_configured') : t('mailsetup.disabled')}
        </Callout>
      )}

      {/* ── Server ─────────────────────────────────────────────────────── */}
      <Card title={t('mailsetup.section_server')} icon={<Server size={17} />}>
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-medium text-text-primary" style={{ fontSize: 'var(--kb-text-body)' }}>
                {t('mailsetup.enabled')}
              </p>
              <p className="mt-0.5 text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
                {t('mailsetup.enabled_hint')}
              </p>
            </div>
            <Toggle checked={form.enabled} onChange={e => set('enabled', e.target.checked)} />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Field label={t('mailsetup.host')}>
                <Input
                  value={form.host}
                  onChange={e => set('host', e.target.value)}
                  placeholder="smtp.exemple.com"
                  autoComplete="off"
                />
              </Field>
            </div>
            <Field label={t('mailsetup.port')}>
              <Input
                type="number"
                value={form.port}
                onChange={e => set('port', e.target.value)}
                min={1}
                max={65535}
              />
            </Field>
          </div>

          <Field label={t('mailsetup.security')}>
            <Dropdown
              value={form.security}
              onChange={onSecurityChange}
              options={securityOptions}
              width="100%"
              height={36}
              fontSize={14}
              focusable
            />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={t('mailsetup.username')} hint={t('mailsetup.username_hint')}>
              <Input
                value={form.username}
                onChange={e => set('username', e.target.value)}
                autoComplete="off"
              />
            </Field>
            <Field
              label={t('mailsetup.password')}
              hint={settings.has_password ? t('mailsetup.password_stored') : t('mailsetup.password_hint')}
            >
              <Input
                type="password"
                value={form.password}
                onChange={e => set('password', e.target.value)}
                placeholder={settings.has_password ? '••••••••' : ''}
                autoComplete="new-password"
              />
            </Field>
          </div>

          {settings.has_password && (
            <Button variant="ghost" size="sm" onClick={clearPassword} disabled={save.isPending}>
              {t('mailsetup.password_clear')}
            </Button>
          )}
        </div>
      </Card>

      {/* ── Sender ─────────────────────────────────────────────────────── */}
      <Card title={t('mailsetup.section_sender')} icon={<User size={17} />}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={t('mailsetup.from_address')}>
              <Input
                value={form.from_address}
                onChange={e => set('from_address', e.target.value)}
                placeholder="no-reply@exemple.com"
                autoComplete="off"
              />
            </Field>
            <Field label={t('mailsetup.from_name')}>
              <Input value={form.from_name} onChange={e => set('from_name', e.target.value)} />
            </Field>
          </div>
          <Field label={t('mailsetup.public_url')} hint={t('mailsetup.public_url_hint')}>
            <Input
              value={form.public_url}
              onChange={e => set('public_url', e.target.value)}
              placeholder="https://cloud.exemple.com"
              autoComplete="off"
            />
          </Field>
        </div>
      </Card>

      {/* Sticky save bar — same shape as the general settings panel. */}
      {dirty && (
        <div className="sticky bottom-4 z-10 flex items-center gap-3 rounded-xl border border-border bg-surface-0 px-4 py-3 shadow-md">
          <span className="flex-1 text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
            {t('mailsetup.unsaved')}
          </span>
          <Button variant="ghost" onClick={() => setForm(toForm(settings))}>
            {t('common.cancel')}
          </Button>
          <Button onClick={submit} loading={save.isPending}>
            {t('mailsetup.save')}
          </Button>
        </div>
      )}

      {/* ── Test ───────────────────────────────────────────────────────── */}
      <Card title={t('mailsetup.section_test')} icon={<Mail size={17} />}>
        <div className="space-y-3">
          <p className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
            {t('mailsetup.test_hint')}
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[240px] flex-1">
              <Field label={t('mailsetup.test_to')}>
                <Input
                  ref={testRef}
                  type="email"
                  value={testTo}
                  onChange={e => setTestTo(e.target.value)}
                  placeholder={settings.from_address || 'admin@exemple.com'}
                  autoComplete="off"
                />
              </Field>
            </div>
            <Button
              icon={<Send size={15} />}
              onClick={() => { setResult(null); sendTest.mutate() }}
              loading={sendTest.isPending}
              disabled={dirty}
            >
              {t('mailsetup.test_send')}
            </Button>
          </div>

          {/* The unsaved-changes case is worth naming: a test uses the STORED
              configuration, so testing before saving would probe the old one. */}
          {dirty && (
            <Callout variant="info">{t('mailsetup.unsaved')}</Callout>
          )}

          {result && (
            <Callout
              variant={result.ok ? 'success' : 'danger'}
              title={result.ok ? t('mailsetup.test_ok') : t('mailsetup.test_failed')}
            >
              <p>
                {result.to} · {result.host}:{result.port} · {result.security} ·{' '}
                {t('mailsetup.test_elapsed', { ms: result.elapsed_ms })}
              </p>
              {result.detail && (
                <>
                  <p className="mt-2 text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
                    {t('mailsetup.test_detail')}
                  </p>
                  {/* Raw relay answer, verbatim. It scrolls inside its own box:
                      an SMTP error is a single long line and must never make the
                      page scroll sideways. */}
                  <pre className="mt-1 max-w-full overflow-x-auto rounded-md border border-border bg-surface-1 px-2.5 py-2 font-mono text-text-primary"
                       style={{ fontSize: 'var(--kb-text-meta)' }}>
                    {result.detail}
                  </pre>
                </>
              )}
              {result.hint && (
                <p className="mt-2">
                  <span className="text-text-secondary">{t('mailsetup.test_advice')} — </span>
                  {result.hint}
                </p>
              )}
            </Callout>
          )}
        </div>
      </Card>
    </div>
  )
}
