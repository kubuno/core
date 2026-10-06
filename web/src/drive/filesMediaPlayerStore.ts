import { create } from 'zustand'
import type { FileItem } from './api'

interface FilesMediaPlayerState {
  file:            FileItem | null
  isMinimized:     boolean
  isPlaying:       boolean
  position:        number
  duration:        number
  restorePosition: number   // seek here on next load, then reset to 0

  open:                  (file: FileItem) => void
  minimize:              () => void
  restore:               () => void
  close:                 () => void
  _clearRestorePosition: () => void

  _setPlaying:  (v: boolean) => void
  _setPosition: (v: number)  => void
  _setDuration: (v: number)  => void
}

// ── Session persistence ───────────────────────────────────────────────────────

const SESSION_KEY = 'kubuno:files:audio'

type Snapshot = { file: FileItem; position: number; isMinimized: boolean }

function loadSnapshot(): Snapshot | null {
  try {
    const s = sessionStorage.getItem(SESSION_KEY)
    return s ? (JSON.parse(s) as Snapshot) : null
  } catch { return null }
}

const _snap = loadSnapshot()

// ── Store ─────────────────────────────────────────────────────────────────────

export const useFilesMediaPlayerStore = create<FilesMediaPlayerState>((set, get) => {
  window.addEventListener('beforeunload', () => {
    const st = get()
    if (st.file) {
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({
          file:        st.file,
          position:    st.position,
          isMinimized: st.isMinimized,
        }))
      } catch {}
    } else {
      try { sessionStorage.removeItem(SESSION_KEY) } catch {}
    }
  })

  return {
    file:            _snap?.file        ?? null,
    isMinimized:     _snap?.isMinimized ?? false,
    isPlaying:       false,
    position:        _snap?.position    ?? 0,
    duration:        0,
    restorePosition: _snap?.position    ?? 0,

    open: (file) => set({ file, isMinimized: false, position: 0, duration: 0, isPlaying: false, restorePosition: 0 }),
    minimize: () => set({ isMinimized: true }),
    restore:  () => set({ isMinimized: false }),
    close:    () => {
      try { sessionStorage.removeItem(SESSION_KEY) } catch {}
      set({ file: null, isMinimized: false, isPlaying: false, position: 0, duration: 0, restorePosition: 0 })
    },

    _clearRestorePosition: () => set({ restorePosition: 0 }),
    _setPlaying:  (v) => set({ isPlaying: v }),
    _setPosition: (v) => set({ position: v }),
    _setDuration: (v) => set({ duration: v }),
  }
})
