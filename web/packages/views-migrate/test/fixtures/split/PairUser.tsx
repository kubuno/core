import { First, Second, type Mode } from './Pair'

export function PairUser({ mode }: { mode: Mode }) {
  return (
    <div>
      <First n={1} mode={mode} />
      <Second n={2} />
    </div>
  )
}
