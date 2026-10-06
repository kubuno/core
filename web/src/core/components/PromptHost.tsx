import { usePromptStore } from '../store/promptStore'
import PromptDialog from '@ui/PromptDialog'

/** Hôte global rendu une seule fois ; affiche le PromptDialog déclenché via `prompt()`. */
export default function PromptHost() {
  const current = usePromptStore(s => s.current)
  const confirm = usePromptStore(s => s.confirm)
  const cancel  = usePromptStore(s => s.cancel)

  if (!current) return null

  return <PromptDialog {...current} onConfirm={confirm} onCancel={cancel} />
}
