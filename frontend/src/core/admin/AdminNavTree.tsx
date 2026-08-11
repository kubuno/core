import { type ComponentType, type ReactNode, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ChevronRight, CircleSlash, TriangleAlert } from 'lucide-react'
import { ADMIN_NAV, NAV_INDEX, filterNav, firstLeafOf, type AdminNavItem } from './adminNav'
import { adminPath, useAdminPlace } from './adminRoute'
import {
  LIVE_STATE_KEY, groupsOf, useAdminModules, useModuleLiveState,
  type AdminModule, type ModuleLiveState,
} from './adminModules'
import { WaffleAppRegistry } from '../registry/WaffleAppRegistry'
import { findIcon } from '../utils/iconMap'
import { usePrivileges } from '../authz/usePrivileges'

// Rendered inside AppSidebar as the left panel while on /admin (replaces the
// module navigation), like the Settings sidebar. Which entry is current comes
// from the PATH (`/admin/users`), read through `useAdminPlace` — the panel lives
// in the shell, above the `admin/:tab` route match, so it reads the location
// rather than route params.
//
// Every navigable entry is a real <Link> carrying a real href: middle-click,
// "open in new tab" and the status bar all have to work, which an onClick-only
// row silently breaks. A GROUP is not a destination (it expands), so it stays an
// anchor with `href="#"` + preventDefault, per the sidebar convention.
//
// The tree is pruned to the caller's privileges — in BOTH layouts. The collapsed
// icon rail is a second entry point into the very same sections: filtering only
// the expanded tree would leave clickable icons pointing at forbidden sections.
//
// ── Rows that are not in ADMIN_NAV ───────────────────────────────────────────
// Applications ▸ Modules installés unfolds into one row per installed module.
// Those rows cannot be declared: the core never knows a module by name, it
// discovers them from `/admin/modules`. So the branch is grafted here, at render
// time, from the live inventory — and it is LIVE: `useAdminModules` invalidates
// on the module lifecycle events the core already pushes over the WebSocket, so
// installing, enabling or losing a module redraws this menu with no reload.
//
// Such a parent is BOTH a destination (the list) and a group (the modules), a
// combination the declared tree has no other example of. It is rendered as two
// controls sharing one row — a chevron button that expands, and a link that
// navigates — rather than as an anchor containing a button, which is invalid
// markup and unusable with a keyboard.
//
// ── A fourth level, also discovered ──────────────────────────────────────────
// A module may split its own administration into pages (`[[setting_groups]]` in
// its manifest), and each is a row under it: Applications ▸ Modules installés ▸
// Mail ▸ Filtrage. Same shape as above, one level down — the module row becomes
// a destination-and-branch too. Nothing about those pages is declared in the
// core: their ids, labels, icons and order all arrive with the inventory, so a
// module that declares none stays the plain leaf it has always been. The extra
// depth is what `indent()` compensates for.

/** One page OF a runtime record — the last segment of `/admin/<sec>/<rec>/<pane>`. */
interface DynamicNavPane {
  /** Stable, untranslated slug: it is the path segment. */
  id:    string
  /** Already-translated label, declared by whoever owns the record. */
  label: string
  /** Lucide name; absent or unknown simply shows no icon (see `findIcon`). */
  icon?: string | null
}

/** A menu row discovered at runtime rather than declared in ADMIN_NAV. */
interface DynamicNavChild {
  /** Record id — the segment after the section (`/admin/modules/<id>`). */
  id:    string
  /** Already-translated label: a display name, not a translation key. */
  label: string
  /**
   * The module's own glyph, as it appears everywhere else in the product — a
   * row of twenty-odd names reads as a list; the same row with each
   * application's icon reads as the applications the operator already knows.
   *
   * A component, not an icon name, because `WaffleAppRegistry` is where a
   * module's face is actually decided and some of them are BRAND LOGOS in
   * colour (PaintSharp), which no name-to-Lucide map can express.
   */
  Icon?: ComponentType<{ size?: number; className?: string }> | null
  /** How the row is toned down or flagged, and why (shown as its tooltip). */
  state: ModuleLiveState
  /**
   * The record's own pages, when it declares any — a fourth level of menu.
   *
   * Empty is the normal case and stays a plain leaf: most modules declare no
   * group, and giving them a chevron that unfolds nothing would be a lie.
   */
  panes: DynamicNavPane[]
}

