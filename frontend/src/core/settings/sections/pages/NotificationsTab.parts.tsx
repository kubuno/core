/**
 * The parts of `NotificationsTab.kbcontrol` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import { Checkbox } from "@ui"
import type { NotificationsTab } from './NotificationsTab'

function NotifCheck({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return <Checkbox checked={checked} onChange={onChange} />
}
export { NotifCheck }

export function Part1({ g, cell, toggle }: { g: NotificationsTab['rows_groups'][number]['g']; cell: NotificationsTab['cell']; toggle: NotificationsTab['toggle'] }) {
  return (
    <>{g.activities.map(a => {
                    const k = `${g.moduleId}:${a.id}`
                    const c = cell(k, a)
                    return (
                      <div key={k} className="flex items-center py-2.5 border-b border-border/60 last:border-0">
                        <span className="flex-1 text-sm text-text-primary pr-4">{a.label}</span>
                        <span className="w-16 flex justify-center"><NotifCheck checked={c.email} onChange={() => toggle(k, a, 'email')} /></span>
                        <span className="w-16 flex justify-center"><NotifCheck checked={c.push} onChange={() => toggle(k, a, 'push')} /></span>
                      </div>
                    )
                  })}</>
  )
}
