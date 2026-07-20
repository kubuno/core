import { create } from 'zustand'

/** What the caller gets back: either a URL to reference, or a file to store. */
export type ImagePickResult =
  | { kind: 'url';  url: string }
  | { kind: 'file'; file: File }

export interface ImagePickerOptions {
  title?: string
  /** Source ids to hide, e.g. ['webcam'] where a capture makes no sense. */
  exclude?: string[]
}

interface Entry extends ImagePickerOptions {
  resolve: (value: ImagePickResult | null) => void
}

interface Store {
  current: Entry | null
  open:   (options?: ImagePickerOptions) => Promise<ImagePickResult | null>
  pick:   (value: ImagePickResult) => void
  cancel: () => void
}

export const useImagePickerStore = create<Store>((set, get) => ({
  current: null,
  open: (options = {}) =>
    new Promise<ImagePickResult | null>(resolve => set({ current: { ...options, resolve } })),
  pick:   (value) => { get().current?.resolve(value); set({ current: null }) },
  cancel: ()      => { get().current?.resolve(null);  set({ current: null }) },
}))

/**
 * Opens the project's image picker and resolves with the chosen image, or null
 * if the user closes it. THE way to insert or upload an image anywhere in the
 * app — modules never build their own file input for that.
 *
 * Requires `<ImagePickerHost />` mounted once (App.tsx).
 */
export const openImagePicker = (options?: ImagePickerOptions): Promise<ImagePickResult | null> =>
  useImagePickerStore.getState().open(options)