/** Section id → its runtime children. Empty for a caller who may not read them. */
/**
 * A module's face, from the one place the product already decides it.
 *
 * `WaffleAppRegistry` is populated at runtime by each module's own bundle, and
 * it is what the waffle menu, the shell sidebar and the app grid all read — so
 * taking anything else here would give the console a second, quietly divergent
 * answer to "what does this application look like". It also carries brand logos
 * in colour, which an icon NAME cannot.
 *
 * The registry only knows a module whose bundle has been LOADED, which a
 * disabled or unreachable module's never is — and those are exactly the rows an
 * operator needs to recognise. Hence the fallback on the icon name the core
 * stores at registration, which survives the module being down.
 */
function moduleIcon(m: AdminModule): ComponentType<{ size?: number; className?: string }> | null {
  const entry = WaffleAppRegistry.get(m.id)
  // The module's ROOT app — the one whose id is the module's own; a sub-app
  // (Office ▸ Documents) carries its own glyph, not the application's.
  const root = entry?.apps.find(a => a.id === m.id) ?? entry?.apps[0]
  return root?.Icon ?? findIcon(m.icon)
}

function useDynamicChildren(): Record<string, DynamicNavChild[]> {
  const { data }  = useAdminModules()
  const liveState = useModuleLiveState()

  return useMemo<Record<string, DynamicNavChild[]>>(() => {
    const modules: DynamicNavChild[] = [...(data ?? [])]
      .sort((a, b) => a.display_name.localeCompare(b.display_name))
      .map(m => ({
        id:    m.id,
        label: m.display_name,
        Icon:  moduleIcon(m),
        state: liveState(m),
        // Declared by the module, forwarded verbatim by the core with the
        // inventory: no request per module, and no module named here.
        panes: groupsOf(m).map(g => ({ id: g.id, label: g.label, icon: g.icon })),
      }))
    return { modules }
  }, [data, liveState])
}

/**
 * The glyph that tells a switched-off module from a broken one.
 *
 * They are NOT the same fact and must not share one appearance: `disabled` is
 * an administrator's decision (neutral, the row is simply muted), `unreachable`
 * is an incident (a warning sign — the module is switched on and serving
 * nothing). A running module carries no glyph at all: the absence is the
 * normal state, and marking it would drown the two that matter.
 */
function StateGlyph({ state, title }: { state: ModuleLiveState; title: string }) {
  if (state === 'disabled') {
    return <CircleSlash size={13} className="shrink-0 text-text-tertiary" aria-label={title} />
  }
  if (state === 'unreachable') {
    return <TriangleAlert size={13} className="shrink-0 text-warning" aria-label={title} />
  }
  return null
}

/**
 * Expansion key of a runtime RECORD's branch.
 *
 * Section ids come from `ADMIN_NAV` and never contain a colon, so this cannot
 * collide with one — the two live in the same set.
 */
const recordKey = (tab: string, id: string) => `${tab}:${id}`

