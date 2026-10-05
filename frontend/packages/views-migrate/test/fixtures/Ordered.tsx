import { useEffect, useMemo, useState } from 'react'

/** A hook whose dependencies read a constant computed from an earlier hook (`active` from `groups`). */
export function Ordered({ pane }: { pane: string }) {
  const [list] = useState<string[]>(['a', 'b'])
  const groups = useMemo(() => list.map((x) => x.toUpperCase()), [list])
  const active = groups.find((g) => g === pane) ?? groups[0]
  useEffect(() => { document.title = active }, [active])
  return <p>{active}</p>
}
