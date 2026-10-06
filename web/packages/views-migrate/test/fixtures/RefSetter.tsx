import { useState } from 'react'

/** A state setter given as a `ref` callback (inside a part): bound once, or the ref would update without end. */
export function RefSetter({ width }: { width: number }) {
  const [node, setNode] = useState<HTMLDivElement | null>(null)
  return (
    <div>
      <div ref={setNode} style={{ width }}>{node ? 'ready' : 'waiting'}</div>
    </div>
  )
}
