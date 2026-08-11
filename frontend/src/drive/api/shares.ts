import { api } from '@kubuno/sdk'
import type { CreateShareOptions, Recipient, Share } from './types'

/** Shares: public links, per-recipient access and revocation. */
export const shareApi = {
  listShares: async (): Promise<{ shares: Share[] }> => {
    const r = await api.get<{ shares: Share[] }>('/drive/shares')
    return r.data
  },

  createShare: async (opts: CreateShareOptions): Promise<{ share: Share }> => {
    const r = await api.post<{ share: Share }>('/drive/shares', opts)
    return r.data
  },

  searchRecipients: async (q: string, limit = 10): Promise<Recipient[]> => {
    const r = await api.get<{ recipients: Recipient[] }>('/drive/shares/recipients', {
      params: { q, limit },
    })
    return r.data.recipients ?? []
  },

  revokeShare: async (id: string): Promise<void> => {
    await api.delete(`/drive/shares/${id}`)
  },

  revokeAccess: async (shareId: string): Promise<void> => {
    await api.delete(`/drive/shares/${shareId}`)
  },
}
