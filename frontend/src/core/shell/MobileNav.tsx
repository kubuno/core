import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home, Grid, Settings } from 'lucide-react'

export default function MobileNav() {
  const { t } = useTranslation()
  const { t: tn } = useTranslation('nav')
  return (
    <nav data-app-chrome
         style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
         className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border lg:hidden">
      {/* 56px row of items; the nav's safe-area padding extends the white
          background below it, over the home indicator. */}
      <div className="flex justify-around items-center h-14">
        <NavLink to="/" end className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 px-4 py-1 text-xs ${isActive ? 'text-primary' : 'text-text-secondary'}`
        }>
          <Home size={22} />
          <span>{tn('home', { defaultValue: 'Accueil' })}</span>
        </NavLink>
        <NavLink to="/modules" className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 px-4 py-1 text-xs ${isActive ? 'text-primary' : 'text-text-secondary'}`
        }>
          <Grid size={22} />
          <span>{tn('modules', { defaultValue: 'Modules' })}</span>
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 px-4 py-1 text-xs ${isActive ? 'text-primary' : 'text-text-secondary'}`
        }>
          <Settings size={22} />
          <span>{t('user.settings')}</span>
        </NavLink>
      </div>
    </nav>
  )
}
