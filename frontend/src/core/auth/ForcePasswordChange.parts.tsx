/**
 * The parts of `ForcePasswordChange.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import { Input } from "@ui"
import type { ForcePasswordChange } from './ForcePasswordChange'

export function Part1({ t, form, setForm }: { t: NonNullable<ForcePasswordChange['tr']>; form: NonNullable<ForcePasswordChange['form']>; setForm: NonNullable<ForcePasswordChange['setForm']> }) {
  return (
    <Input
                label={t('forcepw.current')}
                type="password"
                value={form.current}
                onChange={(e) => setForm((f) => ({ ...f, current: e.target.value }))}
                required
                autoComplete="current-password"
                autoFocus
                placeholder="••••••••"
              />
  )
}

export function Part2({ t, showPassword, form, setForm }: { t: NonNullable<ForcePasswordChange['tr']>; showPassword: NonNullable<ForcePasswordChange['showPassword']>; form: NonNullable<ForcePasswordChange['form']>; setForm: NonNullable<ForcePasswordChange['setForm']> }) {
  return (
    <Input
                  label={t('forcepw.new')}
                  type={showPassword ? 'text' : 'password'}
                  value={form.next}
                  onChange={(e) => setForm((f) => ({ ...f, next: e.target.value }))}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="pr-10"
                  placeholder="••••••••"
                />
  )
}

export function Part3({ i, strength }: { i: NonNullable<ForcePasswordChange['rows_items']>[number]['i']; strength: NonNullable<ForcePasswordChange['strength']> }) {
  return (
    <div
                          key={i}
                          className="h-1 flex-1 rounded-full transition-all"
                          style={{ background: i < strength.score ? strength.color : '#e8eaed' }}
                        />
  )
}

export function Part4({ strength, t }: { strength: NonNullable<ForcePasswordChange['strength']>; t: NonNullable<ForcePasswordChange['tr']> }) {
  return (
    <span className="text-xs" style={{ color: strength.color }}>{t(strength.key)}</span>
  )
}
