import { useState, useEffect, type ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useSidebarStore } from '../store/sidebarStore'
import { useModulesStore } from '../store/modulesStore'
import { useThemeStore, type ThemeDef } from '../store/themeStore'
import { api } from '../api/client'
import { formatDistanceToNow, format } from 'date-fns'
import { getDateLocale } from '../i18n/dateLocale'
import { Slot, NotificationRegistry } from '../slots/SlotRegistry'
import type { Session, ApiToken } from '../types'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Key, Trash2, Copy, Check, Plus, X, ShieldCheck, ShieldOff, Shield, Users, Lock, Clock, User, Laptop, Bell, Palette, Monitor, Smartphone, Download, Apple, Calendar as CalendarIcon, Folder, ChevronRight, ArrowLeft, type LucideIcon } from 'lucide-react'
import * as ReactQRCode from 'react-qr-code'
import { Button, Input, Dropdown, Textarea, Checkbox, useIsMobile } from '@ui'

// react-qr-code is a CommonJS package: under Vite/rolldown the ESM-interop can
// nest the actual component under `.default`/`.QRCode` (sometimes several levels
// deep), so a plain default import resolves to a module *object* and crashes the
// render with React error #130 ("Element type is invalid… got: object"). Walk the
// interop wrappers and grab the first thing that is actually a function.
type QRCodeProps = { value: string; size?: number; bgColor?: string; fgColor?: string }
// A React element type is either a function component OR an object carrying
// `$$typeof` (forwardRef/memo). react-qr-code is a forwardRef component, so the
// real value is an OBJECT — a `typeof === 'function'` check would wrongly skip it.
function isReactComponent(x: unknown): x is ComponentType<QRCodeProps> {
  return typeof x === 'function' || (typeof x === 'object' && x !== null && '$$typeof' in x)
}
function resolveQRCode(mod: unknown): ComponentType<QRCodeProps> {
  let cur = mod
  for (let i = 0; cur && i < 5; i++) {
    if (isReactComponent(cur)) return cur
    const obj = cur as { QRCode?: unknown; default?: unknown }
    if (isReactComponent(obj.QRCode)) return obj.QRCode
    if (isReactComponent(obj.default)) return obj.default
    cur = obj.default
  }
  return mod as ComponentType<QRCodeProps>
}
const QRCode = resolveQRCode(ReactQRCode)

type Tab = 'profile' | 'notifications' | 'themes' | 'clients' | 'security' | 'sessions' | 'api-tokens'

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

const PROFILE_LANGS: [string, string][] = [
  ['fr', 'Français'], ['en', 'English'], ['es', 'Español'], ['de', 'Deutsch'],
  ['it', 'Italiano'], ['pt', 'Português'], ['nl', 'Nederlands'], ['pl', 'Polski'],
  ['ru', 'Русский'], ['ar', 'العربية'], ['zh', '中文'], ['ja', '日本語'], ['ko', '한국어'],
]
const PROFILE_LOCALES: [string, string][] = [
  ['fr-FR', 'French'], ['en-US', 'English (US)'], ['en-GB', 'English (UK)'],
  ['de-DE', 'German'], ['es-ES', 'Spanish'], ['it-IT', 'Italian'],
  ['pt-PT', 'Portuguese'], ['nl-NL', 'Dutch'], ['ja-JP', 'Japanese'], ['zh-CN', 'Chinese'],
]
function profileTimezones(): string[] {
  try {
    // Intl.supportedValuesOf is available in modern browsers.
    const fn = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf
    if (fn) return fn('timeZone')
  } catch { /* fall through */ }
  return ['UTC', 'Europe/Paris', 'Europe/London', 'America/New_York', 'America/Los_Angeles', 'Asia/Tokyo']
}

type Vis = 'public' | 'private'

// Per-field public/private toggle (people icon = visible to others, lock = private).
function VisToggle({ value, onChange }: { value: Vis; onChange: (v: Vis) => void }) {
  const { t } = useTranslation()
  const isPublic = value === 'public'
  return (
    <button
      type="button"
      onClick={() => onChange(isPublic ? 'private' : 'public')}
      title={isPublic ? t('settings.profile_vis_public', { defaultValue: 'Visible par tous' }) : t('settings.profile_vis_private', { defaultValue: 'Privé' })}
      className="text-text-tertiary hover:text-text-secondary transition-colors"
    >
      {isPublic ? <Users size={13} /> : <Lock size={13} />}
    </button>
  )
}

function Field({ label, vis, onVis, hint, action, className, children }: {
  label: string; vis?: Vis; onVis?: (v: Vis) => void; hint?: React.ReactNode; action?: React.ReactNode; className?: string; children: React.ReactNode
}) {
  return (
    <div className={className}>
      <div className="flex items-center gap-1.5 mb-1">
        <label className="text-sm font-medium text-text-primary">{label}</label>
        {vis && onVis && <VisToggle value={vis} onChange={onVis} />}
        {action && <span className="ml-auto">{action}</span>}
      </div>
      {children}
      {hint && <div className="text-xs text-text-tertiary mt-1 leading-relaxed">{hint}</div>}
    </div>
  )
}

