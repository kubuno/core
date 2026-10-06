/**
 * The parts of `LoginPage.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import { Link } from "react-router-dom"
import { RefreshCw } from "lucide-react"
import type { LoginPage } from './LoginPage'

export function Part1({ useBackupCode, totpCode, setTotpCode, t }: { useBackupCode: NonNullable<LoginPage['useBackupCode']>; totpCode: NonNullable<LoginPage['totpCode']>; setTotpCode: NonNullable<LoginPage['setTotpCode']>; t: NonNullable<LoginPage['tr']> }) {
  return (
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
  )
}

export function Part2({ t }: { t: NonNullable<LoginPage['tr']> }) {
  return (
    <Link to="/login" className="text-sm font-medium hover:underline" style={{ color: '#1a73e8' }}>
                          {t('forgot.back')}
                        </Link>
  )
}

export function Part3({ t }: { t: NonNullable<LoginPage['tr']> }) {
  return (
    <Link to="/login" className="text-sm font-medium hover:underline" style={{ color: '#1a73e8' }}>
                          {t('forgot.back')}
                        </Link>
  )
}

export function Part4({ p, t }: { p: NonNullable<LoginPage['rows_oauth_providers']>[number]['p']; t: NonNullable<LoginPage['tr']> }) {
  return (
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
  )
}

export function Part5({ t }: { t: NonNullable<LoginPage['tr']> }) {
  return (
    <Link
                      to="/forgot-password"
                      className="text-sm font-medium hover:underline"
                      style={{ color: '#1a73e8' }}
                    >
                      {t('login.forgot')}
                    </Link>
  )
}

export function Part6({ captchaLoading }: { captchaLoading: NonNullable<LoginPage['captchaLoading']> }) {
  return (
    <RefreshCw size={16} className={captchaLoading ? 'animate-spin' : ''} />
  )
}

export function Part7({ captcha, t }: { captcha: NonNullable<LoginPage['captcha']>; t: NonNullable<LoginPage['tr']> }) {
  return (
    <img
                          src={captcha.image}
                          alt={t('login.captcha_label')}
                          width={180}
                          height={60}
                          className="rounded-md mb-2 block"
                          style={{ border: '1px solid #dadce0', background: '#f1f3f4' }}
                        />
  )
}

export function Part8({ captchaAnswer, setCaptchaAnswer, t }: { captchaAnswer: NonNullable<LoginPage['captchaAnswer']>; setCaptchaAnswer: NonNullable<LoginPage['setCaptchaAnswer']>; t: NonNullable<LoginPage['tr']> }) {
  return (
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
  )
}

export function Part9({ captcha, captchaAnswer, setCaptchaAnswer }: { captcha: NonNullable<LoginPage['captcha']>; captchaAnswer: NonNullable<LoginPage['captchaAnswer']>; setCaptchaAnswer: NonNullable<LoginPage['setCaptchaAnswer']> }) {
  return (
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
  )
}

export function Part10({ captcha, sliderX }: { captcha: NonNullable<LoginPage['captcha']>; sliderX: NonNullable<LoginPage['sliderX']> }) {
  return (
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
  )
}

export function Part11({ captcha, sliderX, setSliderX, t }: { captcha: NonNullable<LoginPage['captcha']>; sliderX: NonNullable<LoginPage['sliderX']>; setSliderX: NonNullable<LoginPage['setSliderX']>; t: NonNullable<LoginPage['tr']> }) {
  return (
    <input
                          type="range"
                          min={0}
                          max={captcha.max_x ?? 200}
                          value={sliderX}
                          onChange={(e) => setSliderX(Number(e.target.value))}
                          aria-label={t('login.captcha_slider_label')}
                          className="w-full mt-3 accent-[#1a73e8]"
                        />
  )
}

export function Part12({ t }: { t: NonNullable<LoginPage['tr']> }) {
  return (
    <Link
                      to="/register"
                      className="text-sm font-medium hover:underline"
                      style={{ color: '#1a73e8' }}
                    >
                      {t('login.register')}
                    </Link>
  )
}
