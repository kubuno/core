import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ChevronDown, CircleSlash, Pin, PinOff, TriangleAlert } from 'lucide-react'
import {
  ADMIN_NAV, NAV_INDEX, canSeeTab, filterNav, firstLeafOf,
  type AdminNavItem, type NavMeta,
} from './adminNav'
import { adminPath, useAdminPlace } from './adminRoute'
import {
  LIVE_STATE_KEY, groupsOf, useAdminModules, useModuleLiveState, type ModuleLiveState,
} from './adminModules'
import { usePrivileges } from '../authz/usePrivileges'
import { useAdminPins } from './nav/adminPins'
import { moduleGlyph, type ModuleGlyph } from './nav/moduleGlyph'
import { AdminLogo } from './AdminLogo'

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
// ── Where the tree stops ─────────────────────────────────────────────────────
// A module may split its own administration into pages (`[[setting_groups]]` in
// its manifest), and those pages are NOT rows of this tree. A module is a LEAF
// here, whatever it declares: its pages live in the accordion card of its own
// page (`settings/ModuleSidePanel`), beside the settings they open. Twenty
// modules each unfolding five pages turned this panel into a wall in which the
// applications themselves — the thing an operator scans for — stopped being
// findable. The module row still points AT a page (the first one), so the
// address it hands out is the one the page ends up on.

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
  Icon?: ModuleGlyph | null
  /** How the row is toned down or flagged, and why (shown as its tooltip). */
  state: ModuleLiveState
  /**
   * The first page the record declares, when it declares any.
   *
   * Only the FIRST one, because that is all this tree needs: the row links
   * straight to it rather than to the record's bare address, which would
   * redirect on arrival and make the view flicker. The other pages are the
   * business of the record's own page.
   */
  firstPane: string | null
}

