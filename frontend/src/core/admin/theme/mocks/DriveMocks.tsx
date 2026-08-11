import {
  CheckCircle2, ChevronRight, FileText, Folder, Home, Loader2, MoreVertical, Star,
} from 'lucide-react'

// ── Faithful mocks of real Drive objects (cf. drive/StorageExplorer.tsx) ───────

export function MockFileCard({ name = 'Rapport.pdf', ext = 'PDF', selected = false }) {
  return (
    <div
      className={`group relative rounded-xl border min-w-0 select-none transition-all w-44
        ${selected
          ? 'border-primary ring-2 ring-primary/20 bg-[#ddeafc]'
          : 'border-[#e8eaed] bg-surface-1 hover:border-border hover:bg-[#e4ecf7]'}`}
    >
      <div className="flex items-center gap-2 px-3 h-10">
        <FileText size={18} className="shrink-0 text-text-secondary" />
        <span className="text-xs font-medium text-text-primary truncate flex-1">{name}</span>
        <Star size={12} className="shrink-0 fill-yellow-400 text-yellow-400" />
        <MoreVertical size={14} className="shrink-0 text-text-secondary opacity-0 group-hover:opacity-100" />
      </div>
      <div className="relative overflow-hidden rounded-lg bg-white mx-2 mb-2 h-24 flex items-center justify-center">
        <FileText size={40} className="text-text-tertiary" />
      </div>
      {/* Extension badge — a CARD-level child (not nested in the white preview)
          using `background-color: inherit`, so its padding ring takes the card's
          own background in every state and carves a seamless notch into the
          preview corner. Mirrors the real FileCard (cf. drive/StorageExplorer). */}
      <span
        className="absolute z-10 inline-block pointer-events-none"
        style={{ bottom: '4px', right: '4px', padding: '7px', borderRadius: '12px 0 0 0',
          backgroundColor: 'inherit',
          transition: 'background-color 150ms cubic-bezier(0.4, 0, 0.2, 1)' }}
      >
        <span
          className="block font-semibold uppercase"
          style={{ fontSize: '10px', lineHeight: 1, padding: '2px 5px', letterSpacing: '0.04em',
            borderRadius: '6px', color: 'var(--color-text-secondary)' }}
        >
          {ext}
        </span>
      </span>
    </div>
  )
}

export function MockFolderCard({ name = 'Documents', selected = false }) {
  return (
    <div
      className={`group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all select-none w-44
        ${selected
          ? 'border-primary ring-2 ring-primary/20 bg-[#c9defa]'
          : 'border-[#e8eaed] bg-[#f3f4f5] hover:border-border hover:bg-[#e4ecf7]'}`}
    >
      <Folder size={20} className="shrink-0 text-text-secondary" />
      <span className="text-sm text-text-primary truncate flex-1">{name}</span>
      <MoreVertical size={14} className="shrink-0 text-text-secondary opacity-0 group-hover:opacity-100" />
    </div>
  )
}

export function MockFileRow({ name = 'Photo-2026.jpg', size = '2,4 Mo', selected = false }) {
  return (
    <div
      className={`group relative flex items-center gap-3 px-3 py-2 transition-colors select-none border-l-[3px]
        ${selected ? 'bg-[#e8f0fe] border-primary' : 'bg-white border-transparent hover:bg-surface-1'}`}
    >
      <div className="shrink-0 w-9 h-9 flex items-center justify-center rounded overflow-hidden bg-surface-2">
        <FileText size={16} className="text-text-tertiary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary truncate">{name}</p>
      </div>
      <span className="text-xs text-text-tertiary shrink-0 w-28 text-right">30 juin 2026</span>
      <span className="text-xs text-text-tertiary shrink-0 w-20 text-right">{size}</span>
      <MoreVertical size={14} className="shrink-0 text-text-secondary opacity-0 group-hover:opacity-100" />
    </div>
  )
}

export function MockBreadcrumb() {
  return (
    <nav className="flex items-center min-w-0">
      <ol className="inline-flex items-center gap-1.5 flex-wrap min-w-0">
        <li className="inline-flex items-center">
          <button className="inline-flex items-center text-sm font-medium text-text-secondary hover:text-primary transition-colors">
            <Home size={16} className="me-1.5 shrink-0" />
            <span>Mon Drive</span>
          </button>
        </li>
        <li className="inline-flex items-center gap-1.5">
          <ChevronRight size={14} className="text-text-tertiary shrink-0" />
          <span className="text-sm font-medium text-text-primary">Documents</span>
        </li>
      </ol>
    </nav>
  )
}

export function MockUploadPanel() {
  return (
    <div className="w-72 bg-white rounded-xl shadow-xl border border-border overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-surface-1 border-b border-border">
        <Loader2 size={14} className="animate-spin text-primary" />
        <span className="text-sm font-medium text-text-primary">Import en cours…</span>
      </div>
      <ul className="divide-y divide-border">
        <li className="flex items-center gap-3 px-4 py-2.5">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-text-primary truncate">presentation.pptx</p>
            <div className="mt-1 h-1 w-full bg-surface-2 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: '64%' }} />
            </div>
          </div>
        </li>
        <li className="flex items-center gap-3 px-4 py-2.5">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-text-primary truncate">notes.txt</p>
          </div>
          <CheckCircle2 size={14} className="text-success shrink-0" />
        </li>
      </ul>
    </div>
  )
}
