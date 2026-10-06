import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { Button, Callout, Card, EmptyState } from '@ui'
import { FloatingWindow } from '@ui/FloatingWindow'
import { ConfirmDialog } from '@ui/ConfirmDialog'
import { useConfirm } from '../../../../src/core/hooks/useConfirm'

/** A dialog exercising the conversion rules added after the first measure (WEB-VIEWS §21). */
export function Rules({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const [busy, setBusy] = useState(false)
  const { confirmState, handleConfirm, handleCancel } = useConfirm()
  const save = () => setBusy(true)

  return (
    <FloatingWindow
      title={t('rules.title', { defaultValue: 'Règles' })}
      onClose={onClose}
      backdrop
      t={t}
      actions={{
        confirm: { label: t('common.save'), onClick: save, disabled: busy, loading: busy },
        cancel: { label: t('common.cancel') },
      }}
    >
      <div className="flex flex-col gap-4 p-4">
        <Callout variant="info" t={t}>{t('rules.note', { defaultValue: 'Note' })}</Callout>
        <EmptyState
          icon={<Plus size={26} />}
          title={t('rules.none', { defaultValue: 'Rien' })}
          compact
          t={t}
          action={{ label: t('common.add'), onClick: save }}
        />
        <Card title={t('rules.card', { defaultValue: 'Carte' })} actions={<Button size="sm" onClick={save}>{t('common.add')}</Button>}>
          <p className="text-sm">{t('rules.body', { defaultValue: 'Corps' })}</p>
        </Card>
        {confirmState && <ConfirmDialog {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} />}
      </div>
    </FloatingWindow>
  )
}
