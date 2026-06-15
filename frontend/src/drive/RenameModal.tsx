import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { filesApi, type FileItem, type Folder } from './api'
import { FloatingWindow } from '@ui'
import { ConflictDialog, type ConflictChoice } from '@ui'
import { Button, Input } from '@ui'

type Target =
  | { type: 'folder'; item: Folder }
  | { type: 'file';   item: FileItem }

interface Props {
  target:        Target | null
  onClose:       () => void
  /** Noms des éléments dans le même dossier (pour détecter les conflits côté client) */
  siblingNames?: string[]
}

interface MutateArgs {
  overwrite: boolean
  /** strict=true : le serveur retourne 409 si conflit au lieu d'auto-renommer.
   *  Utilisé lors du premier envoi pour attraper les conflits dans les dossiers partagés
   *  dont le cache client serait périmé. */
  strict: boolean
}

export default function RenameModal({ target, onClose, siblingNames = [] }: Props) {
  const { t } = useTranslation('drive')
  const [name, setName]         = useState('')
  const [conflict, setConflict] = useState<string | null>(null)
  const qc                      = useQueryClient()

  useEffect(() => {
    if (target) { setName(target.item.name); setConflict(null) }
  }, [target])

  const { mutate, isPending, error, reset } = useMutation<unknown, { message: string; code: string }, MutateArgs>({
    mutationFn: ({ overwrite, strict }) =>
      target?.type === 'folder'
        ? filesApi.renameFolder(target.item.id, name.trim(), overwrite, strict)
        : filesApi.renameFile(target!.item.id, name.trim(), overwrite, strict),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['folders'] })
      qc.invalidateQueries({ queryKey: ['files'] })
      onClose()
    },
    onError: (err) => {
      // Le serveur a détecté un conflit que le cache client avait raté (dossier partagé)
      if (err.code === 'CONFLICT') {
        const conflictingName = err.message.replace(/^Conflit: /, '')
        setConflict(conflictingName)
      }
    },
  })

  const handleClose = () => { reset(); setConflict(null); onClose() }

  const handleSubmit = () => {
    const trimmed = name.trim()
    if (!trimmed) return

    // Pas de changement de nom → fermer directement
    if (trimmed === target?.item.name) { onClose(); return }

    // Conflit détecté localement (cache à jour) → demander à l'utilisateur sans aller au serveur
    const hasConflict = siblingNames.some(n => n === trimmed && n !== target?.item.name)
    if (hasConflict) {
      setConflict(trimmed)
      return
    }

    // Sinon : envoyer avec strict=true pour que le serveur détecte un éventuel conflit concurrent
    mutate({ overwrite: false, strict: true })
  }

  const handleConflictChoice = (choice: ConflictChoice) => {
    setConflict(null)
    if (choice === 'cancel') return
    // strict=false car l'utilisateur a déjà choisi : pas besoin d'un nouveau 409
    mutate({ overwrite: choice === 'overwrite', strict: false })
  }

  if (!target) return null

  // Erreurs autres que conflit (conflit géré via setConflict + onError)
  const displayError = error && error.code !== 'CONFLICT' ? error.message : null

  return (
    <>
      <FloatingWindow
        title={t('common.rename')}
        icon={<Pencil size={15} className="text-primary" />}
        onClose={handleClose}
        defaultWidth={380}
        backdrop={!conflict}
      >
        <form
          onSubmit={e => { e.preventDefault(); handleSubmit() }}
          className="p-5 space-y-4"
        >
          <Input
            autoFocus
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); reset() }}
            maxLength={255}
          />
          {displayError && (
            <p className="text-xs text-danger">{displayError}</p>
          )}
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" onClick={handleClose}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={!name.trim()} loading={isPending}>{t('common.rename')}</Button>
          </div>
        </form>
      </FloatingWindow>

      {conflict && (
        <ConflictDialog
          type={target.type}
          name={conflict}
          onChoice={handleConflictChoice}
        />
      )}
    </>
  )
}
