/**
 * The parts of `ReauthDialog.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import { Input } from "@ui"
import type { ReauthDialog } from './ReauthDialog'

export function Part1({ inputRef, usesCode, t, value, setValue }: { inputRef: NonNullable<ReauthDialog['inputRef']>; usesCode: NonNullable<ReauthDialog['usesCode']>; t: NonNullable<ReauthDialog['tr']>; value: NonNullable<ReauthDialog['value']>; setValue: NonNullable<ReauthDialog['setValue']> }) {
  return (
    <Input
                ref={inputRef}
                type={usesCode ? 'text' : 'password'}
                label={usesCode ? t('reauth.code_label') : t('reauth.password_label')}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                autoComplete={usesCode ? 'one-time-code' : 'current-password'}
                placeholder={usesCode ? t('reauth.code_ph') : undefined}
              />
  )
}
