/**
 * The parts of `ScopeStatusPill.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import type { ReactNode } from "react"
import { CornerDownRight, Lock, Pencil, Users } from "lucide-react"
import { scopeLabel } from "./ProvenanceLine"
import type { ScopeStatusPill } from './ScopeStatusPill'

function Pill({ tone, icon, children, title }: {
  tone:     'neutral' | 'primary' | 'warning'
  icon:     ReactNode
  children: ReactNode
  title?:   string
}) {
  const skin = {
    neutral: 'bg-surface-2 text-text-secondary',
    primary: 'bg-primary-light text-primary',
    warning: 'bg-warning-light text-text-primary',
  }[tone]
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 ${skin}`}
      style={{ fontSize: 'var(--kb-text-micro)' }}
    >
      {icon}
      {children}
    </span>
  )
}
export { Pill }

export function Part1({ t }: { t: NonNullable<ScopeStatusPill['tr']> }) {
  return (
    <Pill
            tone="neutral"
            icon={<Lock size={10} className="shrink-0" />}
            title={t('admin.m_instance_only_hint', {
              defaultValue: "Ce réglage vaut pour toute l'instance et ne varie pas par unité.",
            })}
          >
            {t('admin.m_instance_only', { defaultValue: "Toute l'instance" })}
          </Pill>
  )
}

export function Part2({ t, count }: { t: NonNullable<ScopeStatusPill['tr']>; count: NonNullable<ScopeStatusPill['count']> }) {
  return (
    <Pill
            tone="neutral"
            icon={<Users size={10} className="shrink-0" />}
            title={t('admin.m_overridden_below_hint', {
              count,
              defaultValue: `${count} portée(s) remplacent ce réglage et ne suivront pas cette valeur.`,
            })}
          >
            {t('admin.m_overridden_below', { count, defaultValue: `${count} remplacement(s)` })}
          </Pill>
  )
}

export function Part3({ t, resolved }: { t: NonNullable<ScopeStatusPill['tr']>; resolved: ScopeStatusPill['props']['resolved'] }) {
  return (
    <Pill
            tone="warning"
            icon={<Lock size={10} className="shrink-0 text-warning" />}
            title={t('admin.prov_locked', {
              scope: scopeLabel(t, resolved?.lock_source?.scope_type, resolved?.lock_source?.scope_name),
              defaultValue: 'Verrouillé par un niveau supérieur',
            })}
          >
            {t('admin.m_pill_locked', { defaultValue: 'Verrouillé' })}
          </Pill>
  )
}

export function Part4({ t }: { t: NonNullable<ScopeStatusPill['tr']> }) {
  return (
    <Pill tone="primary" icon={<Pencil size={10} className="shrink-0" />}>
            {t('admin.m_pill_overridden', { defaultValue: 'Remplacé' })}
          </Pill>
  )
}

export function Part5({ t, resolved }: { t: NonNullable<ScopeStatusPill['tr']>; resolved: ScopeStatusPill['props']['resolved'] }) {
  return (
    <Pill
          tone="neutral"
          icon={<CornerDownRight size={10} className="shrink-0" />}
          title={t('admin.prov_inherited', {
            scope: scopeLabel(t, resolved?.source?.scope_type, resolved?.source?.scope_name),
            defaultValue: 'Valeur héritée',
          })}
        >
          {t('admin.m_pill_inherited', { defaultValue: 'Hérité' })}
        </Pill>
  )
}
