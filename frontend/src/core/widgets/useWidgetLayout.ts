import { useState, useEffect, useCallback } from 'react'
import { WidgetRegistry, type WidgetSize } from './WidgetRegistry'

const STORAGE_KEY = 'kubuno:widget-layout'

interface WidgetLayout {
  order:  string[]                    // widget IDs in display order
  hidden: string[]                    // widget IDs not shown
  sizes:  Record<string, WidgetSize>  // size overrides
}

function loadLayout(): WidgetLayout {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { order: [], hidden: [], sizes: {} }
}

function saveLayout(layout: WidgetLayout) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(layout))
}

export function useWidgetLayout(activeModuleIds: Set<string>) {
  const [layout, setLayout] = useState<WidgetLayout>(loadLayout)

  // Persist on every change
  useEffect(() => { saveLayout(layout) }, [layout])

  const allWidgets = WidgetRegistry.getAll().filter(w => activeModuleIds.has(w.moduleId))

  // Merge registry order with user's saved order. New widgets (not yet in order) are appended.
  const orderedVisible = (() => {
    const available = allWidgets.filter(w => !layout.hidden.includes(w.id))
    const knownOrder = layout.order.filter(id => available.some(w => w.id === id))
    const unordered  = available.filter(w => !knownOrder.includes(w.id)).map(w => w.id)
    const finalOrder = [...knownOrder, ...unordered]
    return finalOrder
      .map(id => available.find(w => w.id === id))
      .filter(Boolean) as typeof allWidgets
  })()

  const hiddenWidgets = allWidgets.filter(w => layout.hidden.includes(w.id))

  const effectiveSize = (id: string, defaultSize?: WidgetSize): WidgetSize =>
    layout.sizes[id] ?? defaultSize ?? 'small'

  const moveWidget = useCallback((fromId: string, toId: string) => {
    setLayout(prev => {
      const ids = orderedVisible.map(w => w.id)
      const from = ids.indexOf(fromId)
      const to   = ids.indexOf(toId)
      if (from === -1 || to === -1 || from === to) return prev
      const next = [...ids]
      next.splice(from, 1)
      next.splice(to, 0, fromId)
      return { ...prev, order: next }
    })
  }, [orderedVisible])

  const reorderWidgets = useCallback((newOrder: string[]) => {
    setLayout(prev => ({ ...prev, order: newOrder }))
  }, [])

  const removeWidget = useCallback((id: string) => {
    setLayout(prev => ({ ...prev, hidden: [...prev.hidden.filter(h => h !== id), id] }))
  }, [])

  const addWidget = useCallback((id: string) => {
    setLayout(prev => ({ ...prev, hidden: prev.hidden.filter(h => h !== id) }))
  }, [])

  const setSize = useCallback((id: string, size: WidgetSize) => {
    setLayout(prev => ({ ...prev, sizes: { ...prev.sizes, [id]: size } }))
  }, [])

  return { orderedVisible, hiddenWidgets, effectiveSize, moveWidget, reorderWidgets, removeWidget, addWidget, setSize }
}
