import { useTranslation } from 'react-i18next'
import { Users, Lock } from 'lucide-react'

/** Per-field visibility of a profile entry. */
export type Vis = 'public' | 'private'

// Per-field public/private toggle (people icon = visible to others, lock = private).
export function VisToggle({ value, onChange }: { value: Vis; onChange: (v: Vis) => void }) {
  const { t } = useTranslation()
  const isPublic = value === 'public'
  return (
    <button
      type="button"
      onClick={() => onChange(isPublic ? 'private' : 'public')}
      title={isPublic ? t('settings.profile_vis_public', { defaultValue: 'Visible par tous' }) : t('settings.profile_vis_private', { defaultValue: 'Privé' })}
      className="text-text-tertiary hover:text-text-secondary transition-colors"
    >
      {isPublic ? <Users size={13} /> : <Lock size={13} />}
    </button>
  )
}

export function Field({ label, vis, onVis, hint, action, className, children }: {
  label: string; vis?: Vis; onVis?: (v: Vis) => void; hint?: React.ReactNode; action?: React.ReactNode; className?: string; children: React.ReactNode
}) {
  return (
    <div className={className}>
      <div className="flex items-center gap-1.5 mb-1">
        <label className="text-sm font-medium text-text-primary">{label}</label>
        {vis && onVis && <VisToggle value={vis} onChange={onVis} />}
        {action && <span className="ml-auto">{action}</span>}
      </div>
      {children}
      {hint && <div className="text-xs text-text-tertiary mt-1 leading-relaxed">{hint}</div>}
    </div>
  )
}

// Titled card grouping related profile fields (2-column responsive grid inside).
export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border overflow-hidden">
      <div className="px-5 py-3 border-b border-border bg-surface-1">
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      </div>
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">{children}</div>
    </section>
  )
}
