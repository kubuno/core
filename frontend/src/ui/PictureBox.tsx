import React from 'react'

import { cn } from './cn'

/** How the picture fills the box (the desktop's `PictureBoxSizeMode` names). */
export type PictureSizeMode = 'Normal' | 'Stretch' | 'Zoom' | 'Center' | 'Cover'

const FIT: Readonly<Record<PictureSizeMode, React.CSSProperties>> = {
  // At its own size, from the top start corner (clipped by the box).
  Normal: { objectFit: 'none', objectPosition: 'top left' },
  Stretch: { objectFit: 'fill' },
  Zoom: { objectFit: 'contain' },
  Center: { objectFit: 'none', objectPosition: 'center' },
  Cover: { objectFit: 'cover' },
}

export interface PictureBoxProps {
  /** The picture's address. */
  src?: string
  /** Alternative text (`AccessibleName`); empty = a decorative picture, hidden from screen readers. */
  alt?: string
  sizeMode?: PictureSizeMode
  /** Rounded corners, in pixels. */
  cornerRadius?: number
  /** `FixedSingle`: a line in the theme's border colour around the box. */
  borderStyle?: 'None' | 'FixedSingle'
  width?: number
  height?: number
  className?: string
  style?: React.CSSProperties
  onClick?: (e: React.MouseEvent<HTMLImageElement>) => void
}

/**
 * A picture (the `.kbview` `PictureBox`): an `<img>` laid out by `SizeMode` like the desktop's (object-fit), with
 * rounded corners and an optional border. Without a picture the box keeps its size, empty.
 */
export const PictureBox = React.forwardRef<HTMLImageElement, PictureBoxProps>(function PictureBox(
  { src, alt = '', sizeMode = 'Normal', cornerRadius, borderStyle = 'None', width, height, className, style, onClick },
  ref,
) {
  const box: React.CSSProperties = {
    ...FIT[sizeMode],
    width: width ? `${width}px` : undefined,
    height: height ? `${height}px` : undefined,
    borderRadius: cornerRadius ? `${cornerRadius}px` : undefined,
    ...style,
  }
  return (
    <img
      ref={ref}
      src={src || undefined}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      draggable={false}
      className={cn('block max-w-full', borderStyle === 'FixedSingle' && 'border border-border', className)}
      style={box}
      onClick={onClick}
    />
  )
})

PictureBox.displayName = 'PictureBox'
