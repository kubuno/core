/**
 * The parts of `AppearanceDialog.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import { Dropdown } from "@ui"
import type { AppearanceDialog } from './AppearanceDialog'

function ModeMock({ variant }: { variant: 'light' | 'dark' | 'system' }) {
  const dark  = variant === 'dark'
  const bg    = dark ? '#202124' : '#ffffff'
  const line  = dark ? '#5f6368' : '#dadce0'
  const half  = variant === 'system'
  return (
    <div className="relative w-full h-24 rounded-lg overflow-hidden border border-black/10" style={{ background: bg }}>
      {half && <div className="absolute inset-y-0 right-0 w-1/2" style={{ background: '#202124' }} />}
      <div className="absolute top-2 left-2 w-5 h-5 rounded bg-primary text-white text-[9px] font-bold flex items-center justify-center">31</div>
      <div className="absolute top-8 left-2 right-2 h-4 rounded-full bg-white border border-black/10 flex items-center px-1.5 gap-1">
        <span className="text-black text-[10px] leading-none">＋</span>
        <span className="flex-1 h-px" style={{ background: line }} />
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="absolute left-2 right-2 h-px" style={{ top: 56 + i * 8, background: line }} />
      ))}
    </div>
  )
}
export { ModeMock }

export function Part1({ current, setPref, moduleId, schemeOptions }: { current: NonNullable<AppearanceDialog['current']>; setPref: NonNullable<AppearanceDialog['setPref']>; moduleId: NonNullable<AppearanceDialog['props']['moduleId']>; schemeOptions: NonNullable<AppearanceDialog['schemeOptions']> }) {
  return (
    <Dropdown value={current.scheme} onChange={(v) => setPref(moduleId, { scheme: v })} options={schemeOptions} width="100%" variant="ghost" height={28} />
  )
}

export function Part2({ current, setPref, moduleId, densityOptions }: { current: NonNullable<AppearanceDialog['current']>; setPref: NonNullable<AppearanceDialog['setPref']>; moduleId: NonNullable<AppearanceDialog['props']['moduleId']>; densityOptions: NonNullable<AppearanceDialog['densityOptions']> }) {
  return (
    <Dropdown value={current.density} onChange={(v) => setPref(moduleId, { density: v })} options={densityOptions} width="100%" variant="ghost" height={28} />
  )
}
