import { create } from 'zustand'

// Bridge between an editor's DockArea and the shell's right rail.
//
// The reopen-closed-panels control used to float over the editor viewport; the
// user asked for it to live in the right rail, next to the customise button.
// The rail is a shell component and knows nothing about the active editor's dock,
// so the DockArea publishes its closed panels here and the rail renders the
// control. Kept deliberately tiny and core-only: no DockArea prop (which would
// need an @kubuno/sdk republish before modules could use it) and last-writer-wins
// (a single editor is active at a time; each DockArea clears on unmount).

export interface DockReopenEntry {
  id: string
  label: string
}

interface DockReopenState {
  /** Closed panels of the currently mounted DockArea, re-openable from the rail. */
  entries: DockReopenEntry[]
  /** Re-dock a closed panel by id (provided by the active DockArea). */
  reopen: ((id: string) => void) | null
  /** Called by the DockArea whenever its closed set changes. */
  publish: (entries: DockReopenEntry[], reopen: (id: string) => void) => void
  /** Called by the DockArea on unmount so a stale reopener never lingers. */
  clear: () => void
}

export const useDockReopenStore = create<DockReopenState>((set) => ({
  entries: [],
  reopen: null,
  publish: (entries, reopen) => set({ entries, reopen }),
  clear: () => set({ entries: [], reopen: null }),
}))
