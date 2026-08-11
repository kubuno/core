import { useTranslation } from 'react-i18next'
import TableDemo from './data/TableDemo'
import { CalloutsAndProgress, ToastsDemo } from './data/FeedbackDemo'
import { ComboboxDemo, EmptyStatesDemo, StepperDemo } from './data/SelectionDemo'

/** One labelled sub-block of the group. */
function Block({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h4 className="font-medium text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>{title}</h4>
      {hint && <p className="-mt-1 text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>{hint}</p>}
      {children}
    </section>
  )
}

/**
 * Gallery group for the admin/data primitives: Card, DataTable, EmptyState,
 * Callout, ProgressBar, Combobox, Stepper and Toast.
 *
 * It doubles as their visual test bench: every component is here in each of its
 * meaningful states, so switching the previewed theme (or the device width above
 * the gallery) immediately shows whether a token was hard-coded somewhere.
 */
export default function DataGroup() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-6">
      <Block
        title={t('admin.t_prev_g_table', { defaultValue: 'Table de données & carte' })}
        hint={t('admin.t_prev_g_table_h', {
          defaultValue: 'Tri par colonne, pagination, sélection multiple, colonnes configurables. La table défile horizontalement dans son propre cadre ; en dessous de 700 px de large, les lignes deviennent des cartes.',
        })}
      >
        <TableDemo />
      </Block>

      <Block title={t('admin.t_prev_g_empty', { defaultValue: 'États vides — quatre situations distinctes' })}
             hint={t('admin.t_prev_g_empty_h', {
               defaultValue: 'Premier usage (invite à créer) · résultat filtré vide (efface les filtres, jamais de création) · erreur (réessayer) · indisponible (documentation).',
             })}>
        <EmptyStatesDemo />
      </Block>

      <Block title={t('admin.t_prev_g_feedback', { defaultValue: 'Encadrés & progression' })}>
        <CalloutsAndProgress />
      </Block>

      <Block title={t('admin.t_prev_g_toast', { defaultValue: 'Notifications' })}>
        <ToastsDemo />
      </Block>

      <Block title={t('admin.t_prev_g_combobox', { defaultValue: 'Sélection dans une longue liste' })}>
        <ComboboxDemo />
      </Block>

      <Block title={t('admin.t_prev_g_stepper', { defaultValue: 'Assistant multi-étapes' })}>
        <StepperDemo />
      </Block>
    </div>
  )
}
