import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react'
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
      className="flex items-center gap-3 w-full px-3 py-2 text-sm
                 text-text-primary hover:bg-surface-1 cursor-pointer outline-none text-left"
    >
      {icon && <span className="text-text-secondary">{icon}</span>}
      {label}
    </button>
  )
}

export function ContextMenuSeparator() {
  return <div className="my-1 h-px bg-border mx-2" />
}

export function ContextMenuProvider({ children }: { children: React.ReactNode }) {
  const [menu, setMenu] = useState({ visible: false, x: 0, y: 0 })
  const menuRef = useRef<HTMLDivElement>(null)

  const activeModules = useModulesStore(s => s.activeModules)
  const activeIds = new Set(activeModules.map(m => m.module_id))

  // Only open if at least one contributor is active for the current location
  const hasItems = SlotRegistry.getSlot('context-menu-items').some(e => activeIds.has(e.moduleId))

  const close = useCallback(() => setMenu(m => ({ ...m, visible: false })), [])

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
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
    const onMouse = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) close()
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    const onScroll = () => close()
    document.addEventListener('mousedown', onMouse)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('mousedown', onMouse)
      document.removeEventListener('keydown', onKey)
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
          className="fixed z-[200] bg-white border border-border rounded-[5px] shadow-lg py-1 min-w-[200px]"
          style={{ left: x, top: y }}
          onContextMenu={e => e.preventDefault()}
        >
          <Slot name="context-menu-items" />
        </div>
      )}
    </Ctx.Provider>
  )
}
