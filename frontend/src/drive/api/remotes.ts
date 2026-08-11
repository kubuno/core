import { api } from '@kubuno/sdk'
import type { CreateRemoteDto, RemoteConnection, RemoteEntry, TestRemoteResult } from './types'

/** Remote mounts (external providers): connections and live browsing. */
export const remoteApi = {
  listRemotes: async (): Promise<RemoteConnection[]> => {
    const r = await api.get<{ connections: RemoteConnection[] }>('/drive/remotes')
    return r.data.connections ?? []
  },

  createRemote: async (dto: CreateRemoteDto): Promise<{ id: string; mount_name: string }> => {
    const r = await api.post('/drive/remotes', dto)
    return r.data
  },

  deleteRemote: async (id: string): Promise<void> => {
    await api.delete(`/drive/remotes/${id}`)
  },

  testRemote: async (id: string): Promise<TestRemoteResult> => {
    const r = await api.post<TestRemoteResult>(`/drive/remotes/${id}/test`)
    return r.data
  },

  // LIVE navigation inside a remote mount (not indexed in the local tree).
  // Path WITHOUT a leading slash; the root ('') goes through the dedicated
  // /browse route (the catch-all *path route does not match an empty string).
  browseRemote: async (id: string, path: string): Promise<RemoteEntry[]> => {
    const p = path.replace(/^\/+/, '').replace(/\/+$/, '')
    const url = p
      ? `/drive/remotes/${id}/browse/${p.split('/').map(encodeURIComponent).join('/')}`
      : `/drive/remotes/${id}/browse`
    const r = await api.get<{ items: RemoteEntry[] }>(url)
    return r.data.items ?? []
  },

  deleteRemoteEntry: async (id: string, path: string): Promise<void> => {
    const p = path.replace(/^\/+/, '')
    await api.delete(`/drive/remotes/${id}/entry/${p.split('/').map(encodeURIComponent).join('/')}`)
  },

  renameRemoteEntry: async (id: string, path: string, to: string): Promise<void> => {
    const p = path.replace(/^\/+/, '')
    await api.post(`/drive/remotes/${id}/rename/${p.split('/').map(encodeURIComponent).join('/')}`, { to })
  },

  // Creates a folder on a remote mount (mkdir).
  createRemoteDir: async (id: string, path: string): Promise<void> => {
    const p = path.replace(/^\/+/, '')
    await api.post(`/drive/remotes/${id}/mkdir/${p.split('/').map(encodeURIComponent).join('/')}`, {})
  },

  // Writes a file to a remote mount (path = remote folder + name).
  uploadRemoteFile: async (id: string, path: string, data: Blob | File): Promise<void> => {
    const p = path.replace(/^\/+/, '')
    const url = `/drive/remotes/${id}/upload/${p.split('/').map(encodeURIComponent).join('/')}`
    await api.post(url, data, { headers: { 'Content-Type': 'application/octet-stream' } })
  },

  // Fetches a remote file into memory (for materialisation / opening it in an
  // editor without triggering a browser download).
  fetchRemoteFileBlob: async (id: string, path: string): Promise<Blob> => {
    const p = path.replace(/^\/+/, '')
    const url = `/drive/remotes/${id}/file/${p.split('/').map(encodeURIComponent).join('/')}`
    const r = await api.get(url, { responseType: 'blob' })
    return r.data as Blob
  },

  downloadRemoteFile: async (id: string, path: string, fileName: string): Promise<void> => {
    const p = path.replace(/^\/+/, '')
    const reqUrl = `/drive/remotes/${id}/file/${p.split('/').map(encodeURIComponent).join('/')}`
    const r = await api.get(reqUrl, { responseType: 'blob' })
    const blobUrl = URL.createObjectURL(new Blob([r.data as BlobPart]))
    const a = document.createElement('a')
    a.href = blobUrl; a.download = fileName; a.click()
    URL.revokeObjectURL(blobUrl)
  },
}
