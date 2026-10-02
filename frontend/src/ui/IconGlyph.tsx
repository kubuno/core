import React from 'react'

type IconComponent = React.ComponentType<{ size?: number; color?: string; className?: string }>

/** The discs an icon may sit on (`Icon Disc`, the message-box style of Kubuno). */
export type IconDisc = 'None' | 'Neutral' | 'Info' | 'Warning' | 'Danger' | 'Success'

const DISC_CLASS: Readonly<Record<Exclude<IconDisc, 'None'>, string>> = {
  Neutral: 'bg-surface-2',
  Info: 'bg-primary/10',
  Warning: 'bg-warning/15',
  Danger: 'bg-danger/10',
  Success: 'bg-success/10',
}

export interface IconGlyphProps {
  /** The glyph (a Lucide component; the views runtime resolves `Name` to it). */
  icon?: IconComponent
  /** Glyph size, px. */
  size?: number
  /** A theme colour for the glyph (a CSS colour). */
  color?: string
  disc?: IconDisc
  className?: string
}

/**
 * An icon (the `.kbview` `Icon`): a glyph alone, or centred on a disc twice its size (`Disc`). Decorative:
 * hidden from screen readers.
 */
export const IconGlyph = React.forwardRef<HTMLSpanElement, IconGlyphProps>(function IconGlyph(
  { icon: Glyph, size = 20, color, disc = 'None', className },
  ref,
) {
  const glyph = Glyph ? <Glyph size={size} color={color} className={disc === 'None' ? className : undefined} /> : null
  if (disc === 'None') {
    return (
      <span ref={ref} aria-hidden className="contents">
        {glyph}
      </span>
    )
  }
  const d = size * 2
  return (
    <span
      ref={ref}
      aria-hidden
      className={['rounded-full flex items-center justify-center shrink-0', DISC_CLASS[disc], className].filter(Boolean).join(' ')}
      style={{ width: d, height: d }}
    >
      {glyph}
    </span>
  )
})

IconGlyph.displayName = 'IconGlyph'

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** The icon element (the views runtime builds it from `Icon`, sized by `Glyph`). */
  icon?: React.ReactNode
  /** Diameter, px. */
  diameter?: number
  /** A tinted fill (`bg-surface-2`), darker on hover; otherwise only a hover tint. */
  filled?: boolean
  /** Size of an icon given without one, px (default 18). */
  glyph?: number
}

/** A round button showing only an icon (the `.kbview` `IconButton`). Its accessible name is required. */
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, diameter = 36, filled = false, glyph = 18, className, style, type = 'button', children, ...rest },
  ref,
) {
  // An icon built without a size (the views runtime gives `IconSize` only when written) takes `glyph`.
  const sized = React.isValidElement<{ size?: number }>(icon) && icon.props.size == null
    ? React.cloneElement(icon, { size: glyph })
    : icon
  const cls = [
    'rounded-full flex items-center justify-center text-text-secondary transition-colors',
    filled ? 'bg-surface-2 hover:bg-surface-3' : 'hover:bg-black/8',
    className,
  ].filter(Boolean).join(' ')
  return (
    <button ref={ref} type={type} className={cls} style={{ width: diameter, height: diameter, ...style }} {...rest}>
      {sized}
      {children}
    </button>
  )
})

IconButton.displayName = 'IconButton'
