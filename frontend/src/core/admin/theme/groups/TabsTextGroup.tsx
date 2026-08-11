import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RichText, Tabs } from '@ui'

/** Tab strip + rich text editor. */
export default function TabsTextGroup() {
  const { t } = useTranslation()
  const [tab, setTab] = useState('apercu')
  const [rich, setRich] = useState('<p>Texte <strong>riche</strong></p>')

  return (
    <div className="space-y-3">
      <Tabs
        tabs={[
          { id: 'apercu', label: t('admin.t_prev_tab_preview', { defaultValue: 'Aperçu' }) },
          { id: 'code', label: 'Code' },
          { id: 'reglages', label: t('admin.t_prev_tab_settings', { defaultValue: 'Réglages' }) },
        ]}
        value={tab}
        onChange={setTab}
      />
      <div className="w-full max-w-md">
        <RichText value={rich} onChange={setRich} placeholder={t('admin.t_prev_write', { defaultValue: 'Écrire…' })} />
      </div>
    </div>
  )
}
