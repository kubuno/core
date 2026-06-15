import { create } from 'zustand'
import type React from 'react'

export interface LeftRailEntry {
  moduleId: string
  icon:     React.ComponentType<{ size?: number; className?: string }>
  label:    string
  isActive?: boolean
  onClick:  () => void
}

interface LeftRailState {
  entries:         LeftRailEntry[]
  registerEntry:   (entry: LeftRailEntry) => void
  unregisterEntry: (moduleId: string) => void
  updateEntry:     (moduleId: string, patch: Partial<LeftRailEntry>) => void
}

export const useLeftRailStore = create<LeftRailState>((set) => ({
  entries: [],

  registerEntry: (entry) =>
    set((s) => ({
      entries: [...s.entries.filter((e) => e.moduleId !== entry.moduleId), entry],
    })),

  unregisterEntry: (moduleId) =>
    set((s) => ({
      entries: s.entries.filter((e) => e.moduleId !== moduleId),
    })),

  updateEntry: (moduleId, patch) =>
    set((s) => ({
      entries: s.entries.map((e) => (e.moduleId === moduleId ? { ...e, ...patch } : e)),
    })),
}))