export default function AdminNavTree({ collapsed }: { collapsed?: boolean }) {
  const { t }       = useTranslation()
  const { can }     = usePrivileges()
  const place       = useAdminPlace()
  const active      = place.tab
  const activeMeta  = NAV_INDEX.get(active)
  const dynamic     = useDynamicChildren()

  const nav = useMemo(() => filterNav(ADMIN_NAV, can), [can])

  // Expanded sections: seed with the active leaf's ancestor chain.
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(activeMeta?.ancestors ?? []))

  // Keep the active leaf's ancestors expanded on nav — plus the leaf itself when
  // it carries runtime children and one of them is open, so that landing
  // straight on `/admin/modules/drive` shows the row it highlighted, and the
  // record itself when one of ITS pages is open (`/admin/modules/mail/filtering`).
  useEffect(() => {
    setExpanded(prev => {
      const next = new Set(prev)
      activeMeta?.ancestors.forEach(a => next.add(a))
      if (place.entity) next.add(active)
      // Being ON the record is enough — a bare `/admin/modules/mail` shows that
      // module's first page, so the menu has to show which page that is.
      if (place.entity) next.add(recordKey(active, place.entity))
      return next
    })
  }, [active, place.entity]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (id: string) =>
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  // Collapsed icon rail: top-level icons only; a group jumps to its first leaf.
  if (collapsed) {
    return (
      <nav className="flex-1 min-h-0 overflow-y-auto px-2 space-y-0.5">
        {nav.map(it => (
          <Link
            key={it.id} to={adminPath(firstLeafOf(it))} title={t(it.labelKey)}
            aria-current={it.id === activeMeta?.topId ? 'page' : undefined}
            className={`w-full flex items-center justify-center py-2.5 rounded-full transition-colors ${
              it.id === activeMeta?.topId ? 'bg-primary-light text-primary' : 'text-text-secondary hover:bg-surface-2'}`}
          >
            {it.Icon && <it.Icon size={18} className="shrink-0" />}
          </Link>
        ))}
      </nav>
    )
  }

  /** Shared row skin. `state` is the row's own visual state, never a hover. */
  const rowClass = (isActive: boolean, ringed: boolean) =>
    `w-full flex items-center gap-2 pr-3 py-2 rounded-full text-sm text-left transition-colors ${
      isActive
        ? 'bg-primary-light text-primary font-medium'
        : `text-text-secondary hover:bg-surface-2 ${ringed ? 'ring-1 ring-border' : ''}`}`

  /**
   * Left inset that aligns a label under its parent's (icon width at depth 0).
   *
   * ONE step, the same at every level. A shallower step past depth 2 was tried
   * — to buy label width for a module's own pages, which sit at depth 3
   * (Applications ▸ Modules installés ▸ Mail ▸ Filtrage) — and it does not
   * read: 10px is below the threshold at which the eye sees a nesting at all,
   * so the pages looked like siblings of the module rather than its children.
   * An indentation that has to be measured to be believed is not doing its job.
   *
   * The width it costs is real, and paid for elsewhere: these rows carry an
   * icon, long labels ellipse with the full text on the row's tooltip, and the
   * sidebar is resizable to 360px — which is what the two longest labels want.
   */
  const INDENT_STEP = 22
  const indent = (depth: number) =>
    depth === 0 ? 12 : 34 + (depth - 1) * INDENT_STEP

  /**
   * Inset of a record's PAGES — and the reason this is not just `indent()`.
   *
   * `indent()` positions the row box. What a reader actually perceives as
   * nesting is where the LABEL starts, and a record's row spends 26px before
   * its own label that a page's row does not: a chevron (16) and the gap after
   * it (8), then its icon and gap, minus the icon and gap a page carries too.
   * Ignoring that put the pages' labels 4px to the LEFT of their parent's —
   * indentation that reads as an outdent, which is exactly how the tree looked
   * like a flat list interrupted by a module.
   *
   * So the pages are placed FROM the parent's label, plus one step. Written as
   * an offset rather than a constant so it cannot drift the day the row gains
   * or loses a control.
   */
  const CHEVRON_W = 16
  const ROW_GAP   = 8
  const paneIndent = (recordDepth: number) =>
    indent(recordDepth) + CHEVRON_W + ROW_GAP + INDENT_STEP

  /**
   * The pages OF a record — one address each, deepest level of the tree.
   *
   * `railX` draws the guide: a hairline dropping from the record's chevron and
   * elbowing into the last page. Indentation alone says "these are children";
   * the rail says WHOSE, which is what a list of twenty modules needs — the
   * pages of Mail sit right above Maps, and nothing else in the row separates
   * the two families. Decorative, hence `aria-hidden`: the nesting is already
   * carried for assistive technology by the markup.
   */
  const renderPanes = (
    tab: string, record: string, panes: DynamicNavPane[], recordDepth: number, railX: number,
  ): ReactNode =>
    panes.map((pane, index) => {
      const isActive = tab === active && place.entity === record && place.pane === pane.id
      const Icon = findIcon(pane.icon)
      const isLast = index === panes.length - 1
      return (
        <div key={`${tab}:${record}:${pane.id}`} className="relative">
          {/* Overshoots by 3px top and bottom so the `space-y` gaps between
              rows do not chop the line into dashes. */}
          <span
            aria-hidden
            className="absolute w-px bg-text-tertiary"
            style={{ left: railX, top: -3, bottom: isLast ? '50%' : -3 }}
          />
          {isLast && (
            <span
              aria-hidden
              className="absolute h-px bg-text-tertiary"
              style={{ left: railX, top: '50%', width: Math.max(paneIndent(recordDepth) - railX - 4, 0) }}
            />
          )}
        <Link
          to={adminPath(tab, record, pane.id)}
          title={pane.label}
          aria-current={isActive ? 'page' : undefined}
          style={{ paddingLeft: paneIndent(recordDepth) }}
          className={rowClass(isActive, false)}
        >
          <span className="w-4 h-4 flex items-center justify-center shrink-0">
            {Icon && <Icon size={15} />}
          </span>
          <span className="truncate flex-1">{pane.label}</span>
        </Link>
        </div>
      )
    })

  const renderDynamic = (tab: string, children: DynamicNavChild[], depth: number): ReactNode =>
    children.map(child => {
      const onRecord   = tab === active && place.entity === child.id
      const hasPanes   = child.panes.length > 0
      const key        = recordKey(tab, child.id)
      const isOpen     = hasPanes && expanded.has(key)
      // A record with pages is a place AND a branch, exactly like the section
      // above it: while the branch is unfolded its page rows carry the
      // highlight, folded the record's own row has to.
      const isActive   = onRecord && (!hasPanes || !place.pane)
      const holdsPane  = onRecord && hasPanes && !!place.pane && !isOpen
      const notable    = child.state === 'disabled' || child.state === 'unreachable'
      const stateLabel = t(LIVE_STATE_KEY[child.state])
      const title      = notable ? `${child.label} — ${stateLabel}` : child.label
      // Its first page, when it has any: the record's bare address heals to that
      // page anyway, and a menu row that redirects on arrival flickers.
      const target     = adminPath(tab, child.id, hasPanes ? child.panes[0].id : null)
      const chevron    = (
        <ChevronRight size={15} className={`transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      )
      // The SLOT is kept even when there is no glyph, so one module missing an
      // icon does not shift its neighbours' labels out of column.
      const RecordIcon = child.Icon
      const label = (
        <>
          <span className="w-[18px] shrink-0 flex items-center justify-center">
            {RecordIcon && <RecordIcon size={16} />}
          </span>
          <span className={`truncate flex-1 ${
            !isActive && child.state === 'disabled' ? 'text-text-tertiary' : ''}`}>
            {child.label}
          </span>
          <StateGlyph state={child.state} title={stateLabel} />
        </>
      )
      return (
        <div key={key}>
          {hasPanes ? (
            // Two controls, one row — same shape as a hybrid section: nesting the
            // chevron button inside the anchor would be invalid markup and would
            // trap the keyboard.
            <div style={{ paddingLeft: indent(depth) }} className={rowClass(isActive || holdsPane, false)}>
              <button
                type="button" aria-expanded={isOpen}
                aria-label={t(isOpen ? 'admin.nav_collapse' : 'admin.nav_expand', { section: child.label })}
                onClick={() => toggle(key)}
                className="w-4 h-4 flex items-center justify-center shrink-0 rounded-full hover:text-text-primary"
              >
                {chevron}
              </button>
              <Link
                to={target} title={title}
                aria-current={isActive ? 'page' : undefined}
                className="flex items-center gap-2 min-w-0 flex-1"
              >
                {label}
              </Link>
            </div>
          ) : (
            <Link
              to={target} title={title}
              aria-current={isActive ? 'page' : undefined}
              style={{ paddingLeft: indent(depth) }}
              className={rowClass(isActive, false)}
            >
              <span className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          )}
          {isOpen && (
            <div className="mt-0.5 space-y-0.5">
              {/* The rail hangs from the chevron the reader just clicked: its
                  centre is the row's inset plus half the 16px control. */}
              {renderPanes(tab, child.id, child.panes, depth, indent(depth) + 8)}
            </div>
          )}
        </div>
      )
    })

  const renderItems = (items: AdminNavItem[], depth: number): ReactNode =>
    items.map(item => {
      const runtime  = dynamic[item.id] ?? []
      const declared = item.children ?? []
      const isGroup  = declared.length > 0
      // Both a place and a branch: the section's own page, plus its records.
      const isHybrid = !isGroup && runtime.length > 0
      const isOpen   = expanded.has(item.id)
      // On the section itself. `aria-current="page"` is reserved for exactly
      // this: the row whose href IS the address.
      const isActive = !isGroup && item.id === active && !(isHybrid && place.entity)
      // One of its records is open. While the branch is unfolded the record's
      // own row carries the highlight; folded, the parent has to, or nothing on
      // screen says where the operator is.
      const holdsRecord = isHybrid && item.id === active && !!place.entity && !isOpen
      const padLeft  = indent(depth)
      const chevron  = (
        <ChevronRight size={15} className={`transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      )
      const label = (
        <>
          {depth === 0 && item.Icon && <item.Icon size={18} className="shrink-0" />}
          <span className="truncate flex-1">{t(item.labelKey)}</span>
          {item.badge && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary-light text-primary shrink-0">
              {item.badge}
            </span>
          )}
        </>
      )
      const body = (
        <>
          <span className="w-4 h-4 flex items-center justify-center shrink-0">
            {isGroup && chevron}
          </span>
          {label}
        </>
      )
      return (
        <div key={item.id}>
          {isGroup ? (
            // Expand-only: it names no address, so the anchor is the sidebar's
            // "pure action" form — href="#" plus preventDefault, or the page
            // jumps to the top and the URL grows a stray hash.
            <a
              href="#" role="button" aria-expanded={isOpen}
              onClick={e => { e.preventDefault(); toggle(item.id) }}
              style={{ paddingLeft: padLeft }} className={rowClass(false, isOpen)}
            >
              {body}
            </a>
          ) : isHybrid ? (
            // Two controls, one row: the chevron opens the branch, the link
            // opens the section. Nesting the button inside the anchor would be
            // invalid markup and would trap the keyboard.
            <div style={{ paddingLeft: padLeft }} className={rowClass(isActive || holdsRecord, false)}>
              <button
                type="button" aria-expanded={isOpen}
                aria-label={t(isOpen ? 'admin.nav_collapse' : 'admin.nav_expand', { section: t(item.labelKey) })}
                onClick={() => toggle(item.id)}
                className="w-4 h-4 flex items-center justify-center shrink-0 rounded-full hover:text-text-primary"
              >
                {chevron}
              </button>
              <Link
                to={adminPath(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className="flex items-center gap-2 min-w-0 flex-1"
              >
                {label}
              </Link>
            </div>
          ) : (
            <Link
              to={adminPath(item.id)}
              aria-current={isActive ? 'page' : undefined}
              style={{ paddingLeft: padLeft }} className={rowClass(isActive, false)}
            >
              {body}
            </Link>
          )}
          {isGroup && isOpen && <div className="mt-0.5 space-y-0.5">{renderItems(declared, depth + 1)}</div>}
          {isHybrid && isOpen && (
            <div className="mt-0.5 space-y-0.5">{renderDynamic(item.id, runtime, depth + 1)}</div>
          )}
        </div>
      )
    })

  const primary   = nav.filter(i => !i.secondary)
  const secondary = nav.filter(i => i.secondary)

  return (
    // min-h-0 + overflow-y-auto: the panel scrolls within its flex slot instead of
    // being clipped by the sidebar (which is overflow-hidden) once every section shows.
    <nav className="flex-1 min-h-0 overflow-y-auto px-3 space-y-0.5">
      {/* Panel section title: 14px bold, no forced caps and no letter-spacing. */}
      <p className="px-3 pt-1 pb-2 text-sm font-bold text-text-secondary">
        {t('user.admin')}
      </p>
      {renderItems(primary, 0)}
      {renderItems(secondary, 0)}
    </nav>
  )
}
