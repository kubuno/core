/**
 * Le fil d'Ariane de l'explorateur : racine avec icône Maison, segments
 * cliquables, dernier segment = dossier courant. Un bouton déroulant en fin de
 * fil permet de sauter directement dans un SOUS-DOSSIER du dossier courant.
 *
 * Depuis l'extraction de la primitive `Breadcrumb` de `@ui`, ce composant ne
 * dessine plus rien lui-même : il traduit un chemin de dossiers en segments et
 * ajoute le seul élément qui lui est propre — le saut vers un enfant. Le rendu,
 * les chevrons, la troncature et l'accessibilité viennent du composant partagé,
 * si bien que la console d'administration et l'explorateur affichent exactement
 * le même fil. Reste la base thémable de la clé `drive.breadcrumb`.
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Folder as FolderIcon, ChevronDown, Home } from 'lucide-react'
import { Breadcrumb, MenuDropdown, type Crumb } from '@ui'
import type { Folder } from '../api'
import { FolderGlyph } from '../FolderGlyph'

export function StorageBreadcrumbBase({ rootName, crumbs, onNavigate, childFolders, onOpenChild, ariaLabel }: {
  rootName: string
  crumbs: Array<{ id: string; name: string }>
  onNavigate: (idx: number) => void            // -1 = racine, sinon index du segment
  childFolders: Folder[]
  onOpenChild: (folder: Folder) => void
  ariaLabel?: string
}) {
  const { t } = useTranslation('drive')
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)

  const items: Crumb[] = [
    { label: rootName, title: rootName, icon: <Home size={16} />, onClick: () => onNavigate(-1) },
    ...crumbs.map((crumb, idx) => ({
      label:   crumb.name,
      title:   crumb.name,
      onClick: () => onNavigate(idx),
    })),
  ]

  return (
    <Breadcrumb
      items={items}
      ariaLabel={ariaLabel}
      // Un chemin de dossiers descend plus profond qu'un menu : on garde six
      // segments avant de replier, contre quatre pour la console.
      maxVisible={6}
      maxSegmentWidth="16rem"
      trailing={childFolders.length > 0 ? (
        <>
          <button
            type="button"
            onClick={e => { const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); setMenu({ x: r.left, y: r.bottom + 4 }) }}
            className="ms-2.5 inline-flex items-center text-text-secondary bg-surface-1 border border-border hover:bg-surface-2 hover:text-text-primary shadow-xs font-medium leading-5 rounded-md text-sm px-2.5 py-1.5 transition-colors focus:outline-none"
          >
            <FolderIcon size={14} className="me-1.5 shrink-0" />
            {t('breadcrumb.go_to', { defaultValue: 'Aller à' })}
            <ChevronDown size={14} className="ms-1.5 shrink-0" />
          </button>
          {menu && (
            <MenuDropdown
              items={childFolders.map(f => ({ type: 'action' as const, label: f.name, icon: <FolderGlyph folder={f} size={15} />, onClick: () => onOpenChild(f) }))}
              pos={{ top: menu.y, left: menu.x }}
              onClose={() => setMenu(null)}
            />
          )}
        </>
      ) : undefined}
    />
  )
}
