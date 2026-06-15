import { useState, useCallback } from 'react'
import type { PromptOptions } from '@ui/PromptDialog'

interface PromptState extends PromptOptions {
  resolve: (value: string | null) => void
}

export function usePrompt() {
  const [state, setState] = useState<PromptState | null>(null)

  /** Affiche le dialog et résout avec la valeur saisie, ou `null` si annulé. */
  const prompt = useCallback((options: PromptOptions): Promise<string | null> => {
    return new Promise<string | null>((resolve) => {
      setState({ ...options, resolve })
    })
  }, [])

  const handleConfirm = useCallback((value: string) => {
    state?.resolve(value)
    setState(null)
  }, [state])

  const handleCancel = useCallback(() => {
    state?.resolve(null)
    setState(null)
  }, [state])

  return { prompt, promptState: state, handleConfirm, handleCancel }
}
