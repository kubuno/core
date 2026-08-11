import { useEffect, useState, type ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import { ShieldCheck, ShieldOff, Shield } from 'lucide-react'
import * as ReactQRCode from 'react-qr-code'
import { Button, Callout, Input } from '@ui'
import { useAuthStore } from '../../store/authStore'
import { api } from '../../api/client'
import { BackupCodesPanel } from './BackupCodesPanel'
import { BackupCodesSection } from './BackupCodesSection'

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

type TotpSetupStep = 'idle' | 'qr' | 'verify' | 'codes' | 'done'

/** Instance requirement, as reported by `GET /me/security`. */
interface Admin2faStatus {
  required: boolean
  satisfied: boolean
  grace_until: string | null
  days_left: number | null
  locked_out: boolean
}

export function TwoFactorSection() {
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
  const [freshCodes, setFreshCodes] = useState<string[]>([])
  const [requirement, setRequirement] = useState<Admin2faStatus | null>(null)

  const enabled = user?.totp_enabled ?? false

  // The requirement banner is fetched rather than inferred: whether the instance
  // demands a second factor of its administrators, and by when, is a server fact.
  useEffect(() => {
    let cancelled = false
    api
      .get<{ admin_2fa: Admin2faStatus }>('/me/security')
      .then(({ data }) => { if (!cancelled) setRequirement(data.admin_2fa) })
      .catch(() => { /* purely informational: a failure must not break the tab */ })
    return () => { cancelled = true }
  }, [enabled])

  const requirementBanner =
    requirement && requirement.required && !requirement.satisfied ? (
      <Callout
        variant={requirement.locked_out ? 'danger' : 'warning'}
        title={t(requirement.locked_out ? 'settings.tfa_req_locked_title' : 'settings.tfa_req_title')}
        className="mb-4"
        t={t}
      >
        {requirement.locked_out
          ? t('settings.tfa_req_locked_desc')
          : t('settings.tfa_req_desc', { count: requirement.days_left ?? 0 })}
      </Callout>
    ) : null

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
      const { data } = await api.post<{ backup_codes: string[] }>('/me/2fa/enable', { code })
      updateUser({ totp_enabled: true })
      // The codes arrive with the enrolment and are readable exactly here. The
      // step exists so the sheet cannot be skipped past by the same click that
      // turned the second factor on.
      setFreshCodes(data.backup_codes ?? [])
      setStep('codes')
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

  // Checked BEFORE the `enabled` branch: enrolling flips `totp_enabled`, and the
  // sheet of codes must not be swallowed by the state change that produced it.
  if (step === 'codes') {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-text-primary">{t('settings.tfa_title')}</h3>
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-success-light border border-success">
          <ShieldCheck size={18} className="text-success shrink-0" />
          <p className="text-sm font-medium text-success">{t('settings.tfa_on_success')}</p>
        </div>
        <BackupCodesPanel codes={freshCodes} onDone={() => setStep('done')} />
      </div>
    )
  }

  if (enabled) {
    return (
      <div>
        <h3 className="text-sm font-medium text-text-primary mb-3">{t('settings.tfa_title')}</h3>
        {requirementBanner}
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-success-light border border-success mb-4">
          <ShieldCheck size={18} className="text-success shrink-0" />
          <div>
            <p className="text-sm font-medium text-success">{t('settings.tfa_on')}</p>
            <p className="text-xs text-success/80">{t('settings.tfa_on_desc')}</p>
          </div>
        </div>

        <div className="mb-6">
          <BackupCodesSection />
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
      <h3 className="text-sm font-medium text-text-primary mb-3">{t('settings.tfa_title')}</h3>
      {requirementBanner}
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
