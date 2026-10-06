/**
 * The parts of `LeftRail.kbcontrol` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import { Tooltip } from "@ui"
import type { LeftRail } from './LeftRail'

export function Part1({ entries }: { entries: NonNullable<LeftRail['entries']> }) {
  return (
    <>{entries.map(({ moduleId, icon: Icon, label, isActive, onClick, href }) => (
              <Tooltip key={moduleId} label={label} side="right">
                  {/* Anchor, never a <button>: the whole left panel is links. */}
                  <a
                    href={href ?? '#'}
                    role="button"
                    onClick={e => { if (!href) e.preventDefault(); onClick() }}
                    onKeyDown={e => { if (e.key === ' ') { e.preventDefault(); onClick() } }}
                    aria-label={label}
                    aria-current={isActive ? 'page' : undefined}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                    style={{
                      background: isActive ? 'var(--color-primary-light)' : 'transparent',
                      color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.background = 'var(--color-surface-2)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = isActive ? 'var(--color-primary-light)' : 'transparent'
                    }}
                  >
                    <Icon size={20} />
                  </a>
              </Tooltip>
            ))}</>
  )
}
