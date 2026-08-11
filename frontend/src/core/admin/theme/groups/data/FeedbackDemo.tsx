import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Callout, ProgressBar, ToastProvider, useToast } from '@ui'
import { AlertCircle, Bell, CheckCircle2, Undo2 } from 'lucide-react'
import { PreviewStage } from '../../PreviewDemos'

/** Callouts (inline) + progress bars, including the colour thresholds. */
export function CalloutsAndProgress() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Callout t={t} variant="info" title={t('admin.t_prev_co_info_t', { defaultValue: 'Synchronisation planifiée' })}>
          {t('admin.t_prev_co_info', { defaultValue: 'Les comptes seront rapprochés de l’annuaire cette nuit à 02 h 00.' })}
        </Callout>
        <Callout t={t} variant="success" dismissible>
          {t('admin.t_prev_co_ok', { defaultValue: 'Le fournisseur d’identité a été enregistré.' })}
        </Callout>
        <Callout
          t={t}
          variant="warning"
          title={t('admin.t_prev_co_warn_t', { defaultValue: 'Quota bientôt atteint' })}
          action={{ label: t('admin.t_prev_co_warn_a', { defaultValue: 'Augmenter le quota' }), onClick: () => {} }}
        >
          {t('admin.t_prev_co_warn', { defaultValue: 'Trois unités dépassent 90 % de leur espace alloué.' })}
        </Callout>
        <Callout
          t={t}
          variant="danger"
          title={t('admin.t_prev_co_err_t', { defaultValue: 'Sauvegarde en échec' })}
          action={{ label: t('ui.retry', { defaultValue: 'Réessayer' }), onClick: () => {} }}
          dismissible
        >
          {t('admin.t_prev_co_err', { defaultValue: 'La dernière sauvegarde a échoué il y a 2 jours (code 507).' })}
        </Callout>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <ProgressBar t={t} value={38} label={t('admin.t_prev_pb_ok', { defaultValue: 'Sous le seuil (38 %)' })} showValue />
        <ProgressBar t={t} value={80} label={t('admin.t_prev_pb_warn', { defaultValue: 'Avertissement à 75 % (80 %)' })} showValue />
        <ProgressBar t={t} value={95} label={t('admin.t_prev_pb_dang', { defaultValue: 'Danger à 90 % (95 %)' })} showValue />
        <ProgressBar t={t} value={95} variant="primary" label={t('admin.t_prev_pb_pin', { defaultValue: 'Couleur figée (téléchargement)' })} showValue />
        <ProgressBar t={t} value={0} indeterminate label={t('admin.t_prev_pb_ind', { defaultValue: 'Progression inconnue' })} />
        <ProgressBar t={t} size="sm" value={62} max={100} label={t('admin.t_prev_pb_sm', { defaultValue: 'Compacte' })} showValue />
      </div>
    </div>
  )
}

/** Buttons that fire toasts — confined to a bounded stage. */
function ToastButtons() {
  const { t } = useTranslation()
  const toast = useToast()
  const [count, setCount] = useState(0)

  return (
    <div className="flex flex-wrap items-start gap-2 p-3">
      <Button size="sm" variant="secondary" icon={<CheckCircle2 size={14} />}
              onClick={() => toast.success(t('admin.t_prev_to_ok', { defaultValue: 'Paramètres enregistrés.' }))}>
        {t('admin.t_prev_to_b_ok', { defaultValue: 'Succès' })}
      </Button>
      <Button size="sm" variant="secondary" icon={<Bell size={14} />}
              onClick={() => toast.info(t('admin.t_prev_to_info', { defaultValue: 'Import lancé en arrière-plan.' }))}>
        {t('admin.t_prev_to_b_info', { defaultValue: 'Info' })}
      </Button>
      <Button size="sm" variant="secondary" icon={<AlertCircle size={14} />}
              onClick={() => toast.error(
                t('admin.t_prev_to_err', { defaultValue: 'Impossible de contacter le module.' }),
                { title: t('admin.t_prev_to_err_t', { defaultValue: 'Échec' }) },
              )}>
        {t('admin.t_prev_to_b_err', { defaultValue: 'Erreur' })}
      </Button>
      <Button size="sm" variant="secondary" icon={<Undo2 size={14} />}
              onClick={() => {
                const n = count + 1
                setCount(n)
                toast.toast({
                  message: t('admin.t_prev_to_undo', { defaultValue: 'Élément supprimé.' }),
                  action: { label: t('admin.t_prev_to_undo_a', { defaultValue: 'Annuler' }), onClick: () => {} },
                  duration: 8000,
                })
              }}>
        {t('admin.t_prev_to_b_undo', { defaultValue: 'Avec action' })} {count > 0 && `(${count})`}
      </Button>
      <Button size="sm" variant="ghost" onClick={() => toast.dismissAll()}>
        {t('admin.t_prev_to_b_clear', { defaultValue: 'Tout fermer' })}
      </Button>
    </div>
  )
}

/** Transient notifications, stacked inside their own bounded stage. */
export function ToastsDemo() {
  const { t } = useTranslation()
  return (
    <PreviewStage title={t('admin.t_prev_toasts', { defaultValue: 'Notifications transitoires' })} width={420} height={300}>
      {/* One provider per stage: the toasts portal into the stage (PortalHostContext)
          instead of <body>, so they stay inside the preview. */}
      <ToastProvider t={t}>
        <ToastButtons />
      </ToastProvider>
    </PreviewStage>
  )
}
