import { useEffect, useRef } from 'react'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { FloatingWindow } from './FloatingWindow'

export type ConfirmVariant = 'danger' | 'warning' | 'default'

export interface ConfirmOptions {
  title:         string
  message:       string
  confirmLabel?: string
  cancelLabel?:  string
  variant?:      ConfirmVariant
  /** Masque le bouton « Annuler » → dialogue d'information à un seul bouton. */
  hideCancel?:   boolean
}

interface Props extends ConfirmOptions {
  onConfirm: () => void
  onCancel:  () => void
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel  = 'Annuler',
  variant      = 'default',
  hideCancel   = false,
  onConfirm,
  onCancel,
}: Props) {
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => { confirmRef.current?.focus() }, [])

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Enter') onConfirm() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onConfirm])

  const iconBg    = variant === 'danger'  ? 'bg-red-100'    : variant === 'warning' ? 'bg-amber-100'  : 'bg-gray-100'
  const iconColor = variant === 'danger'  ? 'text-red-600'  : variant === 'warning' ? 'text-amber-600' : 'text-gray-600'
  const confirmBtn = variant === 'danger'
    ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white'
    : variant === 'warning'
    ? 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-400 text-white'
    : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white'

  return (
    <FloatingWindow
      title={title}
      onClose={onCancel}
      defaultWidth={380}
      backdrop
    >
      <div className="p-6 flex flex-col gap-4">
        {/* Icône */}
        <div className={`w-12 h-12 rounded-full ${iconBg} flex items-center justify-center flex-shrink-0`}>
          {variant === 'danger'
            ? <Trash2        className={`w-6 h-6 ${iconColor}`} />
            : <AlertTriangle className={`w-6 h-6 ${iconColor}`} />
          }
        </div>

        {/* Message */}
        <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-line">{message}</p>

        {/* Actions */}
        <div className="flex gap-3 mt-1">
          {!hideCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300
                       rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors whitespace-nowrap"
          >
            {cancelLabel}
          </button>
          )}
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg focus:outline-none
                        focus:ring-2 focus:ring-offset-1 transition-colors whitespace-nowrap ${confirmBtn}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </FloatingWindow>
  )
}
