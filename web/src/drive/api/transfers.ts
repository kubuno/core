import { api } from '@kubuno/sdk'

/** Thumbnails and downloads (URLs consumed directly by <img>/<a>, plus blobs). */
export const transferApi = {
  thumbnailUrl: (id: string) => `/api/v1/drive/${id}/thumbnail`,
  downloadUrl:  (id: string) => `/api/v1/drive/${id}/download`,
  downloadBlob: async (id: string): Promise<Blob> => {
    const r = await api.get(`/drive/${id}/download`, { responseType: 'blob' })
    return r.data as Blob
  },
}
