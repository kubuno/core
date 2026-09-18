import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, RefreshCw, ShieldCheck } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import axios from 'axios'
import { useAuthStore } from '../store/authStore'
import { authApi, type CaptchaChallenge } from '../api/auth'
import { Button, OutlinedField } from '@ui'
// Membranes WebGL (dégradés par pixel, fallback canvas 2D intégré).
// Rollback : ré-importer './LoginAnimation' (style fils d'origine).
import LoginAnimation from './LoginAnimationGL'
import { animTuning, parseAnimParams } from './animTuning'
import { InstanceLogo } from '../shell/InstanceLogo'
import { getPublicConfig } from '../api/publicConfig'

/** The sign-in page paints itself in this blue whatever the instance theme is. */
const PRIMARY = '#1a73e8'

function usePublicConfig() {
  return useQuery({
    queryKey: ['public-config'],
    queryFn: getPublicConfig,
    staleTime: 60_000,
  })
}

function useRegistrationOpen(): boolean {
  const { data } = usePublicConfig()
  const value = data?.['auth.registration_open']
  return value === undefined ? true : Boolean(value)
}

function useDefaultModulePath(): string | null {
  const { data } = usePublicConfig()
  const value = data?.['navigation.default_module']
  return typeof value === 'string' && value.length > 0 ? value : null
}

interface OAuthProviderInfo {
  slug:         string
  display_name: string
  button_color: string | null
}

/**
 * Which sign-in methods the page must draw.
 *
 * A property of the CONFIGURATION alone — the endpoint takes no login and reads
 * no account, so nothing here can be used to find out whether an address exists
 * or which organisational unit it belongs to. The per-unit rule is enforced
 * after identification (see `crate::auth::methods`), and its refusal wears the
 * same "invalid credentials" as every other failure.
 *
 * Failing OPEN is deliberate: if this call does not come back, the password form
 * is shown. A network hiccup must not present an operator with a page that has
 * no way in at all.
 */
function useAuthMethods() {
  return useQuery({
    queryKey: ['auth-methods'],
    queryFn: () =>
      axios
        .get<{ methods: { local: boolean; directory: boolean; sso: boolean }; password_form: boolean }>(
          '/api/v1/auth/methods',
        )
        .then((r) => r.data),
    staleTime: 60_000,
  })
}

function useOAuthProviders() {
  return useQuery({
    queryKey: ['oauth-providers'],
    queryFn: () =>
      axios
        .get<{ providers: OAuthProviderInfo[] }>('/api/v1/auth/providers')
        .then((r) => r.data.providers),
    staleTime: 60_000,
  })
}

