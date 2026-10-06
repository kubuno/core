/**
 * The parts of `MobileNav.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import { NavLink } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { type MobileNavTab } from "../store/sidebarStore"

function NavItem({ tab, rail }: { tab: MobileNavTab; rail: boolean }) {
  const { t } = useTranslation()
  const label = tab.labelKey ? t(tab.labelKey, { defaultValue: tab.label ?? tab.id }) : (tab.label ?? tab.id)
  const Icon = tab.Icon
  return (
    <NavLink to={tab.path} end={tab.end ?? false} title={label}
             className={({ isActive }) => `flex flex-col items-center gap-0.5 min-w-0 transition-colors
               ${rail
                 ? `mx-2 px-1 py-2 rounded-lg ${isActive ? 'bg-primary-light text-primary' : 'text-text-secondary'}`
                 : 'px-3 py-1 text-xs'}`}>
      {({ isActive }) => (
        <>
          {/* Bottom bar keeps the pill behind the icon; the rail highlights the
              whole item (icon colour inherited from the NavLink). */}
          <span className={`flex items-center justify-center h-7 transition-colors
                            ${rail ? 'w-full' : `w-16 rounded-2xl ${isActive ? 'bg-primary-light text-primary' : 'text-text-secondary'}`}`}>
            <Icon size={21} />
          </span>
          <span className={`truncate ${rail ? 'max-w-[60px] text-[11px]' : 'max-w-[5.5rem] text-xs'}
                            ${isActive ? 'text-primary font-medium' : 'text-text-secondary'}`}>
            {label}
          </span>
        </>
      )}
    </NavLink>
  )
}
export { NavItem }
