import { useEffect } from 'react'
import { CheckCircle2, XCircle, X, Loader2, Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useFilesStore } from './store'

export default function UploadPanel() {
  const { t } = useTranslation('drive')
  const { uploads, clearDoneUploads } = useFilesStore()

  const active   = uploads.filter(u => u.status === 'uploading').length
  const done     = uploads.filter(u => u.status === 'done').length
  const errors   = uploads.filter(u => u.status === 'error').length

  // Importation entièrement terminée (rien en cours, aucune erreur) → le popup se
  // ferme tout seul au bout de 10 s. Un nouvel upload relance/annule le minuteur.
  const allDone = uploads.length > 0 && active === 0 && errors === 0
  useEffect(() => {
    if (!allDone) return
    const timer = setTimeout(() => clearDoneUploads(), 10_000)
    return () => clearTimeout(timer)
  }, [allDone, clearDoneUploads])

  if (uploads.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-white rounded-xl shadow-xl border border-border overflow-hidden">
      {/* En-tête */}
      <div className="flex items-center justify-between px-4 py-3 bg-surface-1 border-b border-border">
        <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
          {active > 0
            ? <Loader2 size={14} className="animate-spin text-primary" />
            : <Upload size={14} className="text-text-secondary" />
          }
          {active > 0
            ? t('upload.uploading', { count: active })
            : `${t('upload.done', { count: done })}${errors > 0 ? ` · ${t('upload.errors', { count: errors })}` : ''}`
          }
        </div>
        {active === 0 && (
          <button
            onClick={clearDoneUploads}
            className="text-text-tertiary hover:text-text-primary p-0.5 rounded"
            title={t('common.close')}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Liste des uploads */}
      <ul className="max-h-64 overflow-y-auto divide-y divide-border">
        {uploads.map(u => (
          <li key={u.id} className="flex items-center gap-3 px-4 py-2.5">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-text-primary truncate">{u.name}</p>
              {u.status === 'uploading' && (
                <div className="mt-1 h-1 w-full bg-surface-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${u.progress}%` }}
                  />
                </div>
              )}
              {u.status === 'error' && (
                <p className="text-xs text-danger mt-0.5 truncate">{u.error ?? t('common.error')}</p>
              )}
            </div>
            <div className="shrink-0">
              {u.status === 'uploading' && (
                <span className="text-xs text-text-tertiary">{u.progress}%</span>
              )}
              {u.status === 'done' && (
                <CheckCircle2 size={14} className="text-success" />
              )}
              {u.status === 'error' && (
                <XCircle size={14} className="text-danger" />
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