export default function LoginPage({ initialStep = 'credentials' }: { initialStep?: 'credentials' | 'forgot' }) {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  // Sign-in CAPTCHA: shown only after the server answers a sign-in with the
  // code CAPTCHA_REQUIRED (too many failures). Cleared on a successful sign-in.
  const [captchaRequired, setCaptchaRequired] = useState(false)
  const [captcha, setCaptcha] = useState<CaptchaChallenge | null>(null)
  const [captchaAnswer, setCaptchaAnswer] = useState('')
  const [sliderX, setSliderX] = useState(0)
  const [captchaLoading, setCaptchaLoading] = useState(false)
  const [step, setStep] = useState<'credentials' | 'totp' | 'forgot'>(initialStep)
  const [totpCode, setTotpCode] = useState('')
  // A lost phone is exactly when the second-factor screen matters, so this screen
  // must be able to take a backup code. The two inputs are mutually exclusive:
  // one is six digits, the other ten letters and digits, and a single field
  // sanitising for both would silently eat characters from whichever it is not.
  const [useBackupCode, setUseBackupCode] = useState(false)
  // Mot de passe oublié — rendu dans le panneau droit du login (au lieu d'une page séparée).
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSubmitted, setForgotSubmitted] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)
  const { login: doLogin, verifyTotp, isLoading } = useAuthStore()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const registrationOpen = useRegistrationOpen()
  const defaultModulePath = useDefaultModulePath()
  const { data: oauthProviders } = useOAuthProviders()
  const { data: authMethods } = useAuthMethods()
  // Undefined = the call has not answered (or failed). Show the form: a page
  // with neither a password field nor a provider button is a dead end.
  const showPasswordForm = authMethods?.password_form ?? true
  const showProviders = (authMethods?.methods.sso ?? true) && (oauthProviders?.length ?? 0) > 0
  const { data: publicConfig } = usePublicConfig()

  // L'animation lit ses paramètres depuis le réglage serveur (console admin,
  // onglet Apparence) exposé dans la config publique.
  useEffect(() => {
    const raw = publicConfig?.['appearance.login_animation']
    if (raw !== undefined) animTuning.set(parseAnimParams(raw))
  }, [publicConfig])
  // Page d'origine si on a été redirigé ici par une déconnexion (même onglet).
  const from = (location.state as { from?: string } | null)?.from
  const postLoginPath = () => from ?? defaultModulePath ?? '/'

  // `/login` et `/forgot-password` rendent le MÊME composant : React ne le remonte
  // pas en naviguant (il ne fait que changer la prop). `useState(initialStep)` ne
  // tenant compte que de la valeur initiale, on synchronise l'étape sur la prop —
  // sinon il fallait F5 pour voir le changement. (L'étape 'totp', programmatique
  // depuis 'credentials', n'est pas affectée car initialStep ne change pas alors.)
  useEffect(() => {
    setStep(initialStep)
    setError('')
    if (initialStep === 'forgot') {
      setForgotSubmitted(false)
      setForgotEmail('')
    }
  }, [initialStep])

  // Fetch a fresh challenge of whatever kind the instance is configured for.
  const loadCaptcha = async () => {
    setCaptchaLoading(true)
    setCaptchaAnswer('')
    setSliderX(0)
    try {
      const { data } = await authApi.getCaptcha()
      setCaptcha(data)
    } catch {
      // Best-effort: the widget stays and the person can retry with the button.
    } finally {
      setCaptchaLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      // The answer is the typed text/number, or — for the slider — the pixel
      // position the piece was dropped at.
      const answer = captcha?.type === 'slider' ? String(sliderX) : captchaAnswer
      const cap = captchaRequired && captcha ? { id: captcha.challenge_id, answer } : undefined
      const { requiresTotp } = await doLogin(login, password, cap)
      if (requiresTotp) {
        setStep('totp')
      } else {
        navigate(postLoginPath())
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code
      const msg = (err as { message?: string })?.message
      // The server demands a CAPTCHA from now on: reveal the field and load a
      // fresh challenge. A spent or wrong challenge comes back here too, so we
      // always refresh — a challenge is single-use.
      if (code === 'CAPTCHA_REQUIRED') {
        setCaptchaRequired(true)
        await loadCaptcha()
      }
      setError(msg ?? 'Identifiants invalides')
    }
  }

  const handleTotpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await verifyTotp(totpCode, useBackupCode ? 'backup' : 'totp')
      navigate(postLoginPath())
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message
      setError(msg ?? 'Code incorrect')
    }
  }

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotLoading(true)
    try {
      await authApi.forgotPassword(forgotEmail)
    } catch {
      // Toujours afficher le succès (pas d'énumération d'email).
    } finally {
      setForgotLoading(false)
      setForgotSubmitted(true)
    }
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Panneau gauche — branding, avec l'animation « Ondes de lumière » en fond */}
      <div
        className="hidden lg:flex lg:w-[45%] flex-col justify-center items-center p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #08174d 0%, #03091a 100%)' }}
      >
        {/* Drapé 3D animé (canvas) — derrière le contenu, décalé vers le bas
            pour dégager la zone du texte. */}
        <LoginAnimation yShift={0.06} />

        <div className="relative text-white text-center max-w-sm z-10">
          <div className="flex items-center justify-center gap-3 mb-10">
            <InstanceLogo size={40} className="text-white" />
            <span className="text-4xl font-light tracking-tight text-white">Kubuno</span>
          </div>
          <h2 className="text-2xl font-normal mb-4 text-white">{t('login.tagline')}</h2>
          <p className="text-blue-100 text-sm leading-relaxed">
            {t('login.subtitle_desc')}
          </p>
        </div>

        {/* Application version, at the foot of the panel. The full build id —
            commit hash, working-tree state — stays in the tooltip rather than on
            screen: this page is public, and the commit is of no use to whoever is
            signing in. It is one hover away for whoever is diagnosing a report. */}
        <span
          className="absolute bottom-4 left-0 right-0 text-center text-xs text-white/45 z-10 select-none"
          title={`Kubuno ${__APP_BUILD__}`}
        >
          Kubuno v{__APP_VERSION__}
        </span>
      </div>

      {/* Panneau droit — formulaire */}
      <div className="w-full lg:w-[55%] flex items-center justify-center p-8">
        <div className="w-full max-w-[400px]">
          {/* Logo mobile */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <InstanceLogo size={26} className="text-primary" />
            <span className="text-2xl font-normal text-text-secondary">Kubuno</span>
          </div>

          {step === 'totp' ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck size={28} className="text-primary shrink-0" />
                <div>
                  <h1 className="text-2xl font-normal" style={{ color: '#202124' }}>{t('login.tfa_title')}</h1>
                  <p className="text-sm mt-1" style={{ color: '#5f6368' }}>
                    {useBackupCode ? t('login.backup_subtitle') : t('login.tfa_subtitle')}
                  </p>
                </div>
              </div>

              <form onSubmit={handleTotpSubmit} className="space-y-5 mt-8">
                <div
                  className="relative flex items-center rounded-md overflow-hidden transition-all"
                  style={{ border: '1px solid #dadce0' }}
                  onFocusCapture={(e) => e.currentTarget.style.borderColor = '#1a73e8'}
                  onBlurCapture={(e) => e.currentTarget.style.borderColor = '#dadce0'}
                >
                  <input
                    type="text"
                    inputMode={useBackupCode ? 'text' : 'numeric'}
                    pattern={useBackupCode ? undefined : '[0-9]{6}'}
                    maxLength={useBackupCode ? 11 : 6}
                    value={totpCode}
                    onChange={(e) => setTotpCode(
                      useBackupCode
                        ? e.target.value.replace(/[^A-Za-z0-9-]/g, '').toUpperCase()
                        : e.target.value.replace(/\D/g, '')
                    )}
                    autoFocus
                    autoComplete="one-time-code"
                    placeholder={useBackupCode ? t('login.backup_ph') : t('settings.tfa_code_ph')}
                    className="w-full px-4 py-3.5 text-sm bg-white outline-none text-text-primary tracking-widest text-center
                               placeholder:text-text-tertiary placeholder:tracking-normal"
                  />
                </div>

                {error && (
                  <div className="text-sm px-4 py-3 rounded-md" style={{ color: '#d93025', background: '#fce8e6', border: '1px solid #f28b82' }}>
                    {error}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => { setUseBackupCode((v) => !v); setTotpCode(''); setError('') }}
                  className="text-sm font-medium hover:underline"
                  style={{ color: '#1a73e8' }}
                >
                  {useBackupCode ? t('login.use_app_code') : t('login.use_backup_code')}
                </button>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => { setStep('credentials'); setTotpCode(''); setUseBackupCode(false); setError('') }}
                    className="text-sm font-medium hover:underline"
                    style={{ color: '#1a73e8' }}
                  >
                    {t('common.back')}
                  </button>
                  <Button
                    type="submit"
                    size="lg"
                    disabled={useBackupCode
                      ? totpCode.replace(/[^A-Za-z0-9]/g, '').length !== 10
                      : totpCode.length !== 6}
                    loading={isLoading}
                    className="ml-auto"
                  >
                    {isLoading ? t('login.verifying') : t('login.verify')}
                  </Button>
                </div>
              </form>
            </>
          ) : step === 'forgot' ? (
            <>
              <h1 className="text-2xl font-normal mb-1.5" style={{ color: '#202124' }}>
                {t('forgot.title')}
              </h1>
              {forgotSubmitted ? (
                <>
                  <div
                    className="text-sm px-4 py-3 rounded-md mt-4"
                    style={{ color: '#1e8e3e', background: '#e6f4ea', border: '1px solid #a8dab5' }}
                  >
                    {t('forgot.sent')}
                  </div>
                  <div className="mt-6">
                    <Link to="/login" className="text-sm font-medium hover:underline" style={{ color: '#1a73e8' }}>
                      {t('forgot.back')}
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm mb-8" style={{ color: '#5f6368' }}>
                    {t('forgot.intro')}
                  </p>
                  <form onSubmit={handleForgotSubmit} className="space-y-5">
                    <OutlinedField
                      label={t('forgot.email_label')}
                      value={forgotEmail}
                      onChange={setForgotEmail}
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      autoFocus
                      primaryColor={PRIMARY}
                    />
                    <Button
                      type="submit"
                      size="lg"
                      loading={forgotLoading}
                      disabled={!forgotEmail.trim()}
                      className="w-full"
                    >
                      {t('forgot.submit')}
                    </Button>
                  </form>
                  <div className="mt-6 text-center">
                    <Link to="/login" className="text-sm font-medium hover:underline" style={{ color: '#1a73e8' }}>
                      {t('forgot.back')}
                    </Link>
                  </div>
                </>
              )}
            </>
          ) : (
          <>
          <h1
            className="text-2xl font-normal mb-1.5"
            style={{ color: '#202124' }}
          >
            {t('login.welcome')}
          </h1>
          <p className="text-sm mb-8" style={{ color: '#5f6368' }}>
            {t('login.subtitle')}
          </p>

          {/* SSO / OIDC providers (Keycloak, GitLab, …) — only when the
              instance actually accepts that method somewhere. A button for a
              method nobody may use is an invitation to an error the person
              cannot diagnose. */}
          {showProviders && (
            <>
              <div className="space-y-2">
                {oauthProviders!.map((p) => (
                  <a
                    key={p.slug}
                    href={`/api/v1/auth/oauth/${p.slug}`}
                    className="flex items-center justify-center gap-3 w-full px-4 py-3 rounded-md
                               border text-sm font-medium transition-colors"
                    style={{ borderColor: p.button_color || '#dadce0', color: '#3c4043', background: '#fff' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f8f9fa' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#fff' }}
                  >
                    {/* Generic SSO shield (accent uses the provider's color when set) */}
                    <svg viewBox="0 0 48 48" width="18" height="18" fill="none">
                      <path d="M24 4L6 12v16c0 9.4 7.6 18.2 18 20 10.4-1.8 18-10.6 18-20V12L24 4z" fill={p.button_color || '#4d9de0'}/>
                      <path d="M16 22h16M24 14v20" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                    {t('login.continue_with', { provider: p.display_name })}
                  </a>
                ))}
              </div>
              {showPasswordForm && (
                <div className="flex items-center gap-3 my-2">
                  <div className="flex-1 h-px" style={{ background: '#dadce0' }} />
                  <span className="text-xs" style={{ color: '#80868b' }}>{t('login.or')}</span>
                  <div className="flex-1 h-px" style={{ background: '#dadce0' }} />
                </div>
              )}
            </>
          )}

          {/* The same two fields serve the local password AND the directory
              bind, so the form is shown when either method is accepted. */}
          {!showPasswordForm && !showProviders && (
            <p className="text-sm px-4 py-3 rounded-md"
               style={{ color: '#d93025', background: '#fce8e6', border: '1px solid #f28b82' }}>
              {t('login.no_method')}
            </p>
          )}

          {showPasswordForm && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <OutlinedField
              label={t('login.email')}
              value={login}
              onChange={setLogin}
              autoComplete="username"
              primaryColor={PRIMARY}
            />

            <div>
              <OutlinedField
                label={t('login.password')}
                value={password}
                onChange={setPassword}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                primaryColor={PRIMARY}
                trailing={
                  // The trailing slot disables pointer events (it exists for a
                  // decorative chevron); a descendant may re-enable them, which
                  // is what keeps this eye clickable without touching the primitive.
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="text-text-tertiary hover:text-text-secondary transition-colors"
                    style={{ pointerEvents: 'auto', display: 'flex' }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />
              <div className="flex justify-end mt-2">
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium hover:underline"
                  style={{ color: '#1a73e8' }}
                >
                  {t('login.forgot')}
                </Link>
              </div>
            </div>

            {captchaRequired && captcha && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-text-secondary">
                    {captcha.type === 'slider'
                      ? t('login.captcha_slider_label')
                      : captcha.type === 'math'
                      ? t('login.captcha_math_label')
                      : t('login.captcha_label')}
                  </label>
                  <button
                    type="button"
                    onClick={loadCaptcha}
                    disabled={captchaLoading}
                    aria-label={t('login.captcha_refresh')}
                    title={t('login.captcha_refresh')}
                    className="w-8 h-8 flex items-center justify-center text-text-tertiary
                               hover:text-text-secondary hover:bg-surface-2 rounded-full transition-colors"
                  >
                    <RefreshCw size={16} className={captchaLoading ? 'animate-spin' : ''} />
                  </button>
                </div>

                {/* ── Distorted text ── */}
                {captcha.type === 'text' && (
                  <>
                    <img
                      src={captcha.image}
                      alt={t('login.captcha_label')}
                      width={180}
                      height={60}
                      className="rounded-md mb-2 block"
                      style={{ border: '1px solid #dadce0', background: '#f1f3f4' }}
                    />
                    <div
                      className="relative flex items-center rounded-md overflow-hidden transition-all"
                      style={{ border: '1px solid #dadce0' }}
                      onFocusCapture={(e) => (e.currentTarget.style.borderColor = '#1a73e8')}
                      onBlurCapture={(e) => (e.currentTarget.style.borderColor = '#dadce0')}
                    >
                      <input
                        type="text"
                        value={captchaAnswer}
                        onChange={(e) => setCaptchaAnswer(e.target.value)}
                        required
                        autoComplete="off"
                        autoCapitalize="characters"
                        spellCheck={false}
                        placeholder={t('login.captcha_ph')}
                        className="w-full px-4 py-3.5 text-sm bg-white outline-none text-text-primary
                                   tracking-[0.3em] uppercase placeholder:text-text-tertiary
                                   placeholder:tracking-normal placeholder:normal-case"
                      />
                    </div>
                  </>
                )}

                {/* ── Arithmetic ── */}
                {captcha.type === 'math' && (
                  <div
                    className="flex items-center gap-3 rounded-md px-4 py-2"
                    style={{ border: '1px solid #dadce0' }}
                    onFocusCapture={(e) => (e.currentTarget.style.borderColor = '#1a73e8')}
                    onBlurCapture={(e) => (e.currentTarget.style.borderColor = '#dadce0')}
                  >
                    <span className="text-lg font-medium text-text-primary select-none whitespace-nowrap">
                      {captcha.prompt} =
                    </span>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={captchaAnswer}
                      onChange={(e) => setCaptchaAnswer(e.target.value)}
                      required
                      autoComplete="off"
                      placeholder="?"
                      className="w-24 py-1.5 text-sm bg-white outline-none text-text-primary
                                 placeholder:text-text-tertiary"
                    />
                  </div>
                )}

                {/* ── Sliding jigsaw ── */}
                {captcha.type === 'slider' && (
                  <div>
                    <div
                      className="relative rounded-md overflow-hidden select-none"
                      style={{ width: captcha.width, height: captcha.height, border: '1px solid #dadce0' }}
                    >
                      <img src={captcha.background} alt="" width={captcha.width} height={captcha.height} draggable={false} />
                      <img
                        src={captcha.piece}
                        alt=""
                        draggable={false}
                        style={{
                          position: 'absolute',
                          top: captcha.piece_y,
                          left: sliderX,
                          width: captcha.piece_width,
                          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))',
                        }}
                      />
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={captcha.max_x ?? 200}
                      value={sliderX}
                      onChange={(e) => setSliderX(Number(e.target.value))}
                      aria-label={t('login.captcha_slider_label')}
                      className="w-full mt-3 accent-[#1a73e8]"
                    />
                    <p className="text-xs text-text-tertiary mt-1">{t('login.captcha_slider_hint')}</p>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div
                className="text-sm px-4 py-3 rounded-md"
                style={{ color: '#d93025', background: '#fce8e6', border: '1px solid #f28b82' }}
              >
                {error}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              {registrationOpen && (
                <Link
                  to="/register"
                  className="text-sm font-medium hover:underline"
                  style={{ color: '#1a73e8' }}
                >
                  {t('login.register')}
                </Link>
              )}
              <Button
                type="submit"
                size="lg"
                loading={isLoading}
                // The fields no longer carry the native `required` attribute, so
                // the button itself guards the empty submit — the same way the
                // two-factor step gates on a complete code.
                disabled={!login.trim() || !password}
                className="ml-auto"
              >
                {isLoading ? t('common.loading') : t('login.submit')}
              </Button>
            </div>
          </form>
          )}
          </>
          )}
        </div>
      </div>
    </div>
  )
}
