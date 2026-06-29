import { create } from 'zustand'
import type React from 'react'

export interface RailEntry {
  moduleId:       string
  icon:           React.ComponentType<{ size?: number; className?: string }>
  label:          string
  panelComponent: React.ComponentType
  openPath?:      string
}

interface RightPanelState {
  entries:        RailEntry[]
  activeModuleId: string | null
  registerEntry:   (entry: RailEntry) => void
  unregisterEntry: (moduleId: string) => void
  togglePanel:    (moduleId: string) => void
  closePanel:     () => void
  /** Set the open panel directly (used to restore persisted state). */
  setActive:      (moduleId: string | null) => void
}

export const useRightPanelStore = create<RightPanelState>((set) => ({
  entries:        [],
  activeModuleId: null,

  registerEntry: (entry) =>
    set((s) => ({
      entries: [...s.entries.filter((e) => e.moduleId !== entry.moduleId), entry],
    })),

  unregisterEntry: (moduleId) =>
    set((s) => ({
      entries:        s.entries.filter((e) => e.moduleId !== moduleId),
      activeModuleId: s.activeModuleId === moduleId ? null : s.activeModuleId,
    })),

  togglePanel: (moduleId) =>
    set((s) => ({
      activeModuleId: s.activeModuleId === moduleId ? null : moduleId,
    })),

  closePanel: () => set({ activeModuleId: null }),

  setActive: (moduleId) => set({ activeModuleId: moduleId }),
}))
