import React from 'react'
import * as RadixAvatar from '@radix-ui/react-avatar'

/** Initials of a display name: the first letter of its first two words (« Camille Martin » → « CM »). */
export function initialsOf(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
}

export interface AvatarProps {
  /** The person's name: its initials show without a photo, and the photo's alternative text. */
  displayName?: string
  /** Letters shown instead of the name's initials. */
  initials?: string
  /** The photo's address; absent or failing → the initials. */
  image?: string | null
  /** `auto`: a neutral disc, initials in the secondary text colour. `accent`: the accent, white initials. */
  tint?: 'auto' | 'accent'
  shape?: 'circle' | 'rounded'
  /** Diameter in px. */
  size?: number
  className?: string
  style?: React.CSSProperties
}

/** The initials' step for a diameter (the hand-written avatars of the shell: 96 → 2xl, 36–40 → sm, 24 → 10 px). */
function initialsClass(size: number, accent: boolean): string {
  if (size >= 64) return 'text-2xl font-medium'
  if (size >= 30) return 'text-sm font-medium'
  return accent ? 'text-[10px] font-medium' : 'text-[10px]'
}

/**
 * A person's picture, or their initials on a disc while there is none (the `.kbview` `Avatar`). Built on
 * Radix Avatar: the initials show until the photo has loaded, and stay when it fails.
 */
export const Avatar = React.forwardRef<HTMLSpanElement, AvatarProps>(function Avatar(
  { displayName = '', initials, image, tint = 'auto', shape = 'circle', size = 36, className, style },
  ref,
) {
  const accent = tint === 'accent'
  const letters = initials || (displayName ? initialsOf(displayName) : '')
  const root = [
    shape === 'circle' ? 'rounded-full' : 'rounded-md',
    'overflow-hidden flex items-center justify-center shrink-0',
    accent ? 'bg-primary' : 'bg-surface-3',
    className,
  ].filter(Boolean).join(' ')
  return (
    <RadixAvatar.Root ref={ref} className={root} style={{ width: size, height: size, ...style }}>
      {image ? <RadixAvatar.Image src={image} alt={displayName} className="w-full h-full object-cover" /> : null}
      <RadixAvatar.Fallback className={`${accent ? 'text-white' : 'text-text-secondary'} ${initialsClass(size, accent)}`}>
        {letters}
      </RadixAvatar.Fallback>
    </RadixAvatar.Root>
  )
})

Avatar.displayName = 'Avatar'
