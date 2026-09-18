import { Link, useLocation } from 'react-router-dom'
import { WaffleAppRegistry } from '../registry/WaffleAppRegistry'
import { useModulesStore } from '../store/modulesStore'
import { InstanceLogo } from './InstanceLogo'

/**
 * The brand in the top-left corner: the logo and name of the app the reader is
 * in, linking to that app's entry point. Inside Mail it reads "Mail" and opens
 * the inbox; inside Office's Documents it reads "Documents" and opens the
 * documents hub. Outside every module (home, administration, settings) it is
 * the instance logo and "Kubuno", linking to the home page.
 *
 * Resolution follows the same rule as the tab title and favicon: the app whose
 * route prefix is the longest match for the current path, so a sub-module wins
 * over its parent. The link opens the app's `landing` when it declares one
 * (Drive's "Accueil"), otherwise its route root.
 */
export function BrandLink({ collapsed = false, iconSize = 32, className = '' }: {
  collapsed?: boolean
  /** Logo edge in px: 32 in the top bar, 40 in the sidebar corner. */
  iconSize?: number
  className?: string
}) {
  const { pathname } = useLocation()
  // Runtime-loaded modules register their apps after the first render.
  useModulesStore((s) => s.loadedVersion)

  const hit = WaffleAppRegistry.resolveAppByPath(pathname)
  const to = hit ? (hit.app.landing ?? hit.app.path) : '/'
  const label = hit ? hit.app.label : 'Kubuno'
  const Icon = hit?.app.Icon

  return (
    <Link
      to={to}
      className={`flex items-center gap-1.5 hover:opacity-90 transition-opacity ${collapsed ? 'justify-center' : 'pl-2 pr-3'} ${className}`}
      title={label}
    >
      {Icon ? <Icon size={iconSize} /> : <InstanceLogo size={iconSize} className="text-primary" />}
      {!collapsed && (
        <span
          className="text-[22px] font-normal hidden sm:block whitespace-nowrap"
          style={{ color: '#5f6368', letterSpacing: '-0.01em' }}
        >
          {label}
        </span>
      )}
    </Link>
  )
}
