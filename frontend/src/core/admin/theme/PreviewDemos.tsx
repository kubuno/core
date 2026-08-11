import { useRef, useState, type ReactNode } from 'react'
import { AnchoredPopover, PortalHostContext, ResizeHandle, StartPage } from '@ui'

/** Preview interactions are inert: every callback resolves to a no-op. */
export const noop = () => {}

// Bounded stage that CONFINES overlay primitives (FloatingWindow, dialogs,
// AnchoredPopover) via PortalHostContext: they portal INTO this box and switch to
// host-relative `absolute` positioning, so they cannot escape it. The box is
// `relative; overflow:hidden`; children mount only once the host node exists (so
// nothing flashes into <body> first). Closing is wired to no-ops for the preview.
export function PreviewStage({ title, width = 340, height = 260, children }:
  { title: string; width?: number; height?: number; children: ReactNode }) {
  const [node, setNode] = useState<HTMLDivElement | null>(null)
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-text-tertiary">{title}</span>
      <div
        ref={setNode}
        className="relative overflow-hidden rounded-xl border border-border bg-surface-1"
        style={{ width, height }}
      >
        <PortalHostContext.Provider value={node}>
          {node && children}
        </PortalHostContext.Provider>
      </div>
    </div>
  )
}

export function AnchoredDemo() {
  const ref = useRef<HTMLButtonElement>(null)
  return (
    <div className="p-3">
      <button ref={ref} className="px-3 py-1.5 text-sm rounded-lg border border-border bg-white text-text-primary">
        Élément ancré
      </button>
      <AnchoredPopover anchorRef={ref} open onClose={noop}>
        <div className="w-44 py-1 rounded-lg bg-white border border-border shadow-[0_2px_6px_2px_rgba(0,0,0,.12)]">
          {['Renommer', 'Déplacer', 'Dupliquer', 'Supprimer'].map((l) => (
            <div key={l} className="px-3 py-1.5 text-sm text-text-primary hover:bg-surface-2 cursor-default">{l}</div>
          ))}
        </div>
      </AnchoredPopover>
    </div>
  )
}

export function ResizeHandleDemo() {
  const [w, setW] = useState(120)
  return (
    <div className="relative flex h-24 rounded-xl border border-border overflow-hidden bg-white" style={{ width: 300 }}>
      <div className="h-full bg-surface-1 flex items-center justify-center text-xs text-text-tertiary" style={{ width: w }}>
        Panneau
      </div>
      <ResizeHandle position={w} onResize={setW} min={80} max={220} />
      <div className="flex-1 h-full flex items-center justify-center text-xs text-text-tertiary">Contenu</div>
    </div>
  )
}

export function StartPageDemo() {
  return (
    <div className="rounded-xl border border-border overflow-hidden bg-white" style={{ height: 300 }}>
      <StartPage
        recentItems={[
          { id: '1', name: 'Rapport annuel.docx', subtitle: '30 juin 2026', onClick: noop },
          { id: '2', name: 'Budget.xlsx', subtitle: '28 juin 2026', onClick: noop },
          { id: '3', name: 'Présentation.pptx', subtitle: '21 juin 2026', onClick: noop },
        ]}
        tabs={[
          {
            id: 'modeles',
            label: 'Modèles',
            content: (
              <div className="grid grid-cols-3 gap-3 p-4">
                {['Vierge', 'CV', 'Lettre', 'Facture', 'Rapport', 'Affiche'].map((m) => (
                  <div key={m} className="aspect-[3/4] rounded-lg border border-border bg-surface-1 flex items-end p-2 text-xs text-text-secondary hover:border-primary cursor-pointer">
                    {m}
                  </div>
                ))}
              </div>
            ),
          },
          { id: 'recents', label: 'Récents', content: <div className="p-4 text-sm text-text-tertiary">Vos documents récents…</div> },
        ]}
      />
    </div>
  )
}
