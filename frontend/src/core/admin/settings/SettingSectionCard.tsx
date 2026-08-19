// A group of settings as one foldable card — the unit a settings page is read
// in.
//
// ── Why a card, and why folded ───────────────────────────────────────────────
// A module can declare fifty knobs. Painted flat they are a wall nobody reads;
// painted as a stack of named, folded cards they are a table of contents that
// happens to be editable. The operator opens the one section they came for, and
// the section says — before it is opened — how many settings it holds and
// whether any of them have been moved off their inherited value. That summary
// is the whole point of the fold: closing a section must not hide the fact that
// something in it was changed.
//
// ── Metrics ──────────────────────────────────────────────────────────────────
// Deliberately the same surface treatment as `@ui/Card`: 8px radius, one
// hairline border, NO shadow — a settings page is a quiet page, and stacking
// eight shadowed tiles turns it into a heap. Header 16px medium over 11px
// secondary grey, generous padding, chevron at the far right.
//
// ── The open body is two columns ─────────────────────────────────────────────
// Left, a fixed ~285px gutter saying WHO the values below belong to ("Réglages
// appliqués à …"). Right, the stack of settings, taking every remaining pixel.
// The gutter holds no control on purpose: it is the section's standing caption,
// and a reader who scrolls into the middle of a long page must be able to learn
// what they are editing without scrolling back up. Below `md` it stacks on top —
// 285px of caption and a control cannot share a phone.
//
// The footer under both columns is where the section is saved. It is full width
// rather than confined to the right column because it commits the section, not
// the last row of it.

import type { ReactNode } from 'react'
import { useId } from 'react'
import { ChevronDown } from 'lucide-react'

export interface SettingSectionCardProps {
  title:    ReactNode
  /**
   * What the section currently amounts to, right-aligned before the chevron:
   * how many knobs, how many of them no longer follow the level above. It is on
   * the RIGHT and not under the title because it is a state, not a subtitle —
   * a column of states down the right edge is what makes a folded page of eight
   * sections answer "where did we change something" without opening one.
   */
  status?:  ReactNode
  /** A real sentence about what the section governs, under the title. */
  description?: ReactNode
  /** Leading glyph, when the section carries one (a module's own page icon). */
  icon?:    ReactNode
  /**
   * The left gutter of the open body: what scope these settings apply to. Comes
   * in as a node rather than being derived here — only the panel knows which
   * scope is on screen, and re-deriving it per section is how two sections of
   * the same page end up claiming two different scopes.
   *
   * Absent, the settings simply take the whole width.
   */
  aside?:   ReactNode
  /** The section's own save bar, under both columns. */
  footer?:  ReactNode
  open:     boolean
  onToggle: () => void
  children: ReactNode
  className?: string
}

export default function SettingSectionCard({
  title, status, description, icon, aside, footer, open, onToggle, children, className = '',
}: SettingSectionCardProps) {
  const bodyId = useId()
  return (
    // `overflow-hidden` so a tinted row (an unsaved edit) and the header's own
    // hover both stop at the 8px corner instead of squaring it off. Nothing
    // inside is sticky, so nothing is broken by the clip; the row menus are
    // portalled and escape it.
    <section className={`min-w-0 overflow-hidden rounded-xl border border-border bg-surface-0 ${className}`}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={bodyId}
        className="flex w-full min-w-0 items-center gap-4 rounded-xl px-5 py-4 text-left transition-colors
                   hover:bg-surface-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {icon && <span className="shrink-0 text-text-secondary">{icon}</span>}
        <span className="min-w-0 flex-1">
          <span
            className="block truncate font-medium text-text-primary"
            style={{ fontSize: 'var(--kb-text-heading)' }}
          >
            {title}
          </span>
          {description != null && (
            <span
              className="mt-1 block leading-relaxed text-text-secondary"
              style={{ fontSize: 'var(--kb-text-meta)' }}
            >
              {description}
            </span>
          )}
        </span>
        {status != null && (
          <span
            className="hidden shrink-0 text-right text-text-secondary sm:block"
            style={{ fontSize: 'var(--kb-text-meta)' }}
          >
            {status}
          </span>
        )}
        <ChevronDown
          size={18}
          aria-hidden
          className={`shrink-0 text-text-secondary transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Unmounted rather than hidden: a folded section holds no focusable
          control, so the tab order walks the page the reader actually sees. */}
      {open && (
        <div id={bodyId}>
          <div className="md:flex md:items-start">
            {aside != null && (
              // The rows carry their own `px-5`, so the right column takes none:
              // that is what keeps each row's hairline running the full width of
              // the column instead of stopping short of it.
              <div className="border-t border-border px-5 py-4 md:w-[285px] md:shrink-0">
                {aside}
              </div>
            )}
            <div className="min-w-0 md:flex-1">{children}</div>
          </div>
          {footer}
        </div>
      )}
    </section>
  )
}
