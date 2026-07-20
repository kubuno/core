import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

interface Props {
  title:         string
  icon:          React.ReactNode
  link?:         string
  linkLabel?:    string
  children:      React.ReactNode
  containerRef?: React.Ref<HTMLDivElement>
}

export default function DashboardWidget({ title, icon, link, linkLabel = 'Voir tout', children, containerRef }: Props) {
  return (
    <div ref={containerRef} className="bg-[var(--color-surface-card)] rounded-2xl border-[3px] border-[var(--color-surface-card-border)] overflow-hidden flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--color-surface-card-border)] flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {icon}
          <h2 className="text-sm font-semibold text-text-primary truncate">{title}</h2>
        </div>
        {link && (
          <Link
            to={link}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            {linkLabel}
            <ArrowRight size={11} />
          </Link>
        )}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">{children}</div>
    </div>
  )
}
