/**
 * The parts of `ClientsTab.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import { type LucideIcon } from "lucide-react"

function StoreBadge({ href, Icon, top, bottom, sub }: {
  href: string; Icon: LucideIcon; top: string; bottom: string; sub?: string
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-3 rounded-xl bg-[#1f1f1f] hover:bg-black text-white px-5 py-2.5 transition-colors">
      <Icon size={26} className="shrink-0" />
      <span className="flex flex-col leading-tight text-left">
        <span className="text-[10px] uppercase tracking-wider opacity-75">{top}</span>
        <span className="text-lg font-semibold -mt-0.5">{bottom}</span>
        {sub && <span className="text-[10px] opacity-70 -mt-0.5">{sub}</span>}
      </span>
    </a>
  )
}
export { StoreBadge }
