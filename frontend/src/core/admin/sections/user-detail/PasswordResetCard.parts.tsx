/**
 * The parts of `PasswordResetCard.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import { KeyRound } from "lucide-react"
import { Button, Card } from "@ui"
import type { PasswordResetCard } from './PasswordResetCard'

export function Part1({ t, setOpen }: { t: NonNullable<PasswordResetCard['tr']>; setOpen: NonNullable<PasswordResetCard['setOpen']> }) {
  return (
    <Card
            title={t('admin.ud_pw_title', { defaultValue: 'Mot de passe' })}
            icon={<KeyRound className="w-4 h-4" />}
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <p className="text-sm text-text-secondary max-w-prose">
                {t('admin.ud_pw_hint', {
                  defaultValue:
                    "Définit un nouveau mot de passe et ferme toutes les sessions ouvertes de ce compte.",
                })}
              </p>
              <Button variant="secondary" onClick={() => setOpen(true)}>
                {t('pwreset.open', { defaultValue: 'Réinitialiser le mot de passe' })}
              </Button>
            </div>
          </Card>
  )
}
