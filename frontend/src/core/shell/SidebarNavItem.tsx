import * as Tooltip from '@radix-ui/react-tooltip'
import { Link, useResolvedPath, useMatch } from 'react-router-dom'
import type { ReactNode } from 'react'

// Élément de navigation de barre latérale partagé par les modules.
// Géré en mode REPLIÉ (icône seule + tooltip) ET DÉPLIÉ (icône + libellé), pour
// que la nav du module reste la même dans les deux états. Accepte soit `onClick`
// (bouton), soit `to` (NavLink).
export function SidebarNavItem({
  label, icon, active, collapsed = false, onClick, to, end, badge,
}: {
  label: string
  icon: ReactNode
  active?: boolean
  collapsed?: boolean
  onClick?: () => void
  to?: string
  end?: boolean
  badge?: number
}) {
  // On calcule l'état actif NOUS-MÊMES (au lieu de la render-prop `className` de
  // NavLink). Raison : en mode replié, le nœud est enveloppé dans
  // <Tooltip.Trigger asChild> (Radix Slot), qui fusionne `className` en supposant
  // une CHAÎNE — il sérialise donc une `className` fonction (« ({isActive})=>… »)
  // au lieu de l'appeler, et plus aucune classe Tailwind ne s'applique (icônes
  // écrasées à 16px). On passe donc toujours une `className` chaîne à un <Link>.
  const resolved = useResolvedPath(to ?? '.')
  const match    = useMatch({ path: resolved.pathname, end: end ?? false })
  const isActive = to != null ? (active ?? match != null) : !!active

  // Hauteur de ligne FIXE et IDENTIQUE dans les deux modes (h-10 = 40px) pour que
  // la position de la 1ʳᵉ icône et l'espacement entre icônes soient les mêmes,
  // replié ou déplié.
  // `text-left` : les variantes <button> héritent du `text-align: center` par défaut
  // du navigateur, qui se propageait au libellé → texte centré. On le force à gauche.
  const base = `relative flex items-center h-10 rounded-full text-sm text-left transition-colors ${
    collapsed ? 'justify-center w-10 mx-auto' : 'gap-3 w-full px-3'
  }`
  const cls = (a: boolean) =>
    `${base} ${a
      ? 'bg-primary-light text-primary font-medium'
      : 'text-text-secondary hover:bg-surface-2'}`

  const content = (
    <>
      {icon}
      {!collapsed && <span className="truncate flex-1">{label}</span>}
      {!collapsed && badge != null && badge > 0 && (
        <span className="text-xs bg-primary text-white rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
      {collapsed && badge != null && badge > 0 && (
        <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-primary" />
      )}
    </>
  )

  const node = to != null ? (
    <Link to={to} aria-label={label} className={cls(isActive)}>
      {content}
    </Link>
  ) : (
    <button onClick={onClick} aria-label={label} className={cls(isActive)}>
      {content}
    </button>
  )

  if (!collapsed) return node

  // Replié : tooltip au survol pour retrouver le libellé. Le Provider est requis
  // par Radix (sinon Tooltip.Root lève et fait planter le rendu).
  return (
    <Tooltip.Provider delayDuration={300}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>{node}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content side="right" sideOffset={8}
            className="px-2.5 py-1.5 text-xs rounded-md shadow-md select-none z-[60]"
            style={{ background: 'var(--color-surface-3)', color: 'var(--color-text-primary)' }}>
            {label}
            <Tooltip.Arrow style={{ fill: 'var(--color-surface-3)' }} />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}
