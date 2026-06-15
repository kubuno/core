import * as Tooltip from '@radix-ui/react-tooltip'
import { useLeftRailStore } from '../store/leftRailStore'

export default function LeftRail() {
  const { entries } = useLeftRailStore()

  if (entries.length === 0) return null

  return (
    <Tooltip.Provider delayDuration={300}>
      <div
        className="w-14 flex-shrink-0 flex flex-col items-center pt-2 pb-2 gap-0.5 rounded-xl"
        style={{ background: 'var(--body-bg)' }}
      >
        {entries.map(({ moduleId, icon: Icon, label, isActive, onClick }) => (
          <Tooltip.Root key={moduleId}>
            <Tooltip.Trigger asChild>
              <button
                onClick={onClick}
                aria-label={label}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
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
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                side="right"
                sideOffset={8}
                className="px-2.5 py-1.5 text-xs rounded-md shadow-md select-none"
                style={{ background: 'var(--color-surface-3)', color: 'var(--color-text-primary)' }}
              >
                {label}
                <Tooltip.Arrow style={{ fill: 'var(--color-surface-3)' }} />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        ))}
      </div>
    </Tooltip.Provider>
  )
}
