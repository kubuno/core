import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

type RadioVariant = 'default' | 'dark'

interface RadioProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  description?: string
  variant?: RadioVariant
  /** Couleur d'accent (coché). Défaut : bleu primaire. Ex. couleur d'un agenda. */
  color?: string
  disabled?: boolean
  className?: string
  labelClassName?: string
}

// Radio circulaire robuste — technique moderncss.dev : vrai <input type=radio>
// avec appearance:none, point central en pseudo-élément ::before, centré par
// `display:grid; place-content:center` (fiable sur tous les navigateurs).
// Couleur d'accent pilotée par la variable CSS --rb (surchargée via la prop `color`).
const BASE =
  'appearance-none m-0 shrink-0 grid place-content-center w-[18px] h-[18px] rounded-full ' +
  'border-2 cursor-pointer transition-colors checked:border-[var(--rb)] ' +
  "before:content-[''] before:w-[10px] before:h-[10px] before:rounded-full before:bg-[var(--rb)] " +
  'before:scale-0 before:transition-transform before:duration-100 checked:before:scale-100 ' +
  'disabled:cursor-not-allowed disabled:opacity-50'

const SKIN: Record<RadioVariant, string> = {
  default: 'border-[#dadce0] hover:border-[#5f6368]',
  dark:    'border-[#555] hover:border-[#808080]',
}

const LBL: Record<RadioVariant, { label: string; desc: string }> = {
  default: { label: 'text-sm text-[#202124]', desc: 'text-xs text-[#5f6368]' },
  dark:    { label: 'text-xs text-[#cccccc]', desc: 'text-[11px] text-[#808080]' },
}

export function Radio({
  checked, onChange, label, description,
  variant = 'default', color, disabled = false,
  className, labelClassName,
}: RadioProps) {
  const accent = color ?? (variant === 'dark' ? '#007acc' : '#1a73e8')
  return (
    <label
      className={`inline-flex items-start gap-2 select-none ${className ?? ''}`}
      style={{ cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, ['--rb' as string]: accent }}
    >
      <input
        type="radio"
        checked={checked}
        disabled={disabled}
        // onClick (et non onChange seul) pour permettre de re-cliquer un radio
        // déjà coché afin de le désélectionner (ex. « module par défaut »).
        onClick={() => { if (!disabled) onChange(!checked) }}
        onChange={() => { /* contrôlé via onClick */ }}
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
