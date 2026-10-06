/**
 * The parts of `MobileFab.kbcontrol` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import WaffleButton from "../menus/WaffleButton"
import type { MobileFab } from './MobileFab'

export function Part1({ open, landscape, immersive, allWaffleApps, setOpen }: { open: NonNullable<MobileFab['open']>; landscape: NonNullable<MobileFab['landscape']>; immersive: NonNullable<MobileFab['immersive']>; allWaffleApps: NonNullable<MobileFab['allWaffleApps']>; setOpen: NonNullable<MobileFab['setOpen']> }) {
  return (
    <div
            data-app-chrome
            className={`lg:hidden fixed right-4 ${open ? 'z-[9999]' : 'z-[44]'}`}
            style={{ bottom: landscape && !immersive ? 'calc(16px + env(safe-area-inset-bottom))' : 'calc(72px + env(safe-area-inset-bottom))' }}
          >
            <WaffleButton allApps={allWaffleApps} fab onOpenChange={setOpen} />
          </div>
  )
}
