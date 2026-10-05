/**
 * The parts of `RequirePasswordChangeCard.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import { ShieldAlert } from "lucide-react"
import { Callout, Card, Toggle } from "@ui"
import { formatWhen } from "../format"
import type { RequirePasswordChangeCard } from './RequirePasswordChangeCard'

export function Part1({ t, required, external, setRequired, onToggle, user, i18n }: { t: NonNullable<RequirePasswordChangeCard['tr']>; required: NonNullable<RequirePasswordChangeCard['required']>; external: NonNullable<RequirePasswordChangeCard['external']>; setRequired: NonNullable<RequirePasswordChangeCard['setRequired']>; onToggle: RequirePasswordChangeCard['onToggle']; user: NonNullable<RequirePasswordChangeCard['props']['user']>; i18n: NonNullable<RequirePasswordChangeCard['i18n']> }) {
  return (
    <Card
            title={t('admin.ud_rpc_title', { defaultValue: 'Changement imposé' })}
            icon={<ShieldAlert className="w-4 h-4" />}
          >
            <Toggle
              label={t('admin.ud_rpc_label', {
                defaultValue: 'Demander un nouveau mot de passe à la prochaine connexion',
              })}
              description={t('admin.ud_rpc_desc', {
                defaultValue:
                  "Le mot de passe actuel reste valable pour cette connexion-là ; toute écriture est refusée tant qu'il n'a pas été changé.",
              })}
              checked={required}
              disabled={external || setRequired.isPending}
              onChange={(e) => void onToggle(e.currentTarget.checked)}
            />
    
            {external && (
              <Callout t={t} variant="info" className="mt-3">
                {t('admin.ud_rpc_external', {
                  defaultValue:
                    "Ce compte n'a pas de mot de passe local : son authentification est gouvernée par un fournisseur d'identité ou un annuaire.",
                })}
              </Callout>
            )}
    
            {!external && (
              <p className="mt-3 text-sm text-text-secondary">
                {user.password_changed_at
                  ? t('admin.ud_pw_changed_at', {
                      defaultValue: 'Mot de passe choisi le {{when}}.',
                      when: formatWhen(user.password_changed_at, i18n.language),
                    })
                  : t('admin.ud_pw_changed_unknown', {
                      defaultValue: 'Date du dernier changement de mot de passe inconnue.',
                    })}
              </p>
            )}
          </Card>
  )
}
