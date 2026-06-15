import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home, Grid, Settings } from 'lucide-react'

export default function MobileNav() {
  const { t } = useTranslation()
  const { t: tn } = useTranslation('nav')
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border
                    flex justify-around items-center h-14 lg:hidden">
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
    </nav>
  )
}
