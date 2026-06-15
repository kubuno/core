import { useRef, useCallback, useEffect } from 'react'

interface Position { x: number; y: number }

export function useDraggable(initialPos?: Position) {
  const posRef     = useRef<Position>(initialPos ?? { x: 0, y: 0 })
  const dragging   = useRef(false)
  const startMouse = useRef<Position>({ x: 0, y: 0 })
  const startPos   = useRef<Position>({ x: 0, y: 0 })
  const elRef      = useRef<HTMLDivElement | null>(null)

  const applyPos = useCallback((p: Position) => {
    if (!elRef.current) return
    elRef.current.style.left = `${p.x}px`
    elRef.current.style.top  = `${p.y}px`
  }, [])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return
      const nx = startPos.current.x + e.clientX - startMouse.current.x
      const ny = startPos.current.y + e.clientY - startMouse.current.y
      posRef.current = { x: nx, y: ny }
      applyPos(posRef.current)
    }
    const onUp = () => { dragging.current = false }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
    }
  }, [applyPos])

  const startDrag = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button,input,select,textarea,a')) return
    if (!elRef.current) return

    // Read the element's actual visual position from the DOM.
    // This handles any CSS centering (left:50%, transform:translate(-50%,-50%))
    // so we never teleport to (0,0) on first drag.
    const rect = elRef.current.getBoundingClientRect()

    // Switch to explicit pixel positioning, removing any CSS transform/translate centering.
    // Tailwind v4 uses the `translate` shorthand property (not `transform`), so both must be cleared.
    elRef.current.style.left      = `${rect.left}px`
    elRef.current.style.top       = `${rect.top}px`
    elRef.current.style.transform = 'none'
    elRef.current.style.translate = 'none'
    elRef.current.style.margin    = '0'

    posRef.current     = { x: rect.left, y: rect.top }
    dragging.current   = true
    startMouse.current = { x: e.clientX, y: e.clientY }
    startPos.current   = { x: rect.left, y: rect.top }
    e.preventDefault()
  }, [])

  return { dialogRef: elRef, startDrag }
}
