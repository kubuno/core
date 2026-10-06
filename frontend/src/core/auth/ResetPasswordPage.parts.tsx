/**
 * The parts of `ResetPasswordPage.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import { Input } from "@ui"
import type { ResetPasswordPage } from './ResetPasswordPage'

export function Part1({ t, showPassword, form, setForm }: { t: NonNullable<ResetPasswordPage['tr']>; showPassword: NonNullable<ResetPasswordPage['showPassword']>; form: NonNullable<ResetPasswordPage['form']>; setForm: NonNullable<ResetPasswordPage['setForm']> }) {
  return (
    <Input
                      label={t('resetpw.password')}
                      type={showPassword ? 'text' : 'password'}
                      value={form.next}
                      onChange={(e) => setForm((f) => ({ ...f, next: e.target.value }))}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      className="pr-10"
                      placeholder="••••••••"
                      autoFocus
                    />
  )
}

export function Part2({ i, strength }: { i: NonNullable<ResetPasswordPage['rows_items']>[number]['i']; strength: NonNullable<ResetPasswordPage['strength']> }) {
  return (
    <div
                              key={i}
                              className="h-1 flex-1 rounded-full transition-all"
                              style={{ background: i < strength.score ? strength.color : 'var(--color-surface-3)' }}
                            />
  )
}

export function Part3({ strength, t }: { strength: NonNullable<ResetPasswordPage['strength']>; t: NonNullable<ResetPasswordPage['tr']> }) {
  return (
    <span className="text-xs" style={{ color: strength.color }}>{t(strength.key)}</span>
  )
}
