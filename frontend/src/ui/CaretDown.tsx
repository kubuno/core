/**
 * Solid drop-down caret, shared by every list-style selector.
 *
 * Not lucide's `ChevronDown` (a thin V, which reads as "expand" rather than
 * "choose from a list") and not the `▼` character, whose shape and baseline
 * change from one font to the next.
 */
export function CaretDown({ color, size = 10, gap = 4, className }: {
  color?: string
  size?: number
  /** Breathing room kept on the caret's right, inside the control. */
  gap?: number
  className?: string
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" aria-hidden
      className={className}
      style={{ flexShrink: 0, fill: color ?? 'currentColor', marginRight: gap }}>
      <path d="M1 3.5h8L5 8.5z" />
    </svg>
  )
}
