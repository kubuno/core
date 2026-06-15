import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { LayoutDashboard, Pencil, Check } from 'lucide-react'
import { format } from 'date-fns'
import { enUS, fr, es, pt, it, de, el, ru, ar, he, hi, zhCN, ja, type Locale } from 'date-fns/locale'
import { useAuthStore } from '../store/authStore'
import { useModulesStore } from '../store/modulesStore'
import { WidgetRegistry } from '../widgets/WidgetRegistry'
import GridDashboard from '../widgets/GridDashboard'
import { Button } from '@ui'

const DATE_LOCALES: Record<string, Locale> = {
  en: enUS, fr, es, pt, it, de, el, ru, ar, he, hi, zh: zhCN, ja,
}

export default function HomePage() {
  const { t, i18n }       = useTranslation()
  const { user }          = useAuthStore()
  const { activeModules } = useModulesStore()
  const activeIds         = new Set(activeModules.map(m => m.module_id))
  const allWidgets        = WidgetRegistry.getAll().filter(w => w.moduleId === 'core' || activeIds.has(w.moduleId))

  const [editMode, setEditMode] = useState(false)

  const name = user?.display_name?.split(' ')[0] ?? user?.username ?? t('home.you')

  const h = new Date().getHours()
  const greetingKey = h < 6 ? 'home.g_night' : h < 12 ? 'home.g_morning' : h < 18 ? 'home.g_afternoon' : 'home.g_evening'
  const dateLocale = DATE_LOCALES[i18n.language] ?? enUS

  if (allWidgets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center gap-4">
        <div className="w-20 h-20 rounded-3xl bg-surface-2 flex items-center justify-center">
          <LayoutDashboard size={40} className="text-text-tertiary" />
        </div>
        <div>
          <h1 className="text-xl font-medium text-text-primary mb-2">{t('home.welcome_title')}</h1>
          <p className="text-sm text-text-secondary max-w-xs mx-auto">
            {t('home.no_module_pre')}
            <Link to="/admin" className="text-primary hover:underline">{t('home.admin_link')}</Link>.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-medium text-text-primary">{t(greetingKey, { name })}</h1>
          <p className="text-sm text-text-tertiary mt-0.5 capitalize">
            {format(new Date(), "EEEE d MMMM yyyy", { locale: dateLocale })}
          </p>
        </div>

        {editMode ? (
          <Button size="sm" icon={<Check size={14} />} onClick={() => setEditMode(false)}>
            {t('home.finish')}
          </Button>
        ) : (
          <Button size="sm" variant="secondary" icon={<Pencil size={14} />} onClick={() => setEditMode(true)}>
            {t('home.customize')}
          </Button>
        )}
      </div>

      <GridDashboard
        allWidgets={allWidgets}
        activeIds={activeIds}
        editMode={editMode}
      />
    </div>
  )
}
