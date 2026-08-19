import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ShieldOff } from 'lucide-react'
import { Button, Callout, Spinner, Stepper, useStepper, useToast, type StepDef } from '@ui'
import ServicePicker from './ServicePicker'
import ArchiveOptions from './ArchiveOptions'
import RequestStatus from './RequestStatus'
import { errorMessage, useMyExport, useRequestMyExport } from './api'

/**
 * "Download my data" — the account settings section.
 *
 * ## Three steps, and the third one is where a returning visitor lands
 *
 *   1. **Choose** what to include. Everything the instance can produce is
 *      pre-selected; unticking is the gesture, not ticking.
 *   2. **Customise** the archive.
 *   3. **Follow and download.** A request lives for days: somebody who asked
 *      yesterday comes back for step 3 and must not walk through the first two
 *      to reach it — so the section opens there whenever there is something to
 *      show.
 *
 * ## This component is only ever mounted where the feature exists
 *
 * `data_export.self_service` is resolved per account by the server and gates the
 * nav entry (`settings/navigation.tsx`) as well as all three routes, which
 * answer 404 where it is off. The guard below is the belt to that braces: a
 * hand-typed `?tab=my-data` must not paint a page whose every request will be
 * refused.
 */
export function MyDataTab() {
  const { t, i18n } = useTranslation()
  const toast = useToast()
  const { data, isLoading, isError, error } = useMyExport()
  const request = useRequestMyExport()

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [maxFileMb, setMaxFileMb] = useState<number | null>(null)

  const steps: StepDef[] = useMemo(() => [
    { id: 'services', label: t('settings.mde_step_pick',     { defaultValue: 'Choisir les données' }) },
    { id: 'options',  label: t('settings.mde_step_options',  { defaultValue: 'Personnaliser' }) },
    { id: 'download', label: t('settings.mde_step_download', { defaultValue: 'Télécharger' }) },
  ], [t])

  const stepper = useStepper(steps, 'services')
  const { goTo } = stepper

  // Everything the instance can produce, pre-selected — the page opens on
  // "everything of yours", and the person removes what they do not want.
  useEffect(() => {
    if (!data) return
    setSelected(prev => (prev.size > 0 ? prev : new Set(data.services.map(s => s.id))))
    setMaxFileMb(prev => prev ?? data.policy.max_file_mb)
  }, [data])

  // A request already in flight, or an archive still downloadable, IS the state
  // of this page: land on it rather than on a form the person already filled in.
  const hasSomething = !!data?.active || !!data?.history.some(r => r.status === 'ready' && r.downloadable)

  // ONCE, when the first answer arrives. Re-running it would drag the person
  // back to step 3 every time the poll refreshes — which is exactly what
  // happens if the landing rule is expressed as a condition rather than as an
  // event, and it makes the first two steps unreachable.
  const landed = useRef(false)
  useEffect(() => {
    if (landed.current || !data) return
    landed.current = true
    if (hasSomething) goTo('download')
  }, [data, hasSomething, goTo])

  if (isLoading) {
    return <div className="py-10 flex justify-center"><Spinner /></div>
  }

  // A 404 here means the feature was switched off for this account while the
  // page was open. Said plainly, once, instead of a form that cannot submit.
  if (isError || !data) {
    return (
      <Callout variant="info" icon={<ShieldOff size={18} />}>
        {errorMessage(
          error,
          t('settings.mde_off', {
            defaultValue:
              'L’export de vos données n’est pas disponible sur cette instance.',
          }),
        )}
      </Callout>
    )
  }

  const submit = () => {
    request.mutate(
      {
        services: [...selected],
        max_file_mb: maxFileMb ?? data.policy.max_file_mb,
      },
      {
        onSuccess: () => {
          goTo('download')
          toast.success(t('settings.mde_requested_ok', {
            defaultValue: 'Demande enregistrée. La préparation commence.',
          }))
        },
        onError: (err) => {
          toast.error(errorMessage(err, t('settings.mde_requested_ko', {
            defaultValue: 'La demande n’a pas pu être enregistrée.',
          })))
        },
      },
    )
  }

  const startOver = () => goTo('services')

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-text-primary font-medium" style={{ fontSize: 'var(--kb-text-heading)' }}>
          {t('settings.mde_title', { defaultValue: 'Télécharger mes données' })}
        </h2>
        <p className="mt-1 text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>
          {t('settings.mde_intro', {
            defaultValue:
              'Récupérez une copie de ce que cette instance détient à votre sujet, dans des formats ouverts. L’archive ne contient aucun mot de passe, aucun jeton et aucun secret : elle permet de lire vos données, jamais de se connecter.',
          })}
        </p>
      </div>

      <Stepper
        steps={stepper.resolved}
        current={stepper.id}
        onStepChange={(id) => goTo(id)}
        allowForward={hasSomething}
      >
        {stepper.id === 'services' && (
          <ServicePicker
            services={data.services}
            selected={selected}
            onChange={setSelected}
          />
        )}

        {stepper.id === 'options' && (
          <ArchiveOptions
            policy={data.policy}
            format={data.format}
            maxFileMb={maxFileMb ?? data.policy.max_file_mb}
            onMaxFileMb={setMaxFileMb}
          />
        )}

        {stepper.id === 'download' && (
          <RequestStatus data={data} locale={i18n.language} onRestart={startOver} />
        )}
      </Stepper>

      {/* The two navigation buttons live outside the step content: the wizard's
          shape must not change from one step to the next. */}
      {stepper.id !== 'download' && (
        <div className="flex flex-wrap items-center gap-2">
          {stepper.id === 'options' && (
            <Button variant="secondary" onClick={stepper.prev}>
              {t('settings.mde_back', { defaultValue: 'Retour' })}
            </Button>
          )}
          {stepper.id === 'services' ? (
            <Button onClick={stepper.next}>
              {t('settings.mde_continue', { defaultValue: 'Continuer' })}
            </Button>
          ) : (
            <Button
              onClick={submit}
              loading={request.isPending}
              disabled={!!data.active}
            >
              {t('settings.mde_submit', { defaultValue: 'Demander mon archive' })}
            </Button>
          )}
          {!!data.active && stepper.id === 'options' && (
            <span className="text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
              {t('settings.mde_one_at_a_time', {
                defaultValue: 'Une demande est déjà en cours.',
              })}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default MyDataTab
