/**
 * The parts of `FieldLabel.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import type { FieldLabel } from './FieldLabel'

export function Part1({ htmlFor, children }: { htmlFor: FieldLabel['props']['htmlFor']; children: FieldLabel['props']['children'] }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium text-text-primary">
          {children}
        </label>
  )
}
