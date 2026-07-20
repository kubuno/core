import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Link2, Upload, Camera, X, Search, Image as ImageIcon } from 'lucide-react'
import { Button, Input } from '@ui'
import { ImageSourceRegistry, type ImageSource, type ImageSourceProps } from '../registry/ImageSourceRegistry'
import type { ImagePickResult } from '../store/imagePickerStore'

/* ── Source: a plain URL ─────────────────────────────────────────────────── */
function FromUrl({ onPick }: ImageSourceProps) {
  const [url, setUrl] = useState('')
  const ok = /^https?:\/\/.+/i.test(url.trim())
  return (
    <div className="space-y-3">
      <Input value={url} onChange={e => setUrl(e.target.value)} className="w-full"
        placeholder="Collez l'URL de l'image…"
        onKeyDown={e => { if (e.key === 'Enter' && ok) onPick({ kind: 'url', url: url.trim() }) }} />
      <p className="text-xs text-text-tertiary">
        N'utilisez que des images dont vous détenez les droits d'utilisation.
      </p>
      {ok && (
        <div className="rounded-lg border border-border p-2 inline-block">
          <img src={url.trim()} alt="" className="max-h-56 rounded" />
        </div>
      )}
      <div>
        <Button variant="primary" disabled={!ok} onClick={() => onPick({ kind: 'url', url: url.trim() })}>
          Insérer
        </Button>
      </div>
    </div>
  )
}

/* ── Source: upload from this device ─────────────────────────────────────── */
function FromUpload({ onPick }: ImageSourceProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)

  const take = (files: FileList | null) => {
    const file = files?.[0]
    if (file && file.type.startsWith('image/')) onPick({ kind: 'file', file })
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={e => { e.preventDefault(); setOver(false); take(e.dataTransfer.files) }}
      className="h-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-4 transition-colors"
      style={{ borderColor: over ? 'var(--color-primary)' : 'var(--color-border)',
               background: over ? 'var(--color-primary-light)' : 'transparent' }}
    >
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={e => { take(e.target.files); e.target.value = '' }} />
      <ImageIcon size={44} className="text-text-tertiary" />
      <Button variant="primary" onClick={() => inputRef.current?.click()}>Parcourir</Button>
      <p className="text-sm text-text-tertiary">ou faites glisser un fichier ici</p>
    </div>
  )
}

/* ── Source: webcam capture ──────────────────────────────────────────────── */
function FromWebcam({ onPick }: ImageSourceProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let stream: MediaStream | null = null
    navigator.mediaDevices?.getUserMedia({ video: true })
      .then(s => {
        stream = s
        if (videoRef.current) { videoRef.current.srcObject = s; setReady(true) }
      })
      .catch(() => setError("Aucune caméra accessible. Vérifiez l'autorisation du navigateur."))
    return () => { stream?.getTracks().forEach(t => t.stop()) }
  }, [])

  const shoot = () => {
    const v = videoRef.current
    if (!v) return
    const c = document.createElement('canvas')
    c.width = v.videoWidth; c.height = v.videoHeight
    c.getContext('2d')?.drawImage(v, 0, 0)
    c.toBlob(blob => {
      if (blob) onPick({ kind: 'file', file: new File([blob], 'webcam.png', { type: 'image/png' }) })
    }, 'image/png')
  }

  if (error) return <p className="text-sm text-text-secondary">{error}</p>

  return (
    <div className="flex flex-col items-center gap-4 h-full">
      <video ref={videoRef} autoPlay playsInline className="w-full flex-1 min-h-0 rounded-xl bg-black object-cover" />
      <Button variant="primary" icon={<Camera size={16} />} disabled={!ready} onClick={shoot}>
        Prendre la photo
      </Button>
    </div>
  )
}

/* ── The dialog ──────────────────────────────────────────────────────────── */
export default function ImagePickerDialog({ title = 'Insérer une image', exclude = [], onPick, onCancel }: {
  title?: string
  exclude?: string[]
  onPick: (r: ImagePickResult) => void
  onCancel: () => void
}) {
  // Module-contributed sources, re-read whenever one registers.
  const extra = useSyncExternalStore(ImageSourceRegistry.subscribe, ImageSourceRegistry.list, ImageSourceRegistry.list)

  const core: ImageSource[] = [
    { id: 'url',    label: "À partir d'une URL", icon: <Link2 size={18} />,  order: 0,  group: 'library', Component: FromUrl },
    { id: 'upload', label: 'Importer', icon: <Upload size={18} />, order: 30, group: 'device', Component: FromUpload },
    { id: 'webcam', label: 'Webcam',   icon: <Camera size={18} />, order: 40, group: 'device', Component: FromWebcam },
  ]
  const all = [...core, ...extra]
    .filter(s => !exclude.includes(s.id))
    .sort((a, b) => (a.order ?? 100) - (b.order ?? 100))

  const [active, setActive] = useState(all[0]?.id ?? 'url')
  const [query,  setQuery]  = useState('')
  const source  = all.find(s => s.id === active)
  const Current = source?.Component

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 p-4" onClick={onCancel}>
      <div className="w-full max-w-4xl h-[42rem] max-h-[85vh] flex flex-col bg-surface-0 rounded-xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}>
        {/* The search box belongs to the DIALOG, not the tab: it stays in place
            while the user switches sources, so the frame never jumps. */}
        <div className="flex items-center gap-4 px-6 py-3 shrink-0">
          <h2 className="text-xl text-text-primary whitespace-nowrap">{title}</h2>
          <div className="flex-1 min-w-0">
            {source?.searchable && (
              <div className="flex items-center gap-2 h-11 px-4 rounded-full bg-surface-2">
                <Search size={18} className="shrink-0 text-text-secondary" />
                <input value={query} onChange={e => setQuery(e.target.value)}
                  placeholder={source.searchPlaceholder ?? 'Rechercher…'}
                  className="flex-1 min-w-0 bg-transparent outline-none text-sm text-text-primary" />
              </div>
            )}
          </div>
          <button onClick={onCancel} aria-label="Fermer" title="Fermer"
            className="shrink-0 p-2 rounded-full hover:bg-surface-2 text-text-secondary">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 flex min-h-0">
          <nav className="w-56 shrink-0 px-3 py-2 pb-6 space-y-1 overflow-y-auto">
            {all.map((s, i) => {
              const on = s.id === active
              // Rule between "browse a collection" and "take from this device".
              const rule = i > 0 && s.group === 'device' && all[i - 1].group !== 'device'
              return (
                <div key={s.id}>
                {rule && <div className="my-2 mx-3 border-t border-border" />}
                <button onClick={() => { setActive(s.id); setQuery('') }}
                  className="w-full flex items-center gap-3 h-10 px-3 rounded-full text-sm text-left transition-colors"
                  style={{
                    background: on ? 'var(--color-primary-light)' : 'transparent',
                    color:      on ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    fontWeight: on ? 500 : 400,
                  }}>
                  {s.icon}
                  <span className="truncate">{s.label}</span>
                </button>
                </div>
              )
            })}
          </nav>

          <div className="flex-1 min-w-0 overflow-y-auto px-6 py-4 pb-6">
            {Current ? <Current onPick={onPick} query={query} /> : null}
          </div>
        </div>
      </div>
    </div>
  )
}
