// Barre de menus du WorkspaceShell (Fichier / Édition / …), pilotée par données et
// par thème. Déplacée depuis `paintsharp/ui/MenuBar` pour être partagée par toutes les
// applications avancées (Office + PaintSharp). L'hôte fournit la liste des menus, chacun
// avec ses items (ou des séparateurs 'sep').
import { useCallback, useState } from 'react'
import { MENU_ATTR, useMenuDismiss } from '../../../ui/useMenuDismiss'

export type MenuItem = { label: string; onClick?: () => void; disabled?: boolean; shortcut?: string } | 'sep'
type MenuTheme = { header: string; panel: string; border: string; active: string; text: string; textDim: string }

export function MenuBar({ menus, C }: {
  menus: { label: string; items: MenuItem[] }[]
  C: MenuTheme
}) {
  const [open, setOpen] = useState<number | null>(null)
  const close = useCallback(() => setOpen(null), [])
  useMenuDismiss(open !== null, close)
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
            <div {...{ [MENU_ATTR]: '' }} className="kb-frosted kb-frosted-dark absolute left-0 top-full min-w-48" style={{ zIndex:50 }}>
              <div className="kb-frost-layer" aria-hidden />
              <div style={{ padding:5 }}>
              {m.items.map((it, j) => it === 'sep' ? (
                <div key={j} style={{ height:1, background:C.border, margin:'5px 6px' }} />
              ) : (
                <button key={j} disabled={it.disabled}
                        onClick={() => { setOpen(null); it.onClick?.() }}
                        className="flex items-center justify-between w-full px-2.5 h-7 text-left text-xs whitespace-nowrap disabled:opacity-35"
                        style={{ color:C.text, background:'transparent', borderRadius:6 }}
                        onMouseEnter={e => { if(!it.disabled)(e.currentTarget as HTMLElement).style.background = C.active }}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                  <span className="whitespace-nowrap">{it.label}</span>
                  {it.shortcut && <span className="ml-8 whitespace-nowrap" style={{ color:C.textDim }}>{it.shortcut}</span>}
                </button>
              ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
