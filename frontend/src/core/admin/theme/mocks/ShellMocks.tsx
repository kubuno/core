import { KubunoLogo } from '@ui'
import {
  Copy, Download, Folder, House, Info, Pencil, Plus, Search, Share2, Star, Trash2,
} from 'lucide-react'

// ── Core shell mocks (topbar, sidebar, context menu) ───────────────────────────

export function MockTopbar() {
  return (
    <div className="flex items-center gap-3 h-14 px-4 bg-white border border-border rounded-xl">
      <KubunoLogo className="h-6 w-auto shrink-0" />
      <div className="flex-1 max-w-md">
        <div className="flex items-center gap-2 h-9 px-3 rounded-full bg-search-bg text-text-secondary">
          <Search size={16} />
          <span className="text-sm">Rechercher…</span>
        </div>
      </div>
      <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-medium">
        AK
      </div>
    </div>
  )
}

export function MockSidebar() {
  const items = [
    { icon: House, label: 'Accueil', active: true },
    { icon: Folder, label: 'Mon Drive', active: false },
    { icon: Star, label: 'Étoilés', active: false },
    { icon: Trash2, label: 'Corbeille', active: false },
  ]
  return (
    <div className="w-52 p-2 bg-white border border-border rounded-xl">
      <button className="flex items-center gap-2 w-full h-10 px-3 mb-2 rounded-full bg-primary-light text-text-nav-active font-medium text-sm">
        <Plus size={18} /> Nouveau
      </button>
      {items.map(({ icon: Icon, label, active }) => (
        <div
          key={label}
          className={`flex items-center gap-3 h-9 px-3 rounded-full text-sm cursor-pointer
            ${active ? 'bg-primary-light text-text-nav-active font-medium' : 'text-text-secondary hover:bg-surface-2'}`}
        >
          <Icon size={18} /> {label}
        </div>
      ))}
    </div>
  )
}

// Faithful static reproduction of a context menu (cf. @ui MenuDropdown). The real
// MenuDropdown is a floating positioned popup; here it is shown open and inline.
export function MockContextMenu() {
  const item = 'flex items-center gap-3 px-3 py-1.5 text-sm text-text-primary hover:bg-surface-2 cursor-default'
  return (
    <div
      className="w-52 py-1 rounded-lg bg-white border border-border"
      style={{ boxShadow: '0 2px 6px 2px rgba(0,0,0,.12), 0 1px 2px rgba(0,0,0,.18)' }}
    >
      <div className={item}><Download size={15} className="text-text-secondary" /> Télécharger
        <span className="ml-auto text-xs text-text-tertiary">⌘S</span></div>
      <div className={item}><Share2 size={15} className="text-text-secondary" /> Partager</div>
      <div className={item}><Pencil size={15} className="text-text-secondary" /> Renommer</div>
      <div className={item}><Copy size={15} className="text-text-secondary" /> Dupliquer</div>
      <div className="my-1 border-t border-border" />
      <div className={item}><Info size={15} className="text-text-secondary" /> Détails</div>
      <div className="my-1 border-t border-border" />
      <div className="flex items-center gap-3 px-3 py-1.5 text-sm text-danger hover:bg-danger-light cursor-default">
        <Trash2 size={15} /> Supprimer
      </div>
    </div>
  )
}
