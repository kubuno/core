import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dropdown } from '@ui'
import { FileText } from 'lucide-react'
import { MockContextMenu } from '../mocks/ShellMocks'

/** Select dropdown + a context menu shown open. */
export default function MenusGroup() {
  const { t } = useTranslation()
  const [sortVal, setSortVal] = useState('name')

  return (
    <div className="flex flex-wrap items-start gap-6">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-text-tertiary">{t('admin.t_prev_select', { defaultValue: 'Sélecteur' })}</span>
        <Dropdown
          value={sortVal}
          onChange={setSortVal}
          options={[
            { value: 'name', label: 'Nom', icon: <FileText size={14} /> },
            { value: 'date', label: 'Date de modification' },
            { value: 'size', label: 'Taille' },
            { value: 'type', label: 'Type' },
          ]}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-text-tertiary">{t('admin.t_prev_ctxmenu', { defaultValue: 'Menu contextuel' })}</span>
        <MockContextMenu />
      </div>
    </div>
  )
}
