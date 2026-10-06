import { cloneElement, isValidElement, type ReactNode } from 'react'

/**
 * An item's icon at the size its component draws icons at, unless the caller gave one (`IconSize` of a `.kbview`
 * item reaches the icon as its `size`). A bare string (an unresolved icon name) draws nothing.
 */
export function sizedIcon(icon: ReactNode, size: number): ReactNode {
  if (typeof icon === 'string') return null
  if (isValidElement<{ size?: number }>(icon) && icon.props.size == null) return cloneElement(icon, { size })
  return icon
}
