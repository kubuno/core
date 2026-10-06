/**
 * The parts of `RightRail.kbcontrol` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import { cn } from "../../../ui/cn"
import { SlidersHorizontal, PanelRightOpen } from "lucide-react"
import { Tooltip, MenuDropdown } from "@ui"
import type { RightRail } from './RightRail'

export function Part1({ visible, activeModuleId, togglePanel }: { visible: NonNullable<RightRail['visible']>; activeModuleId: RightRail['activeModuleId']; togglePanel: NonNullable<RightRail['togglePanel']> }) {
  return (
    <>{visible.map(({ moduleId, icon: Icon, label }) => {
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
                    className={cn(
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
            })}</>
  )
}

export function Part2({ reopenLabel, reopenEntries, setReopenMenu }: { reopenLabel: NonNullable<RightRail['reopenLabel']>; reopenEntries: NonNullable<RightRail['reopenEntries']>; setReopenMenu: NonNullable<RightRail['setReopenMenu']> }) {
  return (
    <Tooltip label={`${reopenLabel} (${reopenEntries.length})`} side="left">
                <button
                  type="button"
                  onClick={(e) => {
                    const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
                    setReopenMenu({ top: r.top, left: Math.max(8, r.left - 208), minWidth: 200 })
                  }}
                  aria-label={`${reopenLabel} (${reopenEntries.length})`}
                  className="relative mt-1 flex h-10 w-10 items-center justify-center rounded-full text-text-secondary
                             transition-colors hover:bg-surface-2 hover:text-text-primary
                             focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
                >
                  <PanelRightOpen size={20} />
                  <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-white">
                    {reopenEntries.length}
                  </span>
                </button>
              </Tooltip>
  )
}

export function Part3({ customiseLabel, setEditing }: { customiseLabel: NonNullable<RightRail['customiseLabel']>; setEditing: NonNullable<RightRail['setEditing']> }) {
  return (
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
  )
}

export function Part4({ reopenEntries, reopen, reopenMenu, setReopenMenu }: { reopenEntries: NonNullable<RightRail['reopenEntries']>; reopen: RightRail['reopen']; reopenMenu: NonNullable<RightRail['reopenMenu']>; setReopenMenu: NonNullable<RightRail['setReopenMenu']> }) {
  return (
    <MenuDropdown
              items={reopenEntries.map(en => ({
                type: 'action' as const,
                label: en.label,
                onClick: () => reopen?.(en.id),
              }))}
              pos={reopenMenu}
              onClose={() => setReopenMenu(null)}
            />
  )
}
