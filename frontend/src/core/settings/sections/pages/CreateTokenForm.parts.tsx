/**
 * The parts of `CreateTokenForm.kbcontrol` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import { Input } from "@ui"
import type { CreateTokenForm } from './CreateTokenForm'

export function Part1({ t, expiresInDays, setExpiresInDays, expiryMandatory, maxTtlDays }: { t: NonNullable<CreateTokenForm['tr']>; expiresInDays: NonNullable<CreateTokenForm['expiresInDays']>; setExpiresInDays: NonNullable<CreateTokenForm['setExpiresInDays']>; expiryMandatory: NonNullable<CreateTokenForm['expiryMandatory']>; maxTtlDays: NonNullable<CreateTokenForm['maxTtlDays']> }) {
  return (
    <Input
                  label={t('settings.tok_expires')}
                  type="number"
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(e.target.value)}
                  placeholder={
                    expiryMandatory
                      ? t('settings.tok_max_ttl', { days: maxTtlDays })
                      : t('settings.tok_no_expiration')
                  }
                  min={1}
                  max={maxTtlDays}
                />
  )
}
