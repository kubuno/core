import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Combobox, EmptyState, Stepper, useStepper, type StepDef } from '@ui'
import { CloudOff, FolderPlus, Inbox, SearchX, ServerCrash } from 'lucide-react'
import { DEMO_UNITS } from './fixtures'

/**
 * Combobox — selection in a long list, with the diacritic-insensitive filter.
 * The hint states the test explicitly: `unites` and `Unités` must both surface
 * « Unités & mesures ».
 */
export function ComboboxDemo() {
  const { t } = useTranslation()
  const [unit, setUnit] = useState<string | null>('idf')
  const [free, setFree] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-3">
      <p className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
        {t('admin.t_prev_cb_hint', {
          defaultValue: 'Recherche insensible aux accents : « unites » trouve « Unités & mesures », et inversement.',
        })}
      </p>
      <div className="flex flex-wrap items-start gap-4">
        <div className="w-64">
          <label className="mb-1 block text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
            {t('admin.t_prev_cb_unit', { defaultValue: 'Unité d’organisation' })}
          </label>
          <Combobox
            t={t}
            value={unit}
            onChange={setUnit}
            options={DEMO_UNITS}
            clearable
            onClear={() => setUnit(null)}
            placeholder={t('admin.t_prev_cb_ph', { defaultValue: 'Choisir une unité…' })}
          />
        </div>
        <div className="w-64">
          <label className="mb-1 block text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
            {t('admin.t_prev_cb_empty', { defaultValue: 'Aucune sélection' })}
          </label>
          <Combobox
            t={t}
            value={free}
            onChange={setFree}
            options={DEMO_UNITS.map(u => ({ ...u, group: undefined }))}
            placeholder={t('admin.t_prev_cb_ph2', { defaultValue: 'Sans groupes ni description' })}
          />
        </div>
      </div>
    </div>
  )
}

/** Stepper driven by `useStepper`, including a step flagged in error. */
export function StepperDemo() {
  const { t } = useTranslation()
  const steps: StepDef[] = [
    { id: 'source',  label: t('admin.t_prev_st_1', { defaultValue: 'Source' }),   description: t('admin.t_prev_st_1d', { defaultValue: 'Annuaire ou CSV' }) },
    { id: 'mapping', label: t('admin.t_prev_st_2', { defaultValue: 'Champs' }),   description: t('admin.t_prev_st_2d', { defaultValue: 'Correspondances' }) },
    { id: 'rules',   label: t('admin.t_prev_st_3', { defaultValue: 'Règles' }),   optional: true },
    { id: 'review',  label: t('admin.t_prev_st_4', { defaultValue: 'Vérification' }) },
    { id: 'run',     label: t('admin.t_prev_st_5', { defaultValue: 'Import' }) },
  ]
  const wizard = useStepper(steps)
  const [failing, setFailing] = useState(false)

  const resolved = wizard.resolved.map(s =>
    failing && s.id === 'mapping' ? { ...s, status: 'error' as const } : s)

  return (
    <div className="flex flex-col gap-3">
      <Stepper t={t} steps={resolved} current={wizard.id} onStepChange={wizard.goTo}>
        <div className="rounded-lg border border-border bg-surface-1 p-4 text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>
          {t('admin.t_prev_st_panel', { defaultValue: 'Contenu de l’étape' })} « {steps[wizard.index].label} »
        </div>
      </Stepper>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="secondary" disabled={wizard.isFirst} onClick={wizard.prev}>
          {t('common.back', { defaultValue: 'Retour' })}
        </Button>
        <Button size="sm" variant="primary" disabled={wizard.isLast} onClick={wizard.next}>
          {t('admin.t_prev_st_next', { defaultValue: 'Suivant' })}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setFailing(f => !f)}>
          {failing
            ? t('admin.t_prev_st_fix', { defaultValue: 'Corriger l’étape « Champs »' })
            : t('admin.t_prev_st_break', { defaultValue: 'Mettre « Champs » en erreur' })}
        </Button>
      </div>
      <Stepper t={t} steps={resolved} current={wizard.id} orientation="vertical" onStepChange={wizard.goTo} className="max-w-xs" />
    </div>
  )
}

/**
 * The four empty states side by side — the point being that they are NOT
 * interchangeable. Note that the filtered one offers to clear the filters and
 * never a creation.
 */
export function EmptyStatesDemo() {
  const { t } = useTranslation()
  const box = 'rounded-xl border border-border bg-surface-0'
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className={box}>
        <EmptyState
          t={t}
          variant="first-use"
          icon={<Inbox size={24} />}
          title={t('admin.t_prev_es_first_t', { defaultValue: 'Aucune unité pour l’instant' })}
          description={t('admin.t_prev_es_first_d', { defaultValue: 'Créez une première unité pour organiser vos comptes.' })}
          action={{ label: t('admin.t_prev_es_first_a', { defaultValue: 'Nouvelle unité' }), onClick: () => {}, icon: <FolderPlus size={14} /> }}
          docHref="https://kubuno.com"
          compact
        />
      </div>
      <div className={box}>
        <EmptyState
          t={t}
          variant="no-results"
          icon={<SearchX size={24} />}
          title={t('admin.t_prev_es_nores_t', { defaultValue: 'Aucun résultat' })}
          description={t('admin.t_prev_es_nores_d', { defaultValue: 'Aucune unité ne correspond aux filtres actifs.' })}
          action={{ label: t('admin.t_prev_es_nores_a', { defaultValue: 'Effacer les filtres' }), onClick: () => {} }}
          compact
        />
      </div>
      <div className={box}>
        <EmptyState
          t={t}
          variant="error"
          icon={<ServerCrash size={24} />}
          title={t('admin.t_prev_es_err_t', { defaultValue: 'Chargement impossible' })}
          description={t('admin.t_prev_es_err_d', { defaultValue: 'Le service d’annuaire n’a pas répondu (504).' })}
          action={{ label: t('ui.retry', { defaultValue: 'Réessayer' }), onClick: () => {} }}
          compact
        />
      </div>
      <div className={box}>
        <EmptyState
          t={t}
          variant="unavailable"
          icon={<CloudOff size={24} />}
          title={t('admin.t_prev_es_unav_t', { defaultValue: 'Module non installé' })}
          description={t('admin.t_prev_es_unav_d', { defaultValue: 'Installez le module Annuaire pour gérer les unités ici.' })}
          docHref="https://kubuno.com"
          compact
        />
      </div>
    </div>
  )
}
