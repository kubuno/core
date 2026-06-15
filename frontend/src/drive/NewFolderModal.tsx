import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FolderPlus } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { filesApi } from './api'
import { FloatingWindow } from '@ui'
import { Button, Input } from '@ui'

interface Props {
  open:     boolean
  onClose:  () => void
  parentId: string | null
}

export default function NewFolderModal({ open, onClose, parentId }: Props) {
  const { t } = useTranslation('drive')
  const [name, setName] = useState('')
  const qc = useQueryClient()

  const { mutate, isPending, error } = useMutation({
    mutationFn: () => filesApi.createFolder(name.trim(), parentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['folders'] })
      setName('')
      onClose()
    },
  })

  if (!open) return null

  return (
    <FloatingWindow
      title={t('newfolder.title')}
      icon={<FolderPlus size={17} className="text-primary" />}
      onClose={onClose}
      defaultWidth={380}
      backdrop
    >
      <form
        onSubmit={e => { e.preventDefault(); if (name.trim()) mutate() }}
        className="p-5 space-y-4"
      >
        <Input
          autoFocus
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={t('newfolder.placeholder')}
          maxLength={255}
        />
        {error && (
          <p className="text-xs text-danger">{(error as Error).message}</p>
        )}
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" disabled={!name.trim()} loading={isPending}>{t('common.create')}</Button>
        </div>
      </form>
    </FloatingWindow>
  )
}