// Titled card grouping related profile fields (2-column responsive grid inside).
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border overflow-hidden">
      <div className="px-5 py-3 border-b border-border bg-surface-1">
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      </div>
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">{children}</div>
    </section>
  )
}

function ProfileTab() {
  const { t, i18n } = useTranslation()
  const { user, updateUser } = useAuthStore()
  const prefs = (user?.preferences ?? {}) as Record<string, unknown>
  const prof = (prefs.profile ?? {}) as Record<string, unknown>
  const s = (v: unknown) => (typeof v === 'string' ? v : '')

  const [f, setF] = useState({
    fullName:       user?.display_name ?? '',
    pronouns:       s(prof.pronouns),
    extraEmails:    Array.isArray(prof.extraEmails) ? (prof.extraEmails as string[]) : [],
    phone:          s(prof.phone),
    location:       s(prof.location),
    birthday:       s(prof.birthday),
    language:       s(prefs.language) || 'fr',
    locale:         s(prefs.locale),
    firstDayOfWeek: s(prefs.firstDayOfWeek) || 'auto',
    timezone:       s(prefs.timezone),
    website:        s(prof.website),
    x:              s(prof.x),
    bluesky:        s(prof.bluesky),
    fediverse:      s(prof.fediverse),
    organization:   s(prof.organization),
    jobFunction:    s(prof.jobFunction),
    title:          s(prof.title),
    bio:            s(prof.bio),
  })
  const [vis, setVis] = useState<Record<string, Vis>>({
    fullName: 'public', pronouns: 'public', emails: 'public',
    phone: 'private', location: 'private', birthday: 'private',
    website: 'private', x: 'private', bluesky: 'private', fediverse: 'private',
    organization: 'private', jobFunction: 'private', title: 'private', bio: 'private',
    ...((prof.visibility as Record<string, Vis>) ?? {}),
  })
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF(p => ({ ...p, [k]: v }))
  const setV = (k: string) => (v: Vis) => setVis(p => ({ ...p, [k]: v }))
  const tz = profileTimezones()

  // Live preview of the chosen locale: current date/time + week start.
  const localePreview = (() => {
    try { return new Intl.DateTimeFormat(f.locale || undefined, { dateStyle: 'short', timeStyle: 'medium' }).format(new Date()) } catch { return '' }
  })()
  const weekStartLabel = f.firstDayOfWeek === '0'
    ? t('settings.profile_week_sun', { defaultValue: 'Dimanche' })
    : f.firstDayOfWeek === '6'
      ? t('settings.profile_week_sat', { defaultValue: 'Samedi' })
      : t('settings.profile_week_mon', { defaultValue: 'Lundi' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      const profile = {
        pronouns: f.pronouns, extraEmails: f.extraEmails.map(x => x.trim()).filter(Boolean),
        phone: f.phone, location: f.location, birthday: f.birthday, website: f.website,
        x: f.x, bluesky: f.bluesky, fediverse: f.fediverse, organization: f.organization,
        jobFunction: f.jobFunction, title: f.title, bio: f.bio, visibility: vis,
      }
      const preferences = {
        language: f.language, locale: f.locale, firstDayOfWeek: f.firstDayOfWeek, timezone: f.timezone, profile,
      }
      const { data } = await api.patch<{ user: typeof user }>('/me', { display_name: f.fullName, preferences })
      if (data.user) updateUser(data.user as Parameters<typeof updateUser>[0])
      if (f.language && f.language !== i18n.language) i18n.changeLanguage(f.language)
      setSaved(true); setTimeout(() => setSaved(false), 2200)
    } finally { setBusy(false) }
  }

  const labelSelect = (
    <Dropdown width="100%" value={f.language} onChange={v => set('language', v)}
      options={PROFILE_LANGS.map(([value, label]) => ({ value, label }))} />
  )

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl">
      <div className="space-y-5">
        <Section title={t('settings.profile_sec_identity', { defaultValue: 'Identité et coordonnées' })}>
        <Field label={t('settings.profile_full_name', { defaultValue: 'Nom complet' })} vis={vis.fullName} onVis={setV('fullName')}>
          <Input value={f.fullName} onChange={e => set('fullName', e.target.value)} />
        </Field>

        <Field label={t('settings.profile_pronouns', { defaultValue: 'Pronoms' })} vis={vis.pronouns} onVis={setV('pronouns')}>
          <Input value={f.pronouns} onChange={e => set('pronouns', e.target.value)}
            placeholder={t('settings.profile_pronouns_ph', { defaultValue: 'Vos pronoms. Par exemple : ils/elles' })} />
        </Field>

        <Field
          label={t('settings.profile_email', { defaultValue: 'E-mail' })}
          vis={vis.emails} onVis={setV('emails')}
          className="md:col-span-2"
          action={<button type="button" onClick={() => set('extraEmails', [...f.extraEmails, ''])}
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"><Plus size={13} />{t('settings.profile_add', { defaultValue: 'Ajouter' })}</button>}
          hint={t('settings.profile_email_hint', { defaultValue: 'Adresse e-mail principale pour la réinitialisation du mot de passe et les notifications' })}
        >
          <div className="mb-2"><Input value={user?.email ?? ''} disabled /></div>
          {f.extraEmails.map((em, i) => (
            <div key={i} className="flex items-center gap-2 mb-2">
              <div className="flex-1">
                <Input type="email" value={em} placeholder="email@exemple.com"
                  onChange={e => set('extraEmails', f.extraEmails.map((x, j) => j === i ? e.target.value : x))} />
              </div>
              <button type="button" onClick={() => set('extraEmails', f.extraEmails.filter((_, j) => j !== i))}
                className="text-text-tertiary hover:text-danger shrink-0"><Trash2 size={15} /></button>
            </div>
          ))}
        </Field>

        <Field label={t('settings.profile_phone', { defaultValue: 'Numéro de téléphone' })} vis={vis.phone} onVis={setV('phone')}>
          <Input value={f.phone} onChange={e => set('phone', e.target.value)}
            placeholder={t('settings.profile_phone_ph', { defaultValue: 'Votre numéro de téléphone' })} />
        </Field>

        <Field label={t('settings.profile_location', { defaultValue: 'Localisation' })} vis={vis.location} onVis={setV('location')}>
          <Input value={f.location} onChange={e => set('location', e.target.value)}
            placeholder={t('settings.profile_location_ph', { defaultValue: 'Votre ville' })} />
        </Field>

        <Field label={t('settings.profile_birthday', { defaultValue: 'Date de naissance' })} vis={vis.birthday} onVis={setV('birthday')}
          hint={t('settings.profile_birthday_hint', { defaultValue: 'Saisissez votre date de naissance' })}>
          <Input type="date" value={f.birthday} onChange={e => set('birthday', e.target.value)} />
        </Field>

        </Section>

        <Section title={t('settings.profile_sec_region', { defaultValue: 'Langue et région' })}>
        <Field label={t('settings.profile_language', { defaultValue: 'Langue' })}
          hint={<a href="https://github.com/kubuno/kubuno" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{t('settings.profile_help_translate', { defaultValue: 'Aider à traduire' })}</a>}>
          {labelSelect}
        </Field>

        <Field label={t('settings.profile_locale', { defaultValue: 'Paramètres régionaux' })}
          hint={<><span className="flex items-center gap-1.5"><Clock size={12} />{localePreview}</span><span>{t('settings.profile_week_start', { defaultValue: 'Les semaines commencent le {{day}}', day: weekStartLabel })}</span></>}>
          <Dropdown width="100%" value={f.locale} onChange={v => set('locale', v)}
            options={[{ value: '', label: t('settings.profile_locale_auto', { defaultValue: 'Automatique' }) },
              ...PROFILE_LOCALES.map(([value, label]) => ({ value, label }))]} />
        </Field>

        <Field label={t('settings.profile_first_day', { defaultValue: 'Premier jour de la semaine' })}>
          <Dropdown width="100%" value={f.firstDayOfWeek} onChange={v => set('firstDayOfWeek', v)}
            options={[
              { value: 'auto', label: t('settings.profile_first_day_auto', { defaultValue: 'Issu de votre locale' }) },
              { value: '1', label: t('settings.profile_week_mon', { defaultValue: 'Lundi' }) },
              { value: '0', label: t('settings.profile_week_sun', { defaultValue: 'Dimanche' }) },
              { value: '6', label: t('settings.profile_week_sat', { defaultValue: 'Samedi' }) },
            ]} />
        </Field>

        <Field label={t('settings.profile_timezone', { defaultValue: 'Fuseau horaire' })}>
          <Dropdown width="100%" value={f.timezone} onChange={v => set('timezone', v)}
            options={[{ value: '', label: t('settings.profile_locale_auto', { defaultValue: 'Automatique' }) },
              ...tz.map(z => ({ value: z, label: z }))]} />
        </Field>

        </Section>

        <Section title={t('settings.profile_sec_social', { defaultValue: 'Réseaux, organisation et profil' })}>
        <Field label={t('settings.profile_website', { defaultValue: 'Site web' })} vis={vis.website} onVis={setV('website')}>
          <Input value={f.website} onChange={e => set('website', e.target.value)}
            placeholder={t('settings.profile_website_ph', { defaultValue: 'Votre site web' })} />
        </Field>

        <Field label={t('settings.profile_x', { defaultValue: 'X (anciennement Twitter)' })} vis={vis.x} onVis={setV('x')}>
          <Input value={f.x} onChange={e => set('x', e.target.value)}
            placeholder={t('settings.profile_x_ph', { defaultValue: 'Votre identifiant X (anciennement Twitter)' })} />
        </Field>

        <Field label="Bluesky" vis={vis.bluesky} onVis={setV('bluesky')}>
          <Input value={f.bluesky} onChange={e => set('bluesky', e.target.value)}
            placeholder={t('settings.profile_bluesky_ph', { defaultValue: 'Pseudo Bluesky' })} />
        </Field>

        <Field label={t('settings.profile_fediverse', { defaultValue: 'Fediverse (ex. Mastodon)' })} vis={vis.fediverse} onVis={setV('fediverse')}>
          <Input value={f.fediverse} onChange={e => set('fediverse', e.target.value)}
            placeholder={t('settings.profile_fediverse_ph', { defaultValue: 'Votre pseudo' })} />
        </Field>

        <Field label={t('settings.profile_organization', { defaultValue: 'Organisation' })} vis={vis.organization} onVis={setV('organization')}>
          <Input value={f.organization} onChange={e => set('organization', e.target.value)}
            placeholder={t('settings.profile_organization_ph', { defaultValue: 'Votre organisation' })} />
        </Field>

        <Field label={t('settings.profile_job', { defaultValue: 'Fonction' })} vis={vis.jobFunction} onVis={setV('jobFunction')}>
          <Input value={f.jobFunction} onChange={e => set('jobFunction', e.target.value)}
            placeholder={t('settings.profile_job_ph', { defaultValue: 'Votre fonction' })} />
        </Field>

        <Field label={t('settings.profile_title', { defaultValue: 'Titre' })} vis={vis.title} onVis={setV('title')}>
          <Input value={f.title} onChange={e => set('title', e.target.value)}
            placeholder={t('settings.profile_title_ph', { defaultValue: 'Votre titre' })} />
        </Field>

        <Field label={t('settings.profile_bio', { defaultValue: 'À propos' })} vis={vis.bio} onVis={setV('bio')} className="md:col-span-2">
          <Textarea value={f.bio} onChange={e => set('bio', e.target.value)} className="min-h-[150px]"
            placeholder={t('settings.profile_bio_ph', { defaultValue: 'Votre biographie. Le format Markdown est pris en charge.' })} />
        </Field>
        </Section>
      </div>

      <div className="mt-6">
        <Button type="submit" loading={busy}>
          {saved ? t('settings.profile_saved') : t('settings.save')}
        </Button>
      </div>
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

// ── Notifications ───────────────────────────────────────────────────────────────

function NotifCheck({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return <Checkbox checked={checked} onChange={onChange} />
}

function NotificationsTab() {
  const { t } = useTranslation()
  const { user, updateUser } = useAuthStore()
  const { activeModules } = useModulesStore()
  const activeIds = new Set(activeModules.map(m => m.module_id))
  const groups = NotificationRegistry.getGroups(activeIds)

  const stored = (user?.preferences?.notifications ?? {}) as Record<string, unknown>
  const sa = (stored.activity ?? {}) as Record<string, { email?: boolean; push?: boolean }>
  const str = (v: unknown, d: string) => (typeof v === 'string' ? v : d)

  const [n, setN] = useState({
    emailReminder:  str(stored.emailReminder, 'never'),
    soundOnNotif:   !!stored.soundOnNotif,
    soundOnCall:    !!stored.soundOnCall,
    emailFrequency: str(stored.emailFrequency, 'hourly'),
    dailyDigest:    !!stored.dailyDigest,
  })
  const [matrix, setMatrix] = useState<Record<string, { email: boolean; push: boolean }>>(() => {
    const m: Record<string, { email: boolean; push: boolean }> = {}
    for (const g of groups) for (const a of g.activities) {
      const k = `${g.moduleId}:${a.id}`
      m[k] = { email: sa[k]?.email ?? !!a.emailDefault, push: sa[k]?.push ?? !!a.pushDefault }
    }
    return m
  })
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  const cell = (k: string, a: { emailDefault?: boolean; pushDefault?: boolean }) =>
    matrix[k] ?? { email: !!a.emailDefault, push: !!a.pushDefault }
  const toggle = (k: string, a: { emailDefault?: boolean; pushDefault?: boolean }, ch: 'email' | 'push') =>
    setMatrix(m => { const c = m[k] ?? { email: !!a.emailDefault, push: !!a.pushDefault }; return { ...m, [k]: { ...c, [ch]: !c[ch] } } })

  const save = async () => {
    setBusy(true)
    try {
      const notifications = { ...n, activity: matrix }
      const { data } = await api.patch<{ user: typeof user }>('/me', { preferences: { notifications } })
      if (data.user) updateUser(data.user as Parameters<typeof updateUser>[0])
      setSaved(true); setTimeout(() => setSaved(false), 2200)
    } finally { setBusy(false) }
  }

  return (
    <div className="max-w-3xl space-y-8">
      {/* Global notification options */}
      <section>
        <h2 className="text-base font-semibold text-text-primary mb-3">{t('settings.notif_title', { defaultValue: 'Notifications' })}</h2>
        <label className="block text-sm text-text-secondary mb-1.5">
          {t('settings.notif_email_reminder', { defaultValue: 'Envoyer par e-mail des rappels des notifications non gérées après :' })}
        </label>
        <Dropdown value={n.emailReminder} onChange={v => setN(p => ({ ...p, emailReminder: v }))}
          options={[
            { value: 'never', label: t('settings.notif_never', { defaultValue: 'Jamais' }) },
            { value: '1h', label: t('settings.notif_after_1h', { defaultValue: 'Après 1 heure' }) },
            { value: '3h', label: t('settings.notif_after_3h', { defaultValue: 'Après 3 heures' }) },
            { value: '1d', label: t('settings.notif_after_1d', { defaultValue: 'Après 1 jour' }) },
          ]} />
        <label className="flex items-center gap-2 mt-3 cursor-pointer select-none">
          <NotifCheck checked={n.soundOnNotif} onChange={() => setN(p => ({ ...p, soundOnNotif: !p.soundOnNotif }))} />
          <span className="text-sm text-text-primary">{t('settings.notif_sound', { defaultValue: "Jouer un son lorsqu'une notification arrive" })}</span>
        </label>
        <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
          <NotifCheck checked={n.soundOnCall} onChange={() => setN(p => ({ ...p, soundOnCall: !p.soundOnCall }))} />
          <span className="text-sm text-text-primary">{t('settings.notif_sound_call', { defaultValue: "Jouer un son quand un appel est lancé" })}</span>
        </label>
      </section>

      {/* Activity matrix (E-mail / Push) — contributed by modules */}
      <section>
        <h2 className="text-base font-semibold text-text-primary mb-1">{t('settings.notif_activity', { defaultValue: 'Activité' })}</h2>
        <p className="text-sm text-text-tertiary mb-5">
          {t('settings.notif_activity_desc', { defaultValue: 'Sélectionnez les activités pour lesquelles vous souhaitez recevoir une notification par e-mail ou une notification push.' })}
        </p>

        <div className="space-y-7">
          {groups.map(g => (
            <div key={`${g.moduleId}:${g.title}`}>
              <div className="flex items-center border-b-2 border-border pb-2 mb-1">
                <span className="flex-1 text-sm font-bold text-text-primary">{g.title}</span>
                <span className="w-16 text-center text-xs font-medium text-text-tertiary">{t('settings.notif_col_email', { defaultValue: 'E-mail' })}</span>
                <span className="w-16 text-center text-xs font-medium text-text-tertiary">{t('settings.notif_col_push', { defaultValue: 'Push' })}</span>
              </div>
              {g.activities.map(a => {
                const k = `${g.moduleId}:${a.id}`
                const c = cell(k, a)
                return (
                  <div key={k} className="flex items-center py-2.5 border-b border-border/60 last:border-0">
                    <span className="flex-1 text-sm text-text-primary pr-4">{a.label}</span>
                    <span className="w-16 flex justify-center"><NotifCheck checked={c.email} onChange={() => toggle(k, a, 'email')} /></span>
                    <span className="w-16 flex justify-center"><NotifCheck checked={c.push} onChange={() => toggle(k, a, 'push')} /></span>
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 mt-6">
          <label className="text-sm text-text-secondary">{t('settings.notif_email_freq', { defaultValue: "Envoyer des e-mails d'activité" })}</label>
          <Dropdown value={n.emailFrequency} onChange={v => setN(p => ({ ...p, emailFrequency: v }))}
            options={[
              { value: 'asap', label: t('settings.notif_freq_asap', { defaultValue: 'Dès que possible' }) },
              { value: 'hourly', label: t('settings.notif_freq_hourly', { defaultValue: 'Toutes les heures' }) },
              { value: 'daily', label: t('settings.notif_freq_daily', { defaultValue: 'Une fois par jour' }) },
              { value: 'weekly', label: t('settings.notif_freq_weekly', { defaultValue: 'Une fois par semaine' }) },
            ]} />
        </div>
      </section>

      {/* Daily digest */}
      <section>
        <h2 className="text-base font-semibold text-text-primary mb-3">{t('settings.notif_digest_title', { defaultValue: 'Résumé journalier des activités' })}</h2>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <NotifCheck checked={n.dailyDigest} onChange={() => setN(p => ({ ...p, dailyDigest: !p.dailyDigest }))} />
          <span className="text-sm text-text-primary">{t('settings.notif_digest_on', { defaultValue: 'Recevoir un résumé des activités chaque matin' })}</span>
        </label>
      </section>

      <Button onClick={save} loading={busy}>
        {saved ? t('settings.profile_saved') : t('settings.save')}
      </Button>
    </div>
  )
}

// Core-owned notification activities (account & security). Modules add their own
// groups via NotificationRegistry.register(...) from their entry.ts.
NotificationRegistry.register({
  moduleId: 'core', title: 'Compte et sécurité', order: 90,
  activities: [
    { id: 'group_membership', label: 'Vos adhésions aux groupes ont été modifiées', emailDefault: true },
    { id: 'password_email',   label: 'Votre mot de passe ou adresse e-mail a été modifié', emailDefault: true },
    { id: 'security',         label: 'Connexion à un nouvel appareil ou navigateur', emailDefault: true, pushDefault: true },
    { id: 'totp',             label: "TOTP (application d'authentification)", emailDefault: true, pushDefault: true },
  ],
})

// ── Thèmes (per-user theme selection, applied live + persisted cross-device) ────

function ThemePreview({ theme }: { theme: ThemeDef }) {
  const bg      = theme.vars['--color-surface-1']     ?? '#f8f9fa'
  const surface = theme.vars['--color-surface-0']     ?? '#ffffff'
  const primary = theme.vars['--color-primary']       ?? '#1a73e8'
  const text    = theme.vars['--color-text-primary']  ?? '#202124'
  const textSec = theme.vars['--color-text-secondary'] ?? '#5f6368'
  const border  = theme.vars['--color-border']        ?? '#e0e0e0'
  return (
    <div className="rounded-lg overflow-hidden border" style={{ background: bg, borderColor: border, height: 80 }}>
      <div className="flex items-center gap-1.5 px-2 py-1.5" style={{ background: surface, borderBottom: `1px solid ${border}` }}>
        <div className="rounded-full w-2 h-2" style={{ background: primary }} />
        <div className="rounded h-1.5 w-12" style={{ background: textSec, opacity: 0.3 }} />
        <div className="flex-1" />
        <div className="rounded-full w-4 h-4" style={{ background: primary, opacity: 0.6 }} />
      </div>
      <div className="flex gap-1.5 p-2">
        <div className="flex flex-col gap-1">
          <div className="rounded h-1.5 w-10" style={{ background: primary, opacity: 0.7 }} />
          <div className="rounded h-1.5 w-8"  style={{ background: textSec, opacity: 0.4 }} />
          <div className="rounded h-1.5 w-9"  style={{ background: textSec, opacity: 0.4 }} />
        </div>
        <div className="flex-1 rounded" style={{ background: surface, border: `1px solid ${border}` }}>
          <div className="m-1.5 flex flex-col gap-1">
            <div className="rounded h-1.5 w-14" style={{ background: text, opacity: 0.5 }} />
            <div className="rounded h-1.5 w-10" style={{ background: textSec, opacity: 0.3 }} />
          </div>
        </div>
      </div>
    </div>
  )
}

function ThemesTab() {
  const { t } = useTranslation()
  const { user, updateUser } = useAuthStore()
  const { themes, activeThemeId, applyTheme, fetchThemes } = useThemeStore()

  useEffect(() => { if (themes.length === 0) fetchThemes() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const select = async (id: string) => {
    applyTheme(id) // applies CSS vars immediately + remembers in localStorage
    try {
      const { data } = await api.patch<{ user: typeof user }>('/me', { preferences: { theme: id } })
      if (data.user) updateUser(data.user as Parameters<typeof updateUser>[0])
    } catch { /* the theme is already applied visually; persistence is best-effort */ }
  }

  return (
    <div className="max-w-3xl">
      <p className="text-sm text-text-tertiary mb-5">
        {t('settings.themes_desc', { defaultValue: "Choisissez l'apparence de Kubuno. Votre choix vous suit sur tous vos appareils." })}
      </p>
      {themes.length === 0 ? (
        <p className="text-sm text-text-tertiary">{t('settings.themes_loading', { defaultValue: 'Chargement…' })}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {themes.map(theme => {
            const isActive = theme.id === activeThemeId
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => select(theme.id)}
                className={`relative rounded-xl border-2 p-3 text-left transition-all ${
                  isActive ? 'border-primary shadow-sm' : 'border-border hover:border-border-strong'}`}
              >
                <ThemePreview theme={theme} />
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-text-primary truncate pr-1">{theme.name}</span>
                  {isActive && <Check size={14} className="text-primary shrink-0" />}
                </div>
                <span className="text-xs text-text-tertiary capitalize">
                  {theme.color_scheme === 'dark'
                    ? t('settings.themes_dark', { defaultValue: 'Sombre' })
                    : t('settings.themes_light', { defaultValue: 'Clair' })}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Clients (download apps + connect external CalDAV/CardDAV/WebDAV) ─────────────

// Placeholder download links — wired to real store pages later.
function StoreBadge({ href, Icon, top, bottom, sub }: {
  href: string; Icon: LucideIcon; top: string; bottom: string; sub?: string
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-3 rounded-xl bg-[#1f1f1f] hover:bg-black text-white px-5 py-2.5 transition-colors">
      <Icon size={26} className="shrink-0" />
      <span className="flex flex-col leading-tight text-left">
        <span className="text-[10px] uppercase tracking-wider opacity-75">{top}</span>
        <span className="text-lg font-semibold -mt-0.5">{bottom}</span>
        {sub && <span className="text-[10px] opacity-70 -mt-0.5">{sub}</span>}
      </span>
    </a>
  )
}

function ClientsTab() {
  const { t } = useTranslation()
  const { activeModules } = useModulesStore()
  const activeIds = new Set(activeModules.map(m => m.module_id))
  const [copied, setCopied] = useState(false)
  const serverUrl = typeof window !== 'undefined' ? window.location.origin : ''

  const copy = () => {
    const done = () => { setCopied(true); setTimeout(() => setCopied(false), 1800) }
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(serverUrl).then(done).catch(() => fallbackCopy(serverUrl, done))
    else fallbackCopy(serverUrl, done)
  }

  // Connect-buttons only for installed modules that expose a sync protocol.
  const connectors = [
    { id: 'calendar', to: '/calendar/settings', Icon: CalendarIcon, label: t('settings.cli_connect_calendar', { defaultValue: 'Connectez votre agenda (CalDAV)' }) },
    { id: 'tasks',    to: '/tasks/settings',    Icon: Check,        label: t('settings.cli_connect_tasks', { defaultValue: 'Connectez vos tâches (CalDAV)' }) },
    { id: 'contacts', to: '/contacts/settings', Icon: Users,        label: t('settings.cli_connect_contacts', { defaultValue: 'Connectez vos contacts (CardDAV)' }) },
    { id: 'drive',    to: '/drive/settings',    Icon: Folder,       label: t('settings.cli_connect_webdav', { defaultValue: 'Accédez à vos fichiers via WebDAV' }) },
  ].filter(c => activeIds.has(c.id))

  return (
    <div className="max-w-3xl space-y-10">
      {/* Sync apps */}
      <section>
        <h2 className="text-lg font-semibold text-text-primary mb-2">{t('settings.cli_apps_title', { defaultValue: 'Obtenez les applications pour synchroniser vos fichiers' })}</h2>
        <p className="text-sm text-text-secondary mb-4 leading-relaxed">
          {t('settings.cli_apps_desc', { defaultValue: 'Kubuno vous permet d’accéder à vos fichiers où que vous soyez. Nos clients de bureau et mobiles sont disponibles gratuitement pour les principales plateformes.' })}
        </p>
        <div className="flex flex-wrap gap-3">
          <StoreBadge href="#" Icon={Monitor}    top={t('settings.cli_download', { defaultValue: 'Télécharger' })} bottom={t('settings.cli_desktop', { defaultValue: 'Application bureau' })} sub="Windows · macOS · Linux" />
          <StoreBadge href="#" Icon={Smartphone} top={t('settings.cli_get_on', { defaultValue: 'Disponible sur' })} bottom="Google Play" />
          <StoreBadge href="#" Icon={Smartphone} top={t('settings.cli_get_on', { defaultValue: 'Disponible sur' })} bottom="F-Droid" />
          <StoreBadge href="#" Icon={Apple}      top={t('settings.cli_download_on', { defaultValue: 'Télécharger sur' })} bottom="App Store" />
        </div>
        <p className="text-xs text-text-tertiary mt-4 leading-relaxed">
          {t('settings.cli_apps_token', { defaultValue: 'Configurez les clients de synchronisation à l’aide d’un jeton d’application.' })}{' '}
          <Link to="/settings?tab=api-tokens" className="text-primary hover:underline">{t('settings.cli_apps_token_link', { defaultValue: 'Gérer les jetons' })}</Link>
        </p>
      </section>

      {/* Connect external apps via DAV protocols */}
      {connectors.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-2">{t('settings.cli_connect_title', { defaultValue: 'Connectez d’autres applications à Kubuno' })}</h2>
          <p className="text-sm text-text-secondary mb-4 leading-relaxed">
            {t('settings.cli_connect_desc', { defaultValue: 'En parallèle des applications, vous pouvez connecter tout logiciel prenant en charge les protocoles WebDAV / CalDAV / CardDAV à Kubuno.' })}
          </p>
          <div className="flex flex-wrap gap-3">
            {connectors.map(c => (
              <Link key={c.id} to={c.to}
                className="inline-flex items-center gap-2 rounded-lg bg-surface-1 hover:bg-surface-2 border border-border px-4 py-2.5 text-sm font-medium text-text-primary transition-colors">
                <c.Icon size={16} className="text-primary" /> {c.label}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Server address */}
      <section>
        <h2 className="text-lg font-semibold text-text-primary mb-2">{t('settings.cli_server_title', { defaultValue: 'Adresse du serveur' })}</h2>
        <p className="text-sm text-text-secondary mb-3 leading-relaxed">
          {t('settings.cli_server_desc', { defaultValue: 'Utilisez ce lien pour connecter vos applications et votre client de bureau à ce serveur :' })}
        </p>
        <div className="flex items-center gap-2 max-w-md">
          <div className="flex-1"><Input readOnly value={serverUrl} /></div>
          <button type="button" onClick={copy} title={t('settings.cli_copy', { defaultValue: 'Copier' })}
            className="p-2.5 rounded-lg border border-border text-text-secondary hover:bg-surface-2 transition-colors">
            {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
          </button>
        </div>
      </section>
    </div>
  )
}

// ── Navigation (overrides the app's left panel on /settings) ────────────────────

const SETTINGS_NAV: { id: Tab; labelKey: string; defaultLabel: string; Icon: LucideIcon }[] = [
  { id: 'profile',       labelKey: 'settings.tab_profile',       defaultLabel: 'Profile',       Icon: User },
  { id: 'notifications', labelKey: 'settings.tab_notifications', defaultLabel: 'Notifications', Icon: Bell },
  { id: 'themes',        labelKey: 'settings.tab_themes',        defaultLabel: 'Thèmes',        Icon: Palette },
  { id: 'clients',       labelKey: 'settings.tab_clients',       defaultLabel: 'Clients',       Icon: Download },
  { id: 'security',      labelKey: 'settings.tab_security',      defaultLabel: 'Sécurité',      Icon: Shield },
  { id: 'sessions',      labelKey: 'settings.tab_sessions',      defaultLabel: 'Sessions',      Icon: Laptop },
  { id: 'api-tokens',    labelKey: 'settings.tab_api',           defaultLabel: 'API tokens',    Icon: Key },
]

// Rendered inside AppSidebar as the left panel while on /settings (replaces the
// module navigation). Tab selection is URL-driven (?tab=) so panel and content
// stay in sync. `collapsed` → icons only, to match the rest of the shell.
function SettingsSidebar({ collapsed }: { collapsed?: boolean }) {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const active = (params.get('tab') as Tab) || 'profile'
  return (
    <nav className={`flex-1 space-y-0.5 ${collapsed ? 'px-2' : 'px-3'}`}>
      {!collapsed && (
        <p className="px-3 pt-1 pb-2 text-xs font-semibold uppercase tracking-wider text-text-tertiary">
          {t('settings.page_title')}
        </p>
      )}
      {SETTINGS_NAV.map(({ id, labelKey, defaultLabel, Icon }) => {
        const label = t(labelKey, { defaultValue: defaultLabel })
        return (
          <button
            key={id}
            type="button"
            onClick={() => navigate(`/settings?tab=${id}`)}
            title={collapsed ? label : undefined}
            className={`w-full flex items-center gap-3 rounded-lg text-sm transition-colors ${
              collapsed ? 'justify-center py-2.5' : 'px-3 py-2'} ${
              active === id ? 'bg-primary-light text-primary font-medium' : 'text-text-secondary hover:bg-surface-2'}`}
          >
            <Icon size={18} className="shrink-0" />
            {!collapsed && label}
          </button>
        )
      })}
    </nav>
  )
}

// Override the left panel on /settings (registered once at module load; resolves
// only when the route is /settings, so it is inert elsewhere).
useSidebarStore.getState().register({
  moduleId:      'core-settings',
  routePrefix:   '/settings',
  SidebarBody:   SettingsSidebar,
  collapsedBody: true,
})

// ── Page ──────────────────────────────────────────────────────────────────────

/**
 * Section index (mobile only). The section nav lives in the left panel, which on
 * a phone is an off-canvas drawer — so a mobile user landing on /settings would
 * see "Profile" and no hint that six other sections exist. Below `lg`, /settings
 * (with no ?tab=) becomes a plain list of sections, and picking one drills into
 * it with a back row. Same URLs, so links and the desktop layout are untouched.
 */
function MobileSettingsIndex() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  return (
    <div className="pb-2">
      <h1 className="text-xl font-medium text-text-primary px-1 mb-3">{t('settings.page_title')}</h1>
      <div className="divide-y divide-border rounded-xl border border-border overflow-hidden bg-white">
        {SETTINGS_NAV.map(({ id, labelKey, defaultLabel, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => navigate(`/settings?tab=${id}`)}
            className="w-full flex items-center gap-4 px-4 h-[56px] text-left active:bg-surface-2 transition-colors"
          >
            <Icon size={21} className="shrink-0 text-text-secondary" />
            <span className="flex-1 min-w-0 truncate text-[15px] text-text-primary">
              {t(labelKey, { defaultValue: defaultLabel })}
            </span>
            <ChevronRight size={18} className="shrink-0 text-text-tertiary" />
          </button>
        ))}
      </div>
      {/* Module-contributed sections stay reachable from the index. */}
      <div className="mt-4"><Slot name="settings-sections" /></div>
    </div>
  )
}

export default function SettingsPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const rawTab = params.get('tab')
  const tab = (rawTab as Tab) || 'profile'

  const current = SETTINGS_NAV.find(navItem => navItem.id === tab)

  // Mobile, no section chosen → the index (see MobileSettingsIndex).
  if (isMobile && !rawTab) return <MobileSettingsIndex />

  return (
    <div className="max-w-4xl">
      {isMobile ? (
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="flex items-center gap-2 -ml-1 mb-4 h-11 pr-3 pl-1 rounded-lg text-text-primary active:bg-surface-2 transition-colors"
        >
          <ArrowLeft size={20} className="shrink-0" />
          <span className="text-lg font-medium truncate">
            {current ? t(current.labelKey, { defaultValue: current.defaultLabel }) : t('settings.page_title')}
          </span>
        </button>
      ) : (
        <h1 className="text-xl font-medium text-text-primary mb-6">
          {current ? t(current.labelKey, { defaultValue: current.defaultLabel }) : t('settings.page_title')}
        </h1>
      )}

      {tab === 'profile'       && <ProfileTab />}
      {tab === 'notifications' && <NotificationsTab />}
      {tab === 'themes'        && <ThemesTab />}
      {tab === 'clients'       && <ClientsTab />}
      {tab === 'security'      && <SecurityTab />}
      {tab === 'sessions'      && <SessionsTab />}
      {tab === 'api-tokens'    && <ApiTokensTab />}

      {/* On mobile these live in the index, not under every section. */}
      {!isMobile && <Slot name="settings-sections" />}
    </div>
  )
}
