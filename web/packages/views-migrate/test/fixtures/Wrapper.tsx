/** A screen that only renders another component (nothing a view could hold). */
function Inner({ n }: { n: number }) {
  return <p>{n}</p>
}

export function Wrapper({ n }: { n: number }) {
  return <Inner n={n} />
}
