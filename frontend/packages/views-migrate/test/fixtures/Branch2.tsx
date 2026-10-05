/** A block whose own early return comes before its constants' use. */
export function Branch2({ scoped, count }: { scoped: boolean; count: number }) {
  if (!scoped) {
    const n = count * 2
    if (n === 0) return null
    return <p className="text-sm">{n}</p>
  }
  return <p className="text-sm">scoped</p>
}
