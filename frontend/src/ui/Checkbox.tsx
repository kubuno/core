import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

type CheckboxVariant = 'default' | 'dark'

interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  description?: string
  variant?: CheckboxVariant
  /** Couleur d'accent (coché). Défaut : bleu primaire. Ex. couleur d'un agenda. */
  color?: string
  disabled?: boolean
  className?: string
  labelClassName?: string
}

// Case à cocher robuste — technique moderncss.dev : vrai <input type=checkbox>
// avec appearance:none, coche en pseudo-élément ::before (forme via clip-path,
// remplie en blanc par box-shadow), centrée par `display:grid; place-content:center`.
// Couleur d'accent pilotée par la variable CSS --ck (surchargée via la prop `color`).
const BASE =
  'appearance-none m-0 shrink-0 grid place-content-center w-[18px] h-[18px] rounded-sm ' +
  'border-2 cursor-pointer transition-colors ' +
  'checked:bg-[var(--ck)] checked:border-[var(--ck)] ' +
  "before:content-[''] before:w-[11px] before:h-[11px] before:scale-0 before:origin-center " +
  'before:transition-transform before:duration-100 checked:before:scale-100 ' +
  'before:[clip-path:polygon(14%_44%,0_65%,50%_100%,100%_16%,80%_0%,43%_62%)] ' +
  'before:shadow-[inset_1em_1em_#fff] ' +
  'disabled:cursor-not-allowed disabled:opacity-50'

const SKIN: Record<CheckboxVariant, string> = {
  default: 'border-[#dadce0] hover:border-[#5f6368]',
  dark:    'border-[#555] hover:border-[#808080] bg-[#3c3c3c]',
}

const LBL: Record<CheckboxVariant, { label: string; desc: string }> = {
  default: { label: 'text-sm text-[#202124]', desc: 'text-xs text-[#5f6368]' },
  dark:    { label: 'text-xs text-[#cccccc]', desc: 'text-[11px] text-[#808080]' },
}

export function Checkbox({
  checked, onChange, label, description,
  variant = 'default', color, disabled = false,
  className, labelClassName,
}: CheckboxProps) {
  const accent = color ?? (variant === 'dark' ? '#007acc' : '#1a73e8')
  return (
    <label
      className={`inline-flex items-start gap-2 select-none ${className ?? ''}`}
      style={{ cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, ['--ck' as string]: accent }}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={e => onChange(e.target.checked)}
        className={clsx(BASE, SKIN[variant], 'mt-px')}
      />
      {(label || description) && (
        <div className="flex flex-col mt-px min-w-0">
          {label && <span className={twMerge('leading-snug', LBL[variant].label, labelClassName)}>{label}</span>}
          {description && <span className={twMerge('leading-snug mt-0.5', LBL[variant].desc)}>{description}</span>}
        </div>
      )}
    </label>
  )
}
