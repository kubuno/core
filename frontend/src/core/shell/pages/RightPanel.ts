/**
 * Code-behind of `RightPanel.kbcontrol` (converted from `RightPanel.tsx` by @kubuno/views-migrate).
 */
import { bind, type MouseEventArgs } from '@kubuno/views'
import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useLocation, useNavigate } from "react-router-dom"
import { useRightPanelStore } from "../../store/rightPanelStore"
import { appIdFromPath, panelPrefs, RIGHT_PANEL_WIDTH } from "../../store/panelPrefs"

import { ViewBase } from './RightPanel.kbcontrol'
import * as __parts from './RightPanel.parts.tsx'

const OVERLAY_BELOW = 1280

export class RightPanel extends ViewBase {
  @bind accessor dragging = false
  tr!: RightPanelStores['t']
  entries!: RightPanelStores['entries']
  activeModuleId!: string | null
  closePanel!: () => void
  navigate!: RightPanelStores['navigate']
  pathname!: string
  width!: number
  setWidth!: RightPanelStores['setWidth']
  drag!: RightPanelStores['drag']
  applyWidth!: (next: number) => void
  onResizeDown!: (e: React.PointerEvent) => void
  onResizeMove!: (e: React.PointerEvent) => void
  endResize!: (e: React.PointerEvent) => void
  overlay!: RightPanelStores['overlay']

  /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
  useStores() {
    const { t } = useTranslation()
    const { entries, activeModuleId, closePanel } = useRightPanelStore()
    const navigate = useNavigate()
    const { pathname } = useLocation()
    const [width, setWidth] = useState<number>(RIGHT_PANEL_WIDTH.DEFAULT)
    const drag = useRef<{ x: number; w: number } | null>(null)
    const applyWidth = useCallback((next: number) => {
      setWidth(Math.max(RIGHT_PANEL_WIDTH.MIN, Math.min(RIGHT_PANEL_WIDTH.MAX, Math.round(next))))
    }, [])
    const onResizeMove = useCallback((e: React.PointerEvent) => {
      const d = drag.current
      if (!d) return
      // The joint is on the panel's LEFT edge: dragging left WIDENS it, so the delta
      // is inverted compared with the left sidebar.
      applyWidth(d.w - (e.clientX - d.x))
    }, [applyWidth])
    useEffect(() => { document.documentElement.dataset.kbRightW = String(width) }, [width])
    const [overlay, setOverlay] = useState<boolean>(() =>
      typeof window !== 'undefined' && window.innerWidth < OVERLAY_BELOW)
    useEffect(() => {
      const onResize = () => setOverlay(window.innerWidth < OVERLAY_BELOW)
      window.addEventListener('resize', onResize)
      return () => window.removeEventListener('resize', onResize)
    }, [])
    return { t, entries, activeModuleId, closePanel, navigate, pathname, width, setWidth, drag, applyWidth, onResizeMove, overlay, setOverlay }
  }

  /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
  useHooks() {
    const closePanel = this.closePanel
    const setWidth = this.setWidth
    const drag = this.drag
    const overlay = this.overlay
    useEffect(() => {
      const saved = panelPrefs.get(this.appId).rightWidth
      setWidth(saved ?? RIGHT_PANEL_WIDTH.DEFAULT)
    }, [this.appId])
    const onResizeDown = useCallback((e: React.PointerEvent) => {
      e.preventDefault()
      drag.current = { x: e.clientX, w: Number(document.documentElement.dataset.kbRightW) || RIGHT_PANEL_WIDTH.DEFAULT }
      this.dragging = true
      ;(e.target as Element).setPointerCapture?.(e.pointerId)
    }, [])
    this.publish({ onResizeDown })
    const endResize = useCallback((e: React.PointerEvent) => {
      if (!drag.current) return
      drag.current = null
      this.dragging = false
      // Releasing an already-lost capture throws in some engines, and this also runs
      // from `onLostPointerCapture` where the capture is gone by definition.
      try { (e.target as Element).releasePointerCapture?.(e.pointerId) } catch { /* already released */ }
      panelPrefs.setRightWidth(this.appId, Number(document.documentElement.dataset.kbRightW) || RIGHT_PANEL_WIDTH.DEFAULT)
    }, [this.appId])
    this.publish({ endResize })
    useEffect(() => {
      if (!this.isOpen || !overlay) return
      const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closePanel() }
      document.addEventListener('keydown', onKey)
      return () => document.removeEventListener('keydown', onKey)
    }, [this.isOpen, overlay, closePanel])
    return { onResizeDown, endResize }
  }

  /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
  use(): void {
    const s = this.useStores()
    this.publish({ tr: s.t, entries: s.entries, activeModuleId: s.activeModuleId, closePanel: s.closePanel, navigate: s.navigate, pathname: s.pathname, width: s.width, setWidth: s.setWidth, drag: s.drag, applyWidth: s.applyWidth, onResizeMove: s.onResizeMove, overlay: s.overlay })
    const h = this.useHooks()
    this.publish({ onResizeDown: h.onResizeDown, endResize: h.endResize })
  }

  get appId(): string {
    return appIdFromPath(this.pathname)
  }

  get activeEntry() {
    return this.memo('activeEntry', [this.entries, this.activeModuleId], () => {
      const activeModuleId = this.activeModuleId
      return this.entries.find((e) => e.moduleId === activeModuleId)
    })
  }

  get isOpen(): boolean {
    return this.activeModuleId !== null && this.activeEntry != null
  }

  get chromeBtn(): string {
    return 'flex h-8 w-8 items-center justify-center rounded-full text-text-tertiary transition-colors ' +
    'hover:bg-surface-2 hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary'
  }

  get show_is_open_overlay() {
    return this.isOpen && this.overlay
  }

  get part1_props() {
    return this.memo('part1_props', [this.overlay, this.dragging, this.isOpen, this.width, this.activeEntry, this.tr, this.onResizeDown, this.onResizeMove, this.endResize, this.applyWidth, this.appId, this.navigate, this.chromeBtn, this.closePanel], () => ({ overlay: this.overlay, dragging: this.dragging, isOpen: this.isOpen, width: this.width, activeEntry: this.activeEntry, t: this.tr, onResizeDown: this.onResizeDown, onResizeMove: this.onResizeMove, endResize: this.endResize, applyWidth: this.applyWidth, appId: this.appId, navigate: this.navigate, chromeBtn: this.chromeBtn, closePanel: this.closePanel }))
  }

  /** A part of the screen still written in React (<div> with a computed style). */
  get Part1() {
    return __parts.Part1
  }

  panel_click(_sender: unknown, _args: MouseEventArgs) {
    if (!(this.isOpen && this.overlay)) return undefined as never
    this.closePanel()
  }

}

/** What `useStores()` gives (the types of the fields it fills). */
export type RightPanelStores = ReturnType<RightPanel['useStores']>

/** What `useHooks()` gives (the types of the fields it fills). */
export type RightPanelHooks = ReturnType<RightPanel['useHooks']>

export default RightPanel.component()
