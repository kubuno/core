// The save bar of ONE section: a hairline, then the two actions that commit it,
// right-aligned under the settings they apply to.
//
// ── Why it is not one floating bar for the whole page ────────────────────────
// A single bar pinned to the viewport reads as "the page has unsaved work" and
// nothing finer: with eight sections open it never says WHICH knob it is about
// to write, and pressing it commits everything the operator touched in the last
// ten minutes across three tabs. Attached to the section, the pair of actions is
// unambiguous — it writes the settings printed above it, and nothing else.
//
// The price is that a change staged in a section the operator has since folded
// away, or left on another page, has no bar in front of it. That is what
// `elsewhere` is for: the bar keeps saying how many changes are waiting outside
// it, and `elsewhereAction` is the way back to them. Losing that count is how a
// console silently drops typed work.
//
// ── Why it is always painted ─────────────────────────────────────────────────
// Unlike the floating bar it replaces, this one has a fixed place at the foot of
// the section, so being there while there is nothing to save costs no attention
// and answers "where do I confirm this?" before the first click. Save is simply
// disabled until the section holds a change.
//
// ── Metrics ──────────────────────────────────────────────────────────────────
// Text actions, not filled rectangles: a section footer that ends in a solid
// blue block turns every section into a form to be submitted, and a page of
// eight into a wall of buttons. Uppercase labels, body size (14px), regular
// weight, hover on the step-1 surface only.

import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

export interface SettingsSaveBarProps {
  /** Staged changes belonging to THIS section. Zero disables the write. */
  count:    number
  /** Staged changes waiting in another section, tab or page. */
  elsewhere?: number
  /** The way to reach them — a link, or a button that opens their section. */
  elsewhereAction?: ReactNode
  /** Values the module's own declaration refuses. Blocks the write. */
  invalid?:  number
  /** True while this section's write is in flight. */
  saving?:   boolean
  /** Flashes on the action for a moment after a successful write. */
  saved?:    boolean
  /**
   * The staged changes would create the first local value on this scope, so the
   * primary action is "override the inherited value" rather than "save".
   *
   * Writing a value on a scope that has none yet does something different from
   * updating one it already holds: the first REMOVES the unit from its parent's
   * authority for that key, for good, and every unit below it with it. Naming
   * both "Enregistrer" hides that.
   */
  overriding?: boolean
  onSave:   () => void
  onCancel: () => void
}

/** Shared skin of the two text actions: same box, same rhythm, no weight. */
const ACTION = 'rounded px-3 py-1.5 uppercase transition-colors ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'

export default function SettingsSaveBar({
  count, elsewhere = 0, elsewhereAction, invalid = 0, saving = false, saved = false,
  overriding = false, onSave, onCancel,
}: SettingsSaveBarProps) {
  const { t } = useTranslation()

  const blocked  = invalid > 0
  const disabled = count === 0 || blocked || saving

  return (
    <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 border-t border-border px-5 py-3">
      {(blocked || elsewhere > 0) && (
        <span
          className={`min-w-0 flex-1 ${blocked ? 'text-danger' : 'text-text-tertiary'}`}
          style={{ fontSize: 'var(--kb-text-meta)' }}
        >
          {blocked
            ? t('admin.m_invalid_values', {
                count: invalid,
                defaultValue: `${invalid} valeur(s) hors bornes`,
              })
            : (
              <>
                {t('admin.m_pending_elsewhere_count', {
                  count: elsewhere,
                  defaultValue: `${elsewhere} autre(s) modification(s) non enregistrée(s)`,
                })}
                {elsewhereAction && <span className="ml-2">{elsewhereAction}</span>}
              </>
            )}
        </span>
      )}

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onCancel}
          className={`${ACTION} text-text-secondary hover:bg-surface-1 hover:text-text-primary`}
          style={{ fontSize: 'var(--kb-text-body)' }}
        >
          {t('common.cancel', { defaultValue: 'Annuler' })}
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={disabled}
          // No opacity on a theme colour to grey it out — a skin may remap the
          // token to anything. The disabled state IS the tertiary text token.
          className={`${ACTION} ${disabled
            ? 'cursor-not-allowed text-text-tertiary'
            : 'text-primary hover:bg-surface-1'}`}
          style={{ fontSize: 'var(--kb-text-body)' }}
        >
          {saved
            ? t('admin.m_saved', { defaultValue: 'Enregistré' })
            : saving
              ? t('admin.m_saving', { defaultValue: 'Enregistrement…' })
              : overriding
                ? t('admin.m_override', { defaultValue: 'Remplacer' })
                : t('common.save', { defaultValue: 'Enregistrer' })}
        </button>
      </div>
    </div>
  )
}
