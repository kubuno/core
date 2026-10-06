import { beforeEach, describe, expect, it, vi } from 'vitest'

// The API client is mocked: the tests check what the helpers ask the core for
// and what they hand back, not the network.
const post = vi.fn()
let token: string | null = 'session-token'
vi.mock('./client', () => ({
  api: { post: (...args: unknown[]) => post(...args) },
  hasAccessToken: () => token !== null,
}))

import { clearSignedUrlCache, signedSocketUrl, signedUrl, signedUrls } from './signedUrl'

function answer(purposeTtl = 200) {
  post.mockImplementation(async (_url: string, body: { urls: string[] }) => ({
    data: {
      tickets: body.urls.map(u => ({
        url: `${u}${u.includes('?') ? '&' : '?'}kt=T`,
        expires_at: Math.floor(Date.now() / 1000) + purposeTtl,
      })),
    },
  }))
}

beforeEach(() => {
  post.mockReset()
  token = 'session-token'
  clearSignedUrlCache()
  answer()
})

describe('signedUrl', () => {
  it('signs a same-origin API URL, keeping its query string', async () => {
    expect(await signedUrl('/api/v1/drive/1/thumbnail?v=3')).toBe('/api/v1/drive/1/thumbnail?v=3&kt=T')
    expect(post).toHaveBeenCalledWith('/auth/tickets', expect.objectContaining({
      urls: ['/api/v1/drive/1/thumbnail?v=3'], purpose: 'view', method: 'GET', once: false,
    }))
  })

  it('returns URLs that need no ticket unchanged, without asking the core', async () => {
    for (const u of [
      'https://image.tmdb.org/t/p/w500/x.jpg',
      'blob:http://localhost/123',
      'data:image/png;base64,AAAA',
      '/api/v1/users/42/avatar',
      '/api/v1/themes/kubuno/theme.css',
      '/drive-logo.png',
    ]) expect(await signedUrl(u)).toBe(u)
    expect(post).not.toHaveBeenCalled()
  })

  it('batches the requests of one tick into one call', async () => {
    const urls = await signedUrls(['/api/v1/drive/1/thumbnail', '/api/v1/drive/2/thumbnail', '/api/v1/drive/3/thumbnail'])
    expect(urls).toEqual(['/api/v1/drive/1/thumbnail?kt=T', '/api/v1/drive/2/thumbnail?kt=T', '/api/v1/drive/3/thumbnail?kt=T'])
    expect(post).toHaveBeenCalledTimes(1)
  })

  it('reuses a ticket while it has life left, and forgets it on account change', async () => {
    await signedUrl('/api/v1/drive/1/thumbnail')
    await signedUrl('/api/v1/drive/1/thumbnail')
    expect(post).toHaveBeenCalledTimes(1)
    clearSignedUrlCache()
    await signedUrl('/api/v1/drive/1/thumbnail')
    expect(post).toHaveBeenCalledTimes(2)
  })

  it('never caches one-time download tickets', async () => {
    await signedUrl('/api/v1/drive/1/download', { purpose: 'download', once: true })
    await signedUrl('/api/v1/drive/1/download', { purpose: 'download', once: true })
    expect(post).toHaveBeenCalledTimes(2)
    expect(post).toHaveBeenLastCalledWith('/auth/tickets', expect.objectContaining({ purpose: 'download', once: true }))
  })

  it('hands the bare URL back on an anonymous page', async () => {
    token = null
    expect(await signedUrl('/api/v1/forms/public/x/header')).toBe('/api/v1/forms/public/x/header')
    expect(post).not.toHaveBeenCalled()
  })

  it('drops a previous ticket from the URL it is given', async () => {
    expect(await signedUrl('/api/v1/drive/1/thumbnail?kt=OLD&v=2')).toBe('/api/v1/drive/1/thumbnail?v=2&kt=T')
  })
})

describe('signedSocketUrl', () => {
  it('replaces the access token of a socket URL with a socket ticket', async () => {
    const url = await signedSocketUrl(`ws://${window.location.host}/collab/room%3A1/sync?token=SECRET`)
    expect(url).toBe(`ws://${window.location.host}/collab/room%3A1/sync?kt=T`)
    expect(url).not.toContain('SECRET')
    expect(post).toHaveBeenCalledWith('/auth/tickets', expect.objectContaining({ purpose: 'socket' }))
  })

  it('leaves other hosts alone', async () => {
    expect(await signedSocketUrl('wss://example.org/socket')).toBe('wss://example.org/socket')
  })
})
