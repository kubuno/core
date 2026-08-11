import type { ReactNode } from 'react'
import { Copy, FileText, Folder, Pencil } from 'lucide-react'

// Faithful static reproduction of the Office ribbon chrome (cf. office Ribbon.tsx).
// Consumes the SAME `--kbn-ws-*` / `--kbn-office-*` CSS variables with the SAME
// fallbacks as the real components, so the preview shows exactly how a theme
// re-skins the ribbon (unified tab strip, dark surfaces, unified accents…).
export default function MockRibbon() {
  const smallBtn = (icon: ReactNode, label: string, active = false) => (
    <div
      className="flex items-center h-[22px] px-1.5 gap-1 rounded text-[11px] whitespace-nowrap cursor-default"
      style={active
        ? { background: 'var(--kbn-office-item-active-bg, #1a73e822)', color: 'var(--kbn-office-item-active-text, #1a73e8)' }
        : { color: 'var(--kbn-ws-text, #202124)' }}
    >
      <span className="flex items-center justify-center w-4 h-4">{icon}</span>{label}
    </div>
  )
  const groupLabel = { color: 'var(--kbn-ws-text-dim, #5f6368)' }
  const sep = { width: 1, background: 'var(--kbn-ws-border, #dadce0)' }
  return (
    <div className="rounded-lg overflow-hidden border" style={{ borderColor: 'var(--kbn-ws-border, #dadce0)' }}>
      {/* Tab strip (per-app tone, theme-overridable) */}
      <div className="flex items-end gap-1 px-2 pt-1.5" style={{ height: 34, background: 'var(--kbn-office-tabstrip, #1557b0)' }}>
        <div className="px-3.5 h-[26px] flex items-center text-xs font-semibold rounded-t-lg"
          style={{ background: 'var(--kbn-office-file-accent, #3f7dd0)', color: 'var(--kbn-office-file-accent-text, #fff)' }}>
          Fichier
        </div>
        <div className="px-3.5 h-[26px] flex items-center text-xs font-medium rounded-t-lg"
          style={{ background: 'var(--kbn-ws-bg, #ffffff)', color: 'var(--kbn-office-tab-active-text, #1557b0)' }}>
          Accueil
        </div>
        {['Insertion', 'Mise en page', 'Affichage'].map((l) => (
          <div key={l} className="px-3.5 h-[26px] flex items-center text-xs font-medium rounded-t-lg"
            style={{ color: 'var(--kbn-office-tabstrip-text, #ffffff)' }}>
            {l}
          </div>
        ))}
      </div>
      {/* Groups row */}
      <div className="flex items-stretch px-2" style={{ height: 84, background: 'var(--kbn-ws-bg, #ffffff)' }}>
        <div className="flex flex-col justify-between px-2 py-1">
          <div className="flex flex-col justify-center gap-0.5 flex-1">
            {smallBtn(<Copy size={13} />, 'Copier')}
            {smallBtn(<Pencil size={13} />, 'Coller')}
          </div>
          <div className="text-[10px] text-center whitespace-nowrap" style={groupLabel}>Presse-papiers</div>
        </div>
        <div className="self-stretch my-2" style={sep} />
        <div className="flex flex-col justify-between px-2 py-1">
          <div className="flex items-stretch gap-0.5 flex-1">
            <div className="flex flex-col justify-center gap-0.5">
              {smallBtn(<span className="font-bold text-xs">G</span>, 'Gras', true)}
              {smallBtn(<span className="italic text-xs">I</span>, 'Italique')}
            </div>
            <div className="flex flex-col justify-center gap-0.5">
              {smallBtn(<span className="underline text-xs">S</span>, 'Souligné')}
              {smallBtn(<FileText size={13} />, 'Styles')}
            </div>
          </div>
          <div className="text-[10px] text-center whitespace-nowrap" style={groupLabel}>Police</div>
        </div>
        <div className="self-stretch my-2" style={sep} />
        <div className="flex flex-col justify-between px-2 py-1">
          <div className="flex items-center justify-center flex-1">
            <div className="flex flex-col w-14 items-center justify-center gap-1 rounded cursor-default"
              style={{ color: 'var(--kbn-ws-text, #202124)' }}>
              <Folder size={22} />
              <span className="text-[10px] leading-tight text-center">Insérer</span>
            </div>
          </div>
          <div className="text-[10px] text-center whitespace-nowrap" style={groupLabel}>Objets</div>
        </div>
      </div>
      {/* Status bar */}
      <div className="flex items-center justify-between px-3 text-[11px]"
        style={{ height: 22, background: 'var(--kbn-ws-status, #f8f9fa)', color: 'var(--kbn-ws-text-dim, #5f6368)', borderTop: '1px solid var(--kbn-ws-border, #dadce0)' }}>
        <span>Page 1 sur 3 · 428 mots</span>
        <span>100 %</span>
      </div>
    </div>
  )
}
