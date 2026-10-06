/** Types of the `Defects.tsx` fixture (a module's own `Folder`, as `@kubuno/drive` has one). */
export interface Folder {
  id: string
  name: string
}

export function listFolders(open: boolean): Folder[] {
  return open ? [{ id: '1', name: 'Docs' }] : []
}
