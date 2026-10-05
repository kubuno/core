import { useState } from 'react'

interface Outcome { sessions: number }

/** An early return whose block computes constants first. */
export function Branch() {
  const [outcome] = useState<Outcome | null>(null)
  if (outcome) {
    const sessions = outcome.sessions
    return <p className="text-sm">{sessions}</p>
  }
  return <p className="text-sm">none</p>
}
