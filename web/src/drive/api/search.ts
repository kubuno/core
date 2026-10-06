import { api } from '@kubuno/sdk'
import type { FilesSearchFilters } from '../store'
import type { SearchHit } from './types'

/** Full-text/semantic search and perceptual image lookup. */
export const searchApi = {
  searchFiles: async (
    q: string,
    filters: FilesSearchFilters,
    opts?: { limit?: number; offset?: number },
  ): Promise<{ results: SearchHit[]; total: number; semantic: boolean }> => {
    const r = await api.get<{ results: SearchHit[]; total: number; semantic: boolean }>('/drive/search', {
      params: {
        q,
        type:           filters.type,
        owner:          filters.owner,
        date:           filters.modifiedDate,
        trash:          filters.inTrash,
        starred:        filters.isStarred,
        item_name:      filters.itemName,
        contains_words: filters.containsWords,
        limit:          opts?.limit ?? 20,
        offset:         opts?.offset ?? 0,
      },
    })
    return r.data
  },

  // Similar-image search (perceptual fingerprint) from a supplied image.
  searchSimilar: async (image: File): Promise<{ results: SearchHit[]; total: number; semantic: boolean }> => {
    const fd = new FormData()
    fd.append('image', image)
    const r = await api.post<{ results: SearchHit[]; total: number; semantic: boolean }>('/drive/search/similar', fd)
    return r.data
  },
}
