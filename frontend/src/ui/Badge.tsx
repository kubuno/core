import React from 'react'
import { clsx } from 'clsx'

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'neutral'
type BadgeSize = 'sm' | 'md'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  className?: string
  dot?: boolean
}

const variants: Record<BadgeVariant, string> = {
  default:  'bg-surface-2 text-text-secondary',
  primary:  'bg-primary-light text-primary',
  success:  'bg-success-light text-success',
  warning:  'bg-warning-light text-warning',
  danger:   'bg-danger-light text-danger',
  neutral:  'bg-surface-3 text-text-primary',
}

const dotVariants: Record<BadgeVariant, string> = {
  default: 'bg-text-tertiary',
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger:  'bg-danger',
  neutral: 'bg-text-secondary',
}

const sizes: Record<BadgeSize, string> = {
  sm: 'text-[10px] px-1.5 py-0.5',
  md: 'text-xs px-2 py-0.5',
}

export function Badge({ children, variant = 'default', size = 'md', className, dot = false }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full font-medium',
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {dot && <span className={clsx('h-1.5 w-1.5 rounded-full flex-shrink-0', dotVariants[variant])} />}
      {children}
    </span>
  )
}
