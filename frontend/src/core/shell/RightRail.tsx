import { useState } from 'react'
import { clsx } from 'clsx'
import { SlidersHorizontal } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Tooltip } from '@ui'
import { useRightPanelStore } from '../store/rightPanelStore'
import { useRightRailPrefs } from '../hooks/useRightRailPrefs'
import RightRailCustomize from './RightRailCustomize'

/**
 * The rail of module panels, on the right edge.
 *
 * Hover and focus are CLASSES, not `e.currentTarget.style` mutations. The mutation
 * version bypassed React (the DOM and the render disagreed after any state change),
 * never fired for a keyboard user, and could not be themed — the same reason it was
 * removed from the menus.
 *
 * Tooltips come from `@ui`, not from a local Radix instance. The Radix one rendered
 * a pale bubble at 11px with its own arrow and z-index, which matched nothing else
 * in the app: the house tooltip is a dark bubble at 12px, anchored to the POINTER
 * and clamped to the viewport edges — which matters on a rail sitting against the
 * right border.
 */
export default function RightRail() {
  const { t } = useTranslation()
  const activeModuleId = useRightPanelStore(s => s.activeModuleId)
  const togglePanel    = useRightPanelStore(s => s.togglePanel)
  // `visible` is the user's own selection and order; `entries` stays the full list
  // so the customisation dialog can still offer what is currently hidden.
  const { entries, visible, prefs, save } = useRightRailPrefs()
  const [editing, setEditing] = useState(false)

  // Nothing to offer here (no module registered a panel, or the only one belongs to
  // the module we are in): a rail holding just its own settings button is noise.
  if (visible.length === 0) return null

  const customiseLabel = t('shell.rail_customize', { defaultValue: 'Personnaliser le panneau' })

  return (
    <>
      <div
        /* Above the floating panel's scrim (z-40): switching from one panel to another
         * must stay one click. Without this the scrim swallows the rail and the only
         * outcome is closing what is open. */
        className="relative z-50 flex w-14 flex-shrink-0 flex-col items-center gap-0.5 rounded-xl py-2"
        style={{ background: 'var(--body-bg)' }}
      >
        {visible.map(({ moduleId, icon: Icon, label }) => {
          const isActive = activeModuleId === moduleId
          return (
            <Tooltip key={moduleId} label={label} side="left">
              <button
                type="button"
                onClick={() => togglePanel(moduleId)}
                aria-label={label}
                // `aria-pressed` rather than nothing: the button is a toggle, and
                // the filled circle is the only other thing saying so.
                aria-pressed={isActive}
                className={clsx(
                  'flex h-10 w-10 items-center justify-center rounded-full transition-colors',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
                  isActive
                    ? 'bg-primary-light text-primary hover:bg-primary-light'
                    : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary',
                )}
              >
                <Icon size={20} />
              </button>
            </Tooltip>
          )
        })}

        {/* Customisation lives at the BOTTOM, separated: it is not one of the panels,
            and putting it in the flow would make the rail's order look arbitrary. */}
        <Tooltip label={customiseLabel} side="left">
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label={customiseLabel}
            className="mt-1 flex h-10 w-10 items-center justify-center rounded-full border-t border-border/60 text-text-tertiary
                       transition-colors hover:bg-surface-2 hover:text-text-primary
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
          >
            <SlidersHorizontal size={18} />
          </button>
        </Tooltip>
      </div>

      {editing && (
        <RightRailCustomize
          entries={entries}
          prefs={prefs}
          onSave={save}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  )
}