/** Section id → its runtime children. Empty for a caller who may not read them. */
function useDynamicChildren(): Record<string, DynamicNavChild[]> {
  const { data }  = useAdminModules()
  const liveState = useModuleLiveState()

  return useMemo<Record<string, DynamicNavChild[]>>(() => {
    const modules: DynamicNavChild[] = [...(data ?? [])]
      .sort((a, b) => a.display_name.localeCompare(b.display_name))
      .map(m => ({
        id:    m.id,
        label: m.display_name,
        Icon:  moduleGlyph(m),
        state: liveState(m),
        // Declared by the module, forwarded verbatim by the core with the
        // inventory: no request per module, and no module named here.
        firstPane: groupsOf(m)[0]?.id ?? null,
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
 * The control that puts a page in — or takes it out of — the shortcut list.
 *
 * Revealed on hover of its row and on keyboard focus, never permanently: it is
 * a preference, and fifteen always-visible pins would compete with the labels
 * they sit next to. It is a sibling of the row's link, not a child of it: a
 * button inside an anchor is invalid markup and unusable with a keyboard.
 */
function PinButton(
  { pinned, offered, label, onToggle }:
  { pinned: boolean; offered: boolean; label: string; onToggle: () => void },
) {
  return (
    // The SLOT is always there, even when the control is not: a button that
    // appears on hover and pushes the label as it does turns every pass of the
    // mouse down the menu into a ripple of moving text.
    <span className="ml-1 flex h-6 w-6 shrink-0 items-center justify-center">
      {/* The list is full and this page is not in it: nothing to offer. */}
      {(pinned || offered) && (
        <button
          type="button"
          onClick={onToggle}
          aria-label={label}
          title={label}
          className="flex h-6 w-6 items-center justify-center rounded-full opacity-0
                     transition-opacity hover:text-text-primary
                     focus-visible:opacity-100 group-hover/row:opacity-100"
        >
          {pinned ? <PinOff size={14} strokeWidth={1.5} /> : <Pin size={14} strokeWidth={1.5} />}
        </button>
      )}
    </span>
  )
}

/** Is this top-level section one of the ones folded behind "Afficher plus" ? */
const isSecondaryTop = (topId: string | undefined): boolean =>
  !!topId && ADMIN_NAV.some(i => i.secondary && i.id === topId)

export default function AdminNavTree({ collapsed }: { collapsed?: boolean }) {
  const { t }       = useTranslation()
  const { can }     = usePrivileges()
  const place       = useAdminPlace()
  const active      = place.tab
  const activeMeta  = NAV_INDEX.get(active)
  const dynamic     = useDynamicChildren()
  const pins        = useAdminPins()

  const nav = useMemo(() => filterNav(ADMIN_NAV, can), [can])

  /**
   * The less-travelled sections, folded away until asked for.
   *
   * A menu whose every branch is on screen at once is a wall, and the sections
   * an operator opens once a quarter (facturation, automatisation, système) are
   * exactly the ones that make it one. They are declared `secondary` and live
   * behind one row — but the fold opens by itself when the address IS one of
   * them, because arriving on a page whose entry is hidden reads as a bug.
   */
  const [showMore, setShowMore] = useState(() => isSecondaryTop(activeMeta?.topId))
  useEffect(() => {
    if (isSecondaryTop(activeMeta?.topId)) setShowMore(true)
  }, [activeMeta?.topId])

  // Expanded sections: seed with the active leaf's ancestor chain.
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(activeMeta?.ancestors ?? []))

  // Keep the active leaf's ancestors expanded on nav — plus the leaf itself when
  // it carries runtime children and one of them is open, so that landing
  // straight on `/admin/modules/drive` shows the row it highlighted.
  useEffect(() => {
    setExpanded(prev => {
      const next = new Set(prev)
      activeMeta?.ancestors.forEach(a => next.add(a))
      if (place.entity) next.add(active)
      return next
    })
  }, [active, place.entity]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (id: string) =>
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  // Collapsed icon rail: top-level icons only; a group jumps to its first leaf.
  if (collapsed) {
    return (
      <nav className="flex-1 min-h-0 overflow-y-auto px-2">
        {/* The console's mark, at the head of the rail — the one thing that says
            "administration" once every label is hidden. Links back to the landing. */}
        <Link
          to={adminPath()} title={t('user.admin')}
          className="mb-1 flex h-10 items-center justify-center rounded-full hover:bg-surface-2 transition-colors"
        >
          <AdminLogo size={24} />
        </Link>
        {nav.map(it => (
          <Link
            key={it.id} to={adminPath(firstLeafOf(it))} title={t(it.labelKey)}
            aria-current={it.id === activeMeta?.topId ? 'page' : undefined}
            className={`w-full h-10 flex items-center justify-center rounded-full transition-colors ${
              it.id === activeMeta?.topId ? 'bg-primary-light text-primary' : 'text-text-secondary hover:bg-surface-2'}`}
          >
            {it.Icon && <it.Icon size={20} strokeWidth={1.5} className="shrink-0" />}
          </Link>
        ))}
      </nav>
    )
  }

  /**
   * Shared row skin. The second flag is for a row that does not name the current
   * address but CONTAINS it — a folded group whose branch the operator is inside.
   *
   * It is toned, not filled: the filled pill has exactly one meaning in this
   * panel, "you are here", and a second filled row would make the reader look
   * twice to find which of the two is the page. The accent colour alone is
   * enough to say "down there", and it is what keeps a collapsed tree from
   * losing every trace of where its reader is.
   *
   * No horizontal gap of its own: the fold column and the trailing controls
   * carry their own spacing, and two gap utilities on one element resolve by
   * stylesheet order, not by the order they were written in.
   */
  const rowClass = (isActive: boolean, holdsActive: boolean) =>
    `group/row w-full h-10 flex items-center pr-2 rounded-full text-sm text-left transition-colors ${
      isActive
        ? 'bg-primary-light text-primary font-medium'
        : `hover:bg-surface-2 ${holdsActive ? 'text-primary' : 'text-text-secondary'}`}`

  /** The link that fills a row — everything but the fold column and the pin. */
  const LINK_CLASS = 'flex h-full min-w-0 flex-1 items-center gap-3'

  /**
   * The fold column that opens every row: a caret BEFORE the icon, at the very
   * start of the line, which is where the eye looks for "there is more under
   * this". It is a column and not a control that only appears where it applies:
   * a leaf keeps the empty slot, or every icon in the panel would sit at a
   * different x depending on whether its neighbour folds.
   *
   * 22px wide, gap included — the rows that follow it are laid out with their
   * own `gap-3`, and a gap utility on the row itself would apply to this slot
   * too and push the whole anatomy out of the geometry `indent()` assumes.
   */
  const CARET_SLOT = 'flex h-6 w-[22px] shrink-0 items-center justify-center'
  const caretSpacer = <span className={CARET_SLOT} aria-hidden />
  const caretIcon = (open: boolean) => (
    <ChevronDown
      size={16} strokeWidth={1.5}
      className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
    />
  )

  /**
   * Left inset that aligns a label under its parent's.
   *
   * The geometry is dictated by the row's own anatomy: at depth 0 a row is
   * `[inset][caret 22][icon 20][gap 12][label]`, so a child — which carries the
   * caret column but no icon — lands its label under its parent's at
   * `12 + 20 + 12 = 44`. Every level below adds ONE step, the same at each — a
   * step small enough to have to be measured to be believed is not doing its
   * job.
   *
   * The width it costs is real, and paid for elsewhere: long labels ellipse
   * with the full text on the row's tooltip, and the sidebar is resizable to
   * 360px — which is what the two longest labels want.
   */
  const INDENT_STEP = 22
  const ICON_SLOT   = 20
  const LABEL_GAP   = 12
  // Base inset of 4px, not 12: the panel already carries its own horizontal
  // padding, and stacking the two pushed the whole tree away from the edge for
  // no gain. Deeper levels keep hanging off the parent's label column, which is
  // what makes a child read as belonging to the row above it.
  const BASE_INSET  = 4
  const indent = (depth: number) =>
    depth === 0
      ? BASE_INSET
      : BASE_INSET + ICON_SLOT + LABEL_GAP + (depth - 1) * INDENT_STEP

  const renderDynamic = (tab: string, children: DynamicNavChild[], depth: number): ReactNode =>
    children.map(child => {
      // A LEAF, whichever of its pages is open: the pages are not rows of this
      // tree, so the module's own row is the only thing that can say "you are
      // in here" — and it must keep saying it on every page inside.
      const isActive   = tab === active && place.entity === child.id
      const notable    = child.state === 'disabled' || child.state === 'unreachable'
      const stateLabel = t(LIVE_STATE_KEY[child.state])
      const title      = notable ? `${child.label} — ${stateLabel}` : child.label
      // Its first page, when it has any: the record's bare address heals to that
      // page anyway, and a menu row that redirects on arrival flickers.
      const target     = adminPath(tab, child.id, child.firstPane)
      // The SLOT is kept even when there is no glyph, so one module missing an
      // icon does not shift its neighbours' labels out of column.
      const RecordIcon = child.Icon
      const label = (
        <>
          <span className="w-[18px] shrink-0 flex items-center justify-center">
            {RecordIcon && <RecordIcon size={17} />}
          </span>
          <span className={`truncate flex-1 ${
            !isActive && child.state === 'disabled' ? 'text-text-tertiary' : ''}`}>
            {child.label}
          </span>
          <StateGlyph state={child.state} title={stateLabel} />
        </>
      )
      return (
        <div
          key={`${tab}:${child.id}`}
          style={{ paddingLeft: indent(depth) }}
          className={rowClass(isActive, false)}
        >
          {caretSpacer}
          <Link
            to={target} title={title}
            aria-current={isActive ? 'page' : undefined}
            className={LINK_CLASS}
          >
            {label}
          </Link>
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
      // A folded group the operator is currently inside: toned, not filled.
      const holdsLeaf   = isGroup && !isOpen && !!activeMeta?.ancestors.includes(item.id)
      const padLeft  = indent(depth)
      const itemLabel = t(item.labelKey)
      const body = (
        <>
          {depth === 0 && item.Icon && <item.Icon size={20} strokeWidth={1.5} className="shrink-0" />}
          <span className="truncate flex-1">{itemLabel}</span>
          {item.badge && (
            <span className="font-medium px-1.5 py-0.5 rounded bg-primary-light text-primary shrink-0"
                  style={{ fontSize: 'var(--kb-text-micro)' }}>
              {item.badge}
            </span>
          )}
        </>
      )
      // A group names no address, so there is nothing to pin; every other row is
      // a page, and a page is what the shortcut list holds.
      const pin = !isGroup && (
        <PinButton
          pinned={pins.isPinned(item.id)}
          offered={pins.canPin}
          label={t(pins.isPinned(item.id) ? 'admin.nav_unpin' : 'admin.nav_pin', { section: itemLabel })}
          onToggle={() => pins.toggle(item.id)}
        />
      )
      return (
        <div key={item.id}>
          {isGroup ? (
            // Expand-only: it names no address, so the anchor is the sidebar's
            // "pure action" form — href="#" plus preventDefault, or the page
            // jumps to the top and the URL grows a stray hash. The WHOLE row
            // toggles, the caret at its head only says which way.
            <a
              href="#" role="button" aria-expanded={isOpen}
              onClick={e => { e.preventDefault(); toggle(item.id) }}
              style={{ paddingLeft: padLeft }} className={rowClass(false, holdsLeaf)}
            >
              <span className={CARET_SLOT} aria-hidden>{caretIcon(isOpen)}</span>
              <span className="flex min-w-0 flex-1 items-center gap-3">{body}</span>
            </a>
          ) : (
            <div style={{ paddingLeft: padLeft }} className={rowClass(isActive || holdsRecord, false)}>
              {/* Both a place and a branch: the caret unfolds its records, the
                  link opens the section. Nesting the button inside the anchor
                  would be invalid markup and would trap the keyboard — hence
                  two controls sharing one row, the caret first. */}
              {isHybrid ? (
                <button
                  type="button" aria-expanded={isOpen}
                  aria-label={t(isOpen ? 'admin.nav_collapse' : 'admin.nav_expand', { section: itemLabel })}
                  onClick={() => toggle(item.id)}
                  className={`${CARET_SLOT} rounded-full hover:text-text-primary`}
                >
                  {caretIcon(isOpen)}
                </button>
              ) : caretSpacer}
              <Link
                to={adminPath(item.id)} title={itemLabel}
                aria-current={isActive ? 'page' : undefined}
                className={LINK_CLASS}
              >
                {body}
              </Link>
              {pin}
            </div>
          )}
          {isGroup && isOpen && <div>{renderItems(declared, depth + 1)}</div>}
          {isHybrid && isOpen && <div>{renderDynamic(item.id, runtime, depth + 1)}</div>}
        </div>
      )
    })

  const primary   = nav.filter(i => !i.secondary)
  const secondary = nav.filter(i => i.secondary)

  /**
   * The shortcut list, resolved against the tree the caller may actually see.
   *
   * Pins store nothing but ids, so a section that was renamed follows, one that
   * disappeared drops out, and one whose privilege was revoked stops being
   * offered — no stored entry can outlive what it points at.
   */
  const pinned = pins.pins
    .map(id => NAV_INDEX.get(id))
    .filter((meta): meta is NavMeta =>
      !!meta && !meta.item.children?.length && canSeeTab(meta.item.id, can))

  return (
    // min-h-0 + overflow-y-auto: the panel scrolls within its flex slot instead of
    // being clipped by the sidebar (which is overflow-hidden) once every section shows.
    // No section title above the tree: the panel sits under a breadcrumb whose
    // first segment already names where you are, and the word "Administration"
    // over an administration console states the obvious while pushing every row
    // down and, with its own padding, to the right.
    <nav className="flex-1 min-h-0 overflow-y-auto px-2 pt-2 pb-2">
      {/* The console's own mark, at the head of its panel. The word
          "Administration" over an administration console would state the obvious
          — but a LOGO gives the surface an identity the shell's Kubuno wordmark
          (still up top) does not, and marks at a glance that the sidebar has
          switched from a module's navigation to the console's. Links to the
          landing, like the collapsed rail's badge. */}
      <Link
        to={adminPath()} title={t('user.admin')}
        className="mb-2 flex items-center gap-2.5 rounded-full px-2 py-1.5 hover:bg-surface-2 transition-colors"
      >
        <AdminLogo size={26} />
        <span className="text-base font-medium text-text-primary">{t('user.admin')}</span>
      </Link>

      {/* The pages this operator chose, above the tree they would otherwise
          have to walk — the shortcut list of the reference console. */}
      {pinned.length > 0 && (
        <>
          {pinned.map(meta => {
            const TopIcon  = NAV_INDEX.get(meta.topId)?.item.Icon
            const label    = t(meta.item.labelKey)
            const isActive = meta.item.id === active
            return (
              <div
                key={`pin:${meta.item.id}`} style={{ paddingLeft: indent(0) }}
                className={rowClass(isActive, false)}
              >
                {caretSpacer}
                <Link
                  to={adminPath(meta.item.id)} title={label}
                  aria-current={isActive ? 'page' : undefined}
                  className={LINK_CLASS}
                >
                  <span className="flex w-5 shrink-0 items-center justify-center">
                    {TopIcon && <TopIcon size={20} strokeWidth={1.5} />}
                  </span>
                  <span className="truncate flex-1">{label}</span>
                </Link>
                <PinButton
                  pinned offered
                  label={t('admin.nav_unpin', { section: label })}
                  onToggle={() => pins.toggle(meta.item.id)}
                />
              </div>
            )
          })}
          <div className="mx-3 my-2 border-t border-border" />
        </>
      )}

      {renderItems(primary, 0)}
      {showMore && renderItems(secondary, 0)}

      {/* The fold. Sections an operator opens once a quarter do not belong in
          the same glance as the ones they live in. */}
      {secondary.length > 0 && (
        <a
          href="#" role="button" aria-expanded={showMore}
          onClick={e => { e.preventDefault(); setShowMore(v => !v) }}
          style={{ paddingLeft: indent(0) }}
          className={rowClass(false, false)}
        >
          {/* The caret sits where every other foldable row in this panel puts
              it — at the head of the line. A menu whose chevrons swap sides row
              to row is a menu the eye has to re-learn on each one. */}
          <span className={CARET_SLOT} aria-hidden>{caretIcon(showMore)}</span>
          <span className="flex min-w-0 flex-1 items-center gap-3">
            {/* The icon column every top-level row has, kept empty so this row
                lines its label up with the sections it folds away. */}
            <span className="w-5 shrink-0" aria-hidden />
            <span className="truncate flex-1">
              {t(showMore ? 'admin.nav_show_less' : 'admin.nav_show_more')}
            </span>
          </span>
        </a>
      )}

      {/* Foot of the panel, below a rule: the one link that is ABOUT the product
          rather than a place inside it. Kept to what actually exists — a console
          footer offering a destination that leads nowhere is worse than a
          shorter footer. */}
      <div className="mt-3 border-t border-border pt-3">
        <Link
          to="/about"
          style={{ paddingLeft: indent(0), fontSize: 'var(--kb-text-meta)' }}
          className="flex items-center rounded-full py-1.5 text-text-tertiary hover:text-primary"
        >
          {t('user.about', { defaultValue: 'À propos de Kubuno' })}
        </Link>
      </div>
    </nav>
  )
}
