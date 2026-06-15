import { useEffect, useState } from 'react'
import { Trash2, Undo2 } from 'lucide-react'
import { usePendingDeletionStore, type PendingBatch } from '../store/pendingDeletionStore'

// Hôte global (rendu une seule fois dans App) : empile en bas à gauche les toasts
// des suppressions différées, chacun avec une barre de progression de 5 s et un
// bouton « Annuler ».

function DeletionToast({ batch, onCancel }: { batch: PendingBatch; onCancel: () => void }) {
  // Barre qui se vide de 100 % → 0 % en `duration` ms (transition CSS).
  const [width, setWidth] = useState(100)
  useEffect(() => {
    const r = requestAnimationFrame(() => setWidth(0))
    return () => cancelAnimationFrame(r)
  }, [])

  const isPerm = batch.kind === 'permanent'
  const accent = isPerm ? 'text-red-600'   : 'text-purple-600'
  const bar    = isPerm ? 'bg-red-500'      : 'bg-purple-500'
  const ring   = isPerm ? 'border-red-200'  : 'border-purple-200'

  return (
    <div className={`w-80 rounded-xl border ${ring} bg-surface-0 shadow-lg overflow-hidden`}>
      <div className="flex items-center gap-3 px-4 py-3">
        <Trash2 size={18} className={accent} />
        <span className="flex-1 text-sm text-text-primary truncate">{batch.label}</span>
        <button
          onClick={onCancel}
          className={`flex items-center gap-1 text-sm font-medium ${accent} hover:underline shrink-0`}
        >
          <Undo2 size={14} /> {batch.undoLabel}
        </button>
      </div>
      <div className="h-1 bg-surface-2">
        <div
          className={`h-full ${bar}`}
          style={{ width: `${width}%`, transition: `width ${batch.duration}ms linear` }}
        />
      </div>
    </div>
  )
}

export default function PendingDeletionHost() {
  const batches = usePendingDeletionStore(s => s.batches)
  const cancel  = usePendingDeletionStore(s => s.cancel)

  if (batches.length === 0) return null

  return (
    <div className="fixed bottom-4 left-4 z-[100] flex flex-col gap-2">
      {batches.map(b => (
        <DeletionToast key={b.id} batch={b} onCancel={() => cancel(b.id)} />
      ))}
    </div>
  )
}
