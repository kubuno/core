import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { MENU_ATTR, useMenuDismiss } from '../../ui/useMenuDismiss'
import { findTextTarget } from '../../ui/textFieldMenu'
import { Slot, SlotRegistry } from '../slots/SlotRegistry'
import { useModulesStore } from '../store/modulesStore'

interface ContextMenuCtx {
  close: () => void
}

const Ctx = createContext<ContextMenuCtx>({ close: () => {} })
export const useContextMenu = () => useContext(Ctx)

export function ContextMenuItem({
  onClick,
  icon,
  label,
}: {
  onClick: () => void
  icon?: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-3 w-full px-2.5 py-1.5 text-sm rounded-md
                 text-text-primary hover:bg-primary hover:text-white cursor-pointer outline-none text-left"
    >
      {icon && <span className="text-primary group-hover:text-white">{icon}</span>}
      {label}
    </button>
  )
}

export function ContextMenuSeparator() {
  return <div className="my-[5px] h-px mx-1.5" style={{ background: 'var(--kb-black-12)' }} />
}

export function ContextMenuProvider({ children }: { children: React.ReactNode }) {
  const [menu, setMenu] = useState({ visible: false, x: 0, y: 0 })
  const menuRef = useRef<HTMLDivElement>(null)

  const activeModules = useModulesStore(s => s.activeModules)
  const activeIds = new Set(activeModules.map(m => m.module_id))

  // Only open if at least one contributor is active for the current location
  const hasItems = SlotRegistry.getSlot('context-menu-items').some(e => activeIds.has(e.moduleId))

  const close = useCallback(() => setMenu(m => ({ ...m, visible: false })), [])

  useMenuDismiss(menu.visible, close)

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    /* A text entry area owns its own default menu (TextFieldMenuHost). Bail out before
     * touching the event: `stopPropagation` here would keep it from ever reaching the
     * document-level listener that opens the field menu. */
    if (findTextTarget(e.target)) return
    if (!hasItems) return   // no items → let the browser default (or just ignore)
    e.preventDefault()
    e.stopPropagation()
    setMenu({ visible: true, x: e.clientX, y: e.clientY })
  }, [hasItems])

  // Close before paint if the slot rendered no interactive items.
  // This prevents an empty popup from ever appearing on screen.
  useLayoutEffect(() => {
    if (!menu.visible || !menuRef.current) return
    const hasContent = menuRef.current.querySelector('button, a, [role="menuitem"]') !== null
    if (!hasContent) close()
  }, [menu.visible, close])

  useEffect(() => {
    if (!menu.visible) return
    const onMouse = (e: Event) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) close()
    }
    const onScroll = () => close()
    // `pointerdown`, pas `mousedown` : un déclencheur Radix appelle `preventDefault()`
    // sur pointerdown, ce qui SUPPRIME le mousedown de compatibilité — le menu ouvert
    // ne voyait alors jamais le clic et restait affiché. Capture pour passer devant
    // tout composant qui stoppe la propagation.
    document.addEventListener('pointerdown', onMouse, true)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('pointerdown', onMouse, true)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [menu.visible, close])

  // Keep menu within viewport
  const vw = typeof window !== 'undefined' ? window.innerWidth : 0
  const vh = typeof window !== 'undefined' ? window.innerHeight : 0
  const menuW = 220
  const menuH = 200
  const x = Math.min(menu.x, vw - menuW - 8)
  const y = Math.min(menu.y, vh - menuH - 8)

  return (
    <Ctx.Provider value={{ close }}>
      <div className="contents" onContextMenu={handleContextMenu}>
        {children}
      </div>
      {menu.visible && hasItems && (
        <div
          ref={menuRef}
          {...{ [MENU_ATTR]: '' }}
          className="kb-frosted fixed z-[200] min-w-[200px]"
          style={{ left: x, top: y }}
          onContextMenu={e => e.preventDefault()}
        >
          <div className="kb-frost-layer" aria-hidden />
          {/* side padding forms the gutter the highlight pill is inset by */}
          <div style={{ padding: 5 }}>
            <Slot name="context-menu-items" />
          </div>
        </div>
      )}
    </Ctx.Provider>
  )
}
