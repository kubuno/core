import React from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize    = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  ButtonVariant
  size?:     ButtonSize
  /** Leading icon — rendered before children */
  icon?:     React.ReactNode
  loading?:  boolean
  children?: React.ReactNode
}

// rounded-md is FIXED — border radius is never overridable
const BASE = [
  'inline-flex items-center justify-center font-medium select-none',
  'transition-colors rounded-md',
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
  'disabled:opacity-50 disabled:cursor-not-allowed',
].join(' ')

const VARIANT: Record<ButtonVariant, string> = {
  primary:   'bg-primary text-white hover:bg-primary-hover active:bg-primary-hover',
  secondary: 'bg-white border border-border text-text-primary hover:bg-surface-1 active:bg-surface-2',
  ghost:     'bg-transparent text-text-secondary hover:bg-surface-2 active:bg-surface-3',
  danger:    'bg-danger text-white hover:opacity-90 active:opacity-80',
}

// md = h-9 matches "Nouvel utilisateur" default height
const SIZE: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-sm gap-2',
}

export function Button({
  variant  = 'primary',
  size     = 'md',
  icon,
  loading  = false,
  className,
  disabled,
  children,
  type     = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[BASE, VARIANT[variant], SIZE[size], className].filter(Boolean).join(' ')}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  )
}
