// Barre de menus du WorkspaceShell (Fichier / Édition / …), pilotée par données et
// par thème. Déplacée depuis `paintsharp/ui/MenuBar` pour être partagée par toutes les
// applications avancées (Office + PaintSharp). L'hôte fournit la liste des menus, chacun
// avec ses items (ou des séparateurs 'sep').
import { useState } from 'react'

export type MenuItem = { label: string; onClick?: () => void; disabled?: boolean; shortcut?: string } | 'sep'
type MenuTheme = { header: string; panel: string; border: string; active: string; text: string; textDim: string }

export function MenuBar({ menus, C }: {
  menus: { label: string; items: MenuItem[] }[]
  C: MenuTheme
}) {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <div className="flex items-center px-1 flex-shrink-0 relative select-none"
         style={{ height:24, background:C.header, borderBottom:`1px solid ${C.border}`, fontSize:12, zIndex:60 }}>
      {open !== null && <div className="fixed inset-0" style={{ zIndex:40 }} onClick={() => setOpen(null)} />}
      {menus.map((m, i) => (
        <div key={m.label} className="relative" style={{ zIndex:50 }}>
          <button onClick={() => setOpen(open === i ? null : i)}
                  onMouseEnter={() => { if (open !== null) setOpen(i) }}
                  className="px-2.5 h-6 rounded-sm whitespace-nowrap"
                  style={{ color:C.text, background: open===i ? C.active : 'transparent' }}>
            {m.label}
          </button>
          {open === i && (
            <div className="absolute left-0 top-full py-1 min-w-48"
                 style={{ background:C.panel, border:`1px solid ${C.border}`, boxShadow:'0 8px 24px rgba(0,0,0,.45)', zIndex:50 }}>
              {m.items.map((it, j) => it === 'sep' ? (
                <div key={j} style={{ height:1, background:C.border, margin:'4px 6px' }} />
              ) : (
                <button key={j} disabled={it.disabled}
                        onClick={() => { setOpen(null); it.onClick?.() }}
                        className="flex items-center justify-between w-full px-3 h-7 text-left text-[12px] whitespace-nowrap disabled:opacity-35"
                        style={{ color:C.text, background:'transparent' }}
                        onMouseEnter={e => { if(!it.disabled)(e.currentTarget as HTMLElement).style.background = C.active }}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                  <span className="whitespace-nowrap">{it.label}</span>
                  {it.shortcut && <span className="ml-8 text-[10px] whitespace-nowrap" style={{ color:C.textDim }}>{it.shortcut}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
