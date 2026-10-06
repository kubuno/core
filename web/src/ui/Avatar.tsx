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
  /** A dot at the bottom end corner: the person's availability. */
  presence?: AvatarPresence
  className?: string
  style?: React.CSSProperties
}

export type AvatarPresence = 'none' | 'online' | 'away' | 'busy' | 'offline'

const PRESENCE_COLOR: Readonly<Record<Exclude<AvatarPresence, 'none'>, string>> = {
  online: 'var(--color-success)',
  away: 'var(--color-warning)',
  busy: 'var(--color-danger)',
  offline: 'var(--color-border-strong)',
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
  { displayName = '', initials, image, tint = 'auto', shape = 'circle', size = 36, presence = 'none', className, style },
  ref,
) {
  if (presence !== 'none') {
    // The dot sits outside the clipped disc: a wrapper carries the element's box, the disc fills it.
    const dot = Math.min(16, Math.max(8, Math.round(size * 0.25)))
    return (
      <span ref={ref} className={['relative inline-flex shrink-0', className].filter(Boolean).join(' ')} style={{ width: size, height: size, ...style }}>
        <AvatarDisc displayName={displayName} initials={initials} image={image} tint={tint} shape={shape} size={size} />
        <span
          role="img"
          aria-label={presence}
          className="absolute bottom-0 end-0 rounded-full"
          style={{ width: dot, height: dot, background: PRESENCE_COLOR[presence], boxShadow: '0 0 0 2px var(--color-surface-0)' }}
        />
      </span>
    )
  }
  return <AvatarDisc ref={ref} displayName={displayName} initials={initials} image={image} tint={tint} shape={shape} size={size} className={className} style={style} />
})

Avatar.displayName = 'Avatar'

const AvatarDisc = React.forwardRef<HTMLSpanElement, Omit<AvatarProps, 'presence'>>(function AvatarDisc(
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

AvatarDisc.displayName = 'AvatarDisc'
