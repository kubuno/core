import { useState, useCallback } from 'react'
import type { ConfirmOptions } from '@ui/ConfirmDialog'

interface ConfirmState extends ConfirmOptions {
  resolve: (ok: boolean) => void
}

export function useConfirm() {
  const [state, setState] = useState<ConfirmState | null>(null)

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setState({ ...options, resolve })
    })
  }, [])

  const handleConfirm = useCallback(() => {
    state?.resolve(true)
    setState(null)
  }, [state])

  const handleCancel = useCallback(() => {
    state?.resolve(false)
    setState(null)
  }, [state])

  return { confirm, confirmState: state, handleConfirm, handleCancel }
}
