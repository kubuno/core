// The card that heads a module's administration page: WHICH page of the module
// is open, and WHO its values apply to.
//
// ── Why it is here and not in the navigation tree ────────────────────────────
// A module's pages (`[[setting_groups]]`) used to be rows of the left-hand
// navigation, nested under the module, under "Modules installés", under
// "Applications" — a fourth level. With twenty modules installed, the panel an
// operator uses to FIND an application became a wall of settings pages, and the
// applications themselves stopped being scannable. So the tree now stops at the
// module, and the module's own pages moved here: beside the settings they open,
// one step from the form instead of four levels deep in a menu.
//
// ── One accordion, not a stack of cards ──────────────────────────────────────
// Two things qualify everything on the right — which page, and which scope —
// and they are read in that order. Two separate cards would put them at two
// distances from the form and give the eye nothing to say they are the same
// kind of thing. Sections fold independently: a module with six pages and a
// deep unit tree does not fit twice over in one column, and whichever of the
// two the operator is not using is the one they close.
//
// Nothing here names a module: the identity comes from the inventory row and
// the glyph from `moduleGlyph`, which is the one place the product decides what
// an application looks like.

import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { adminPath } from '../adminRoute'
import { findIcon } from '../../utils/iconMap'
import { moduleGlyph } from '../nav/moduleGlyph'
import type { AdminModule, ModuleSettingGroup } from '../adminModules'
import ScopeTree from './ScopeTree'
import { useResolvedModuleSettings } from './moduleScope'
import { INSTANCE_SCOPE, type ActiveScope } from './scopeTypes'

/**
 * One foldable rubric of the card.
 *
 * The header is a real `<button>` carrying `aria-expanded`: it is a control,
 * not a link, and a screen reader has to be told the state it toggles. The
 * chevron only says which way — the WHOLE header is the target, because a
 * 16px caret is not a click area.
 */
function Section(
  { title, open, onToggle, children }:
  { title: string; open: boolean; onToggle: () => void; children: ReactNode },
) {
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-surface-1"
      >
        {/* Section title: plain 14px bold, no small caps, no accent bar. */}
        <span className="min-w-0 flex-1 truncate text-sm font-bold text-text-primary">{title}</span>
        <ChevronDown
          size={16}
          strokeWidth={1.5}
          className={`shrink-0 text-text-tertiary transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="pb-1">{children}</div>}
    </div>
  )
}

export interface ModuleSidePanelProps {
  module: AdminModule
  /** The pages the module declares, in manifest order. Empty is the normal case. */
  groups: ModuleSettingGroup[]
  /** The page on screen — the row that wears the "you are here" pill. */
  activeGroup: string | null
  /** Does the module declare anything a unit may override? */
  scopable: boolean
  scope: ActiveScope
  onScopeChange: (next: ActiveScope) => void
}

export default function ModuleSidePanel({
  module, groups, activeGroup, scopable, scope, onScopeChange,
}: ModuleSidePanelProps) {
  const { t } = useTranslation()
  // Both open on arrival: the card exists to show what it holds, and a fold the
  // operator has to open before they can see there is anything inside it is a
  // fold that hides the feature.
  const [openPages, setOpenPages] = useState(true)
  const [openScope, setOpenScope] = useState(true)

  // The units that stopped following the instance for at least one of this
  // module's settings — the dot beside a branch in the tree. Read at INSTANCE
  // scope whatever is selected, so the marker does not vanish the moment a unit
  // is opened. Same query key as the settings panel: one request, not two.
  const instanceResolved = useResolvedModuleSettings(module.id, INSTANCE_SCOPE, scopable)
  const overridingUnits = useMemo(() => {
    const ids = new Set<string>()
    for (const s of instanceResolved.byKey.values()) {
      for (const o of s.overrides) if (o.scope_type === 'org_unit') ids.add(o.scope_id)
    }
    return ids
  }, [instanceResolved.byKey])

  const hasPages = groups.length > 0
  // Nothing to fold and nothing to choose: the page heading above already names
  // the module, so an empty card would be a 240px column saying it twice.
  if (!hasPages && !scopable) return null

  const Glyph = moduleGlyph(module)

  return (
    <aside
      // Sticky from `md` up: the form beside it is taller than the screen, and a
      // card that scrolls away takes "which page am I on" with it. Below `md`
      // it is a plain block ABOVE the settings — a 240px column on a phone
      // leaves nothing for the form.
      className="w-full shrink-0 self-start rounded-xl border border-border bg-surface-0
                 md:sticky md:top-4 md:w-60 xl:w-64"
    >
      {/* Identity: whose settings these are, with the face the product already
          gives this application everywhere else. */}
      <div className="flex items-center gap-2.5 border-b border-border px-3 py-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center">
          {Glyph && <Glyph size={24} />}
        </span>
        {/* The application's name, at the head of its own panel: it names what
            every setting below belongs to, so it takes the title step rather
            than the body one. */}
        <span className="min-w-0 flex-1 font-medium leading-snug text-text-primary"
          style={{ fontSize: 'var(--kb-text-title)' }}>
          {module.display_name}
        </span>
      </div>

      {hasPages && (
        <Section
          title={t('admin.m_pages_panel')}
          open={openPages}
          onToggle={() => setOpenPages(v => !v)}
        >
          <div className="space-y-0.5 px-2 pb-1">
            {groups.map(g => {
              const isActive = g.id === activeGroup
              const Icon = findIcon(g.icon)
              return (
                // A real <Link> with a real href: middle-click, "open in new
                // tab" and the status bar all have to work, which an
                // onClick-only row silently breaks.
                <Link
                  key={g.id}
                  to={adminPath('modules', module.id, g.id)}
                  title={g.label}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex w-full min-w-0 items-center gap-2 rounded-full px-2 py-1.5 text-sm
                              transition-colors ${
                    isActive
                      ? 'bg-primary-light font-medium text-primary'
                      : 'text-text-secondary hover:bg-surface-2'}`}
                >
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                    {Icon && <Icon size={16} strokeWidth={1.5} />}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{g.label}</span>
                </Link>
              )
            })}
          </div>
        </Section>
      )}

      {scopable && (
        <Section
          title={t('admin.m_scope_units')}
          open={openScope}
          onToggle={() => setOpenScope(v => !v)}
        >
          <ScopeTree scope={scope} onChange={onScopeChange} overriding={overridingUnits} />
        </Section>
      )}
    </aside>
  )
}
