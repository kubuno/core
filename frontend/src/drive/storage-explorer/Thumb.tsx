import { useEffect, useState } from 'react'
import { useImageCacheStore } from '@kubuno/sdk'
import type { FileItem } from '../api'
import type { ThumbSpec } from '../storageSource'
import { getFileIcon } from '../filesShared'

// Source-driven thumbnail: direct URL (local), lazily loaded blob (remote), or
// a per-type icon.
export function Thumb({ spec, file, className }: { spec: ThumbSpec; file: FileItem; className?: string }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [err, setErr] = useState(false)
  useEffect(() => {
    if (spec.kind !== 'blob' || !spec.load || err) return
    let alive = true; let url: string | null = null
    spec.load().then(b => { if (!alive || !b) return; url = URL.createObjectURL(b); setBlobUrl(url) }).catch(() => { if (alive) setErr(true) })
    return () => { alive = false; if (url) URL.revokeObjectURL(url) }
  }, [spec, err])

  const thumbVer = useImageCacheStore(s => s.global + (s.versions[file.id] ?? 0))
  if (spec.kind === 'url' && spec.url && !err) {
    const src = thumbVer ? `${spec.url}?v=${thumbVer}` : spec.url
    return <img src={src} alt={file.name} className={className} loading="lazy" onError={() => setErr(true)} />
  }
  if (spec.kind === 'blob' && blobUrl && !err) {
    return <img src={blobUrl} alt={file.name} className={className} onError={() => setErr(true)} />
  }
  return <span className="scale-75">{getFileIcon(file.mime_type, file.name)}</span>
}
