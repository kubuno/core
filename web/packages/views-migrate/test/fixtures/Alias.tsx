/** A condition held in a constant narrows another one (TypeScript 4.4 aliased conditions). */
export function Alias({ previous, total }: { previous: number | null; total: number }) {
  const snapshot = previous === null
  const delta = !snapshot && previous > 0 ? Math.round(((total - previous) / previous) * 100) : null
  return <p>{delta}</p>
}
