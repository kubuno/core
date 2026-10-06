import React, { useState } from 'react'
import { Search, X } from 'lucide-react'

import { cn } from './cn'
import { uiT } from './uiText'

export interface SearchFieldProps {
  /** The searched text (controlled when given, followed through `onChange`). */
  value?: string
  onChange?: (text: string) => void
  /** Enter: the search is asked for now (the text). */
  onSearch?: (text: string) => void
  placeholder?: string
  disabled?: boolean
  readOnly?: boolean
  maxLength?: number
  className?: string
  style?: React.CSSProperties
  'aria-label'?: string
}

/**
 * A search box (the `.kbview` `SearchField`): the shell search bar's pill (`--color-search-bg`, white and raised
 * while focused) with its magnifier and a clear button. Escape clears the text, Enter asks for the search
 * (`onSearch`). A native `type="search"` input with `role="searchbox"`.
 */
export const SearchField = React.forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField(
  { value, onChange, onSearch, placeholder, disabled, readOnly, maxLength, className, style, ...aria },
  ref,
) {
  const [own, setOwn] = useState('')
  const [focused, setFocused] = useState(false)
  const text = value ?? own
  const set = (v: string) => {
    if (value === undefined) setOwn(v)
    onChange?.(v)
  }
  const t = uiT()
  return (
    <div
      className={cn('flex items-center h-9 rounded-full border transition-all min-w-0', disabled && 'opacity-60', className)}
      style={{
        background: focused ? 'var(--color-surface-0)' : 'var(--color-search-bg)',
        borderColor: focused ? 'var(--color-border)' : 'transparent',
        boxShadow: focused ? '0 1px 3px rgba(0,0,0,0.2), 0 2px 6px rgba(0,0,0,0.1)' : 'none',
        ...style,
      }}
    >
      <span className="ps-3 pe-2 flex-shrink-0 text-text-secondary"><Search size={16} aria-hidden /></span>
      <input
        ref={ref}
        type="search"
        role="searchbox"
        value={text}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        maxLength={maxLength}
        aria-label={aria['aria-label'] ?? placeholder}
        onChange={(e) => set(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && text) { e.preventDefault(); e.stopPropagation(); set('') }
          else if (e.key === 'Enter') { e.preventDefault(); onSearch?.(text) }
        }}
        className="flex-1 min-w-0 bg-transparent outline-none text-sm text-text-primary placeholder:text-text-tertiary [&::-webkit-search-cancel-button]:hidden"
      />
      {text && !disabled && !readOnly ? (
        <button
          type="button"
          aria-label={t('ui.clear')}
          onMouseDown={(e) => { e.preventDefault(); set('') }}
          className="flex-shrink-0 px-2 text-text-tertiary hover:text-text-primary"
        >
          <X size={16} aria-hidden />
        </button>
      ) : <span className="w-3 flex-shrink-0" />}
    </div>
  )
})

SearchField.displayName = 'SearchField'
