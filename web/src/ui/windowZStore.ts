import { create } from 'zustand'

const BASE_Z = 1000

interface State {
  counter: number
  next:    () => number
}

export const useWindowZStore = create<State>((set, get) => ({
  counter: BASE_Z,
  next: () => {
    const z = get().counter + 1
    set({ counter: z })
    return z
  },
}))
