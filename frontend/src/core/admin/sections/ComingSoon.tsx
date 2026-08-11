import { useTranslation } from 'react-i18next'
import { Clock } from 'lucide-react'

// Placeholder for sections that are declared in the menu but not built yet
// (nav leaves flagged `soon: true` in adminNav.ts).
export default function ComingSoon({ titleKey }: { titleKey: string }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
      <div className="w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center">
        <Clock size={30} className="text-text-tertiary" />
      </div>
      <h2 className="text-lg font-medium text-text-primary">{t(titleKey)}</h2>
      <p className="text-sm text-text-secondary max-w-sm">{t('admin.soon_desc')}</p>
      <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary-light text-primary">{t('admin.soon_badge')}</span>
    </div>
  )
}
