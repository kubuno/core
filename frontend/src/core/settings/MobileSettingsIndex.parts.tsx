/**
 * The parts of `MobileSettingsIndex.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import { ChevronRight } from "lucide-react"
import type { MobileSettingsIndex } from './MobileSettingsIndex'

export function Part1({ nav, navigate, t }: { nav: NonNullable<MobileSettingsIndex['nav']>; navigate: NonNullable<MobileSettingsIndex['navigate']>; t: NonNullable<MobileSettingsIndex['tr']> }) {
  return (
    <>{nav.map(({ id, labelKey, defaultLabel, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => navigate(`/settings?tab=${id}`)}
                className="w-full flex items-center gap-4 px-4 h-[56px] text-left active:bg-surface-2 transition-colors"
              >
                <Icon size={21} className="shrink-0 text-text-secondary" />
                <span className="flex-1 min-w-0 truncate text-[15px] text-text-primary">
                  {t(labelKey, { defaultValue: defaultLabel })}
                </span>
                <ChevronRight size={18} className="shrink-0 text-text-tertiary" />
              </button>
            ))}</>
  )
}
