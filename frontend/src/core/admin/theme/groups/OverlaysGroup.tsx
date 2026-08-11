import { useTranslation } from 'react-i18next'
import { ConfirmDialog, ConflictDialog, FloatingWindow } from '@ui'
import { AnchoredDemo, PreviewStage, noop } from '../PreviewDemos'

/** Floating window, dialogs and anchored menu — each confined to its own stage. */
export default function OverlaysGroup() {
  const { t } = useTranslation()
  return (
    <>
      <p className="text-[11px] text-text-tertiary mb-2.5 -mt-1">
        {t('admin.t_prev_overlays_hint', {
          defaultValue: 'Confinés à une zone bornée dont ils ne peuvent sortir ; fermeture désactivée pour l’aperçu.',
        })}
      </p>
      <div className="flex flex-wrap items-start gap-4">
        <PreviewStage title={t('admin.t_prev_window', { defaultValue: 'Fenêtre flottante' })} width={360} height={280}>
          <FloatingWindow title="Fenêtre flottante" onClose={noop} defaultWidth={260} minWidth={200} minHeight={120}>
            <div className="p-4 text-sm text-text-secondary">{t('admin.t_prev_window_body', { defaultValue: 'Contenu de la fenêtre.' })}</div>
          </FloatingWindow>
        </PreviewStage>
        <PreviewStage title={t('admin.t_prev_confirm', { defaultValue: 'Boîte de confirmation' })} width={480} height={360}>
          <ConfirmDialog
            title={t('admin.t_prev_confirm_title', { defaultValue: 'Supprimer l’élément ?' })}
            message={t('admin.t_prev_confirm_msg', { defaultValue: 'Cette action est définitive et ne peut pas être annulée.' })}
            variant="danger"
            confirmLabel={t('common.delete', { defaultValue: 'Supprimer' })}
            onConfirm={noop}
            onCancel={noop}
          />
        </PreviewStage>
        <PreviewStage title={t('admin.t_prev_conflict', { defaultValue: 'Conflit de nom' })} width={500} height={440}>
          <ConflictDialog type="file" name="rapport.pdf" onChoice={noop} />
        </PreviewStage>
        <PreviewStage title={t('admin.t_prev_anchored', { defaultValue: 'Menu ancré' })} width={240} height={220}>
          <AnchoredDemo />
        </PreviewStage>
      </div>
    </>
  )
}
