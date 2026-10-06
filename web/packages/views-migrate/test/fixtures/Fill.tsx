interface Unit { id: string; parent: string | null; name: string }

/** A list filled by a local recursive function, the way the unit trees are flattened. */
export function Fill({ units }: { units: Unit[] }) {
  const root = units.find((u) => u.parent === null)
  const rows: { unit: Unit; depth: number }[] = []
  const walk = (u: Unit, depth: number) => {
    rows.push({ unit: u, depth })
    units.filter((k) => k.parent === u.id).forEach((k) => walk(k, depth + 1))
  }
  if (root) walk(root, 0)
  return (
    <ul>
      {rows.map((r) => <li key={r.unit.id}>{r.unit.name}</li>)}
    </ul>
  )
}
