import { create } from 'zustand'
import type { PromptOptions } from '@ui/PromptDialog'

interface PromptEntry extends PromptOptions {
  resolve: (value: string | null) => void
}

interface PromptStore {
  current: PromptEntry | null
  open:    (options: PromptOptions) => Promise<string | null>
  confirm: (value: string) => void
  cancel:  () => void
}

export const usePromptStore = create<PromptStore>((set, get) => ({
  current: null,
  open: (options) =>
    new Promise<string | null>((resolve) => set({ current: { ...options, resolve } })),
  confirm: (value) => { get().current?.resolve(value); set({ current: null }) },
  cancel:  () => { get().current?.resolve(null); set({ current: null }) },
}))

/**
 * Remplaçant impératif de `window.prompt`, basé sur la primitive PromptDialog du core.
 * Résout avec la valeur saisie, ou `null` si l'utilisateur annule.
 * Nécessite `<PromptHost />` monté une fois dans l'arbre (cf. App.tsx).
 */
export const prompt = (options: PromptOptions): Promise<string | null> =>
  usePromptStore.getState().open(options)
