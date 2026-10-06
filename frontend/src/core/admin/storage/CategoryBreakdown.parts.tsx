/**
 * The parts of `CategoryBreakdown.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import { NEUTRAL_SERIES } from "./charts"
import type { CategoryBreakdown } from './CategoryBreakdown'

export function Part1({ color }: { color: CategoryBreakdown['props']['color'] }) {
  return (
    <span
              className="size-2.5 shrink-0 rounded-full"
              style={{
                backgroundColor: color ?? NEUTRAL_SERIES,
                boxShadow: color ? undefined : 'inset 0 0 0 1px var(--color-border-strong)',
              }}
              aria-hidden
            />
  )
}
