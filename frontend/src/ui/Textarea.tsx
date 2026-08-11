import React from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { MentionsConfig } from './mention/types'
import { MentionEditable } from './mention/MentionEditable'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
  /**
   * Opt-in @mention support. ABSENT (or `enabled` falsy) → a plain native
   * `<textarea>`, 100 % unchanged.
   *
   * When enabled the field cannot stay a native `<textarea>` (it cannot hold
   * chip elements): it switches INTERNALLY to a multi-line contenteditable that
   * looks identical. ⚠️ SEMANTIC SHIFT — the value is then HTML, not plain text:
   * seed it via `value` (HTML) and read it back via `onMentionsChange(html)`.
   * The native `onChange` is not called in this mode.
   */
  mentions?: MentionsConfig
  /** Called with the HTML value when `mentions` is enabled. */
  onMentionsChange?: (html: string) => void
}

// The visual skin shared by the native textarea and its contenteditable twin, so
// enabling `mentions` never changes how the field looks.
const FIELD_CLASS =
  'w-full rounded-md border bg-white text-sm text-text-primary placeholder:text-text-tertiary ' +
  'px-3 py-2 h-36 min-h-16 ' +
  'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ' +
  'disabled:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-60'

export function Textarea({
  label, error, hint, className, id, mentions, onMentionsChange, ...props
}: TextareaProps) {
  const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  const borderClass = error ? 'border-danger focus:ring-danger' : 'border-border'

  const field = mentions?.enabled ? (
    <MentionEditable
      id={textareaId}
      value={typeof props.value === 'string' ? props.value : ''}
      onChange={(html) => onMentionsChange?.(html)}
      mentions={mentions}
      placeholder={typeof props.placeholder === 'string' ? props.placeholder : undefined}
      disabled={props.disabled}
      // Contenteditable twin: same skin, made scrollable + focusable within the box.
      className={twMerge(clsx(FIELD_CLASS, 'overflow-auto', 'focus:ring-2', borderClass, className))}
    />
  ) : (
    <textarea
      id={textareaId}
      className={twMerge(clsx(
        // `h-36` is the default height and `twMerge` lets a caller override it
        // with its own `h-*`. The floor must therefore NOT be the same value:
        // `min-h-36` made the default unoverridable — a field asking for
        // `h-20` still rendered at 144 px, because the two are different
        // properties and only the first one merged. The floor is what a
        // textarea needs to stay usable when dragged small, nothing more.
        FIELD_CLASS, 'resize-y', borderClass, className,
      ))}
      {...props}
    />
  )

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={textareaId} className="text-sm font-medium text-text-primary">
          {label}
        </label>
      )}
      {field}
      {error && <p className="text-xs text-danger">{error}</p>}
      {hint && !error && <p className="text-xs text-text-secondary">{hint}</p>}
    </div>
  )
}
