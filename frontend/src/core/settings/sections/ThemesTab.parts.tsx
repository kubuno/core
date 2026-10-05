/**
 * The parts of `ThemesTab.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import { type ThemeDef } from "../../store/themeStore"

function ThemePreview({ theme }: { theme: ThemeDef }) {
  const bg      = theme.vars['--color-surface-1']     ?? '#f8f9fa'
  const surface = theme.vars['--color-surface-0']     ?? '#ffffff'
  const primary = theme.vars['--color-primary']       ?? '#1a73e8'
  const text    = theme.vars['--color-text-primary']  ?? '#202124'
  const textSec = theme.vars['--color-text-secondary'] ?? '#5f6368'
  const border  = theme.vars['--color-border']        ?? '#e0e0e0'
  return (
    <div className="rounded-lg overflow-hidden border" style={{ background: bg, borderColor: border, height: 80 }}>
      <div className="flex items-center gap-1.5 px-2 py-1.5" style={{ background: surface, borderBottom: `1px solid ${border}` }}>
        <div className="rounded-full w-2 h-2" style={{ background: primary }} />
        <div className="rounded h-1.5 w-12" style={{ background: textSec, opacity: 0.3 }} />
        <div className="flex-1" />
        <div className="rounded-full w-4 h-4" style={{ background: primary, opacity: 0.6 }} />
      </div>
      <div className="flex gap-1.5 p-2">
        <div className="flex flex-col gap-1">
          <div className="rounded h-1.5 w-10" style={{ background: primary, opacity: 0.7 }} />
          <div className="rounded h-1.5 w-8"  style={{ background: textSec, opacity: 0.4 }} />
          <div className="rounded h-1.5 w-9"  style={{ background: textSec, opacity: 0.4 }} />
        </div>
        <div className="flex-1 rounded" style={{ background: surface, border: `1px solid ${border}` }}>
          <div className="m-1.5 flex flex-col gap-1">
            <div className="rounded h-1.5 w-14" style={{ background: text, opacity: 0.5 }} />
            <div className="rounded h-1.5 w-10" style={{ background: textSec, opacity: 0.3 }} />
          </div>
        </div>
      </div>
    </div>
  )
}
export { ThemePreview }
