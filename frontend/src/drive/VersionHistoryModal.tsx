import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Clock, MessageSquare, RotateCcw, Trash2 } from 'lucide-react'
import { filesApi, FileItem, FileVersion, formatSize } from './api'
import { FloatingWindow } from '@ui'
import { Button, Input } from '@ui'

interface Props {
  file:    FileItem | null
  onClose: () => void
}

export default function VersionHistoryModal({ file, onClose }: Props) {
  const { t } = useTranslation('drive')
  const qc = useQueryClient()
  const [comment, setComment] = useState('')
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['file-versions', file?.id],
    queryFn:  () => filesApi.listVersions(file!.id),
    enabled:  !!file,
  })

  const createMut = useMutation({
    mutationFn: () => filesApi.createVersion(file!.id, comment || undefined),
    onSuccess:  () => {
      setComment('')
      qc.invalidateQueries({ queryKey: ['file-versions', file?.id] })
    },
  })

  const restoreMut = useMutation({
    mutationFn: (versionId: string) => filesApi.restoreVersion(file!.id, versionId),
    onSuccess: () => {
      setConfirmRestore(null)
      qc.invalidateQueries({ queryKey: ['file-versions', file?.id] })
      qc.invalidateQueries({ queryKey: ['files'] })
    },
  })

  const deleteMut = useMutation({
    mutationFn: (versionId: string) => filesApi.deleteVersion(file!.id, versionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['file-versions', file?.id] }),
  })

  if (!file) return null

  const versions = data?.versions ?? []

  return (
    <FloatingWindow
      title={
        <span>
          <span className="font-semibold">{file.name}</span>
          <span className="ml-2 text-xs font-normal text-text-tertiary">{t('version.title')}</span>
        </span>
      }
      icon={<Clock size={16} className="text-primary" />}
      onClose={onClose}
      defaultWidth={520}
      defaultHeight={560}
      resizable
      backdrop
    >
      <div className="flex flex-col min-h-0 flex-1">
        {/* Créer un snapshot */}
        <div className="px-5 py-3 border-b border-border bg-surface-1 flex-shrink-0">
          <p className="text-xs font-medium text-text-secondary mb-2 uppercase tracking-wide">
            {t('version.create_now')}
          </p>
          <div className="flex gap-2 items-start">
            <div className="flex-1">
              <Input
                type="text"
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder={t('version.comment_ph')}
                onKeyDown={e => { if (e.key === 'Enter') createMut.mutate() }}
              />
            </div>
            <Button size="sm" onClick={() => createMut.mutate()} loading={createMut.isPending}>
              {t('common.create')}
            </Button>
          </div>
        </div>

        {/* Liste */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
          {isLoading && (
            <p className="text-sm text-text-secondary text-center py-8">{t('common.loading')}</p>
          )}
          {!isLoading && versions.length === 0 && (
            <div className="text-center py-10">
              <Clock size={36} className="mx-auto text-border mb-2" />
              <p className="text-sm text-text-secondary">{t('version.empty')}</p>
              <p className="text-xs text-text-tertiary mt-1">
                {t('version.empty_hint')}
              </p>
            </div>
          )}
          {versions.map((v: FileVersion) => (
            <VersionRow
              key={v.id}
              version={v}
              confirmingRestore={confirmRestore === v.id}
              onRequestRestore={() => setConfirmRestore(v.id)}
              onCancelRestore={() => setConfirmRestore(null)}
              onConfirmRestore={() => restoreMut.mutate(v.id)}
              onDelete={() => deleteMut.mutate(v.id)}
              isRestoring={restoreMut.isPending && confirmRestore === v.id}
              isDeleting={deleteMut.isPending}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border flex-shrink-0">
          <p className="text-xs text-text-tertiary">
            {t('version.count', { count: versions.length })}
          </p>
        </div>
      </div>
    </FloatingWindow>
  )
}

function VersionRow({
  version, confirmingRestore,
  onRequestRestore, onCancelRestore, onConfirmRestore,
  onDelete, isRestoring, isDeleting,
}: {
  version:           FileVersion
  confirmingRestore: boolean
  onRequestRestore:  () => void
  onCancelRestore:   () => void
  onConfirmRestore:  () => void
  onDelete:          () => void
  isRestoring:       boolean
  isDeleting:        boolean
}) {
  const { t, i18n } = useTranslation('drive')
  const date = new Date(version.created_at)

  return (
    <div className="border border-border rounded-lg px-4 py-3 hover:border-primary/40 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-primary bg-primary/10 rounded px-1.5 py-0.5">
              v{version.version_number}
            </span>
            <span className="text-xs text-text-secondary">
              {date.toLocaleDateString(i18n.language, { day: 'numeric', month: 'short', year: 'numeric' })}{' '}
              {t('version.at')} {date.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          {version.comment && (
            <div className="flex items-start gap-1 mt-1.5">
              <MessageSquare size={11} className="text-text-tertiary mt-0.5 shrink-0" />
              <p className="text-xs text-text-secondary">{version.comment}</p>
            </div>
          )}
          <p className="text-xs text-text-tertiary mt-1">{formatSize(version.size_bytes)}</p>
        </div>
        {!confirmingRestore ? (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onRequestRestore}
              title={t('version.restore_title')}
              className="p-1.5 rounded hover:bg-surface-2 text-text-secondary hover:text-primary transition-colors"
            >
              <RotateCcw size={14} />
            </button>
            <button
              onClick={onDelete}
              disabled={isDeleting}
              title={t('version.delete_title')}
              className="p-1.5 rounded hover:bg-danger/10 text-text-secondary hover:text-danger transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-text-secondary">{t('version.restore_q')}</span>
            <Button size="sm" onClick={onConfirmRestore} loading={isRestoring}>{t('common.yes')}</Button>
            <Button size="sm" variant="secondary" onClick={onCancelRestore}>{t('common.no')}</Button>
          </div>
        )}
      </div>
    </div>
  )
}
