import { createContext, useContext } from 'react'
import type { FileItem } from './api'

export const FilesOpenWithContext = createContext<FileItem | null>(null)

export function useFilesOpenWith(): FileItem | null {
  return useContext(FilesOpenWithContext)
}
