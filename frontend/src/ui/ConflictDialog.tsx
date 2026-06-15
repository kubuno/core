import { Copy, Layers } from 'lucide-react'
import { FloatingWindow } from './FloatingWindow'

export type ConflictChoice = 'overwrite' | 'keep_both' | 'cancel'

interface Props {
  type:    'file' | 'folder'
  name:    string
  onChoice: (choice: ConflictChoice) => void
}

export default function ConflictDialog({ type, name, onChoice }: Props) {
  const isFolder    = type === 'folder'
  const actionLabel = isFolder ? 'Fusionner' : 'Écraser'

  return (
    <FloatingWindow
      title="Conflit de nom"
      onClose={() => onChoice('cancel')}
      defaultWidth={400}
      backdrop
    >
      <div className="p-6 flex flex-col gap-5">
        <p className="text-sm text-text-secondary leading-relaxed">
          Un {isFolder ? 'dossier' : 'fichier'} nommé{' '}
          <span className="font-medium text-text-primary">«&nbsp;{name}&nbsp;»</span>{' '}
          existe déjà à cet emplacement.
        </p>

        {/* Option Écraser / Fusionner */}
        <button
          type="button"
          onClick={() => onChoice('overwrite')}
          className="flex items-start gap-3 p-3 rounded-xl border border-border
                     hover:border-primary hover:bg-primary/5 transition-colors text-left group"
        >
          <div className="w-8 h-8 rounded-lg bg-danger/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Layers size={15} className="text-danger" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">{actionLabel}</p>
            <p className="text-xs text-text-tertiary mt-0.5">
              {isFolder
                ? 'Les deux dossiers seront fusionnés. Les fichiers en conflit seront remplacés.'
                : 'Le fichier existant sera remplacé par le nouveau.'}
            </p>
          </div>
        </button>

        {/* Option Conserver les deux */}
        <button
          type="button"
          onClick={() => onChoice('keep_both')}
          className="flex items-start gap-3 p-3 rounded-xl border border-border
                     hover:border-primary hover:bg-primary/5 transition-colors text-left group"
        >
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Copy size={15} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">Conserver les deux</p>
            <p className="text-xs text-text-tertiary mt-0.5">
              Le nouvel élément sera renommé automatiquement (ex.&nbsp;: «&nbsp;{name} (2)&nbsp;»).
            </p>
          </div>
        </button>

        {/* Annuler */}
        <button
          type="button"
          onClick={() => onChoice('cancel')}
          className="self-end text-sm text-text-secondary hover:text-text-primary transition-colors px-2 py-1"
        >
          Annuler
        </button>
      </div>
    </FloatingWindow>
  )
}
