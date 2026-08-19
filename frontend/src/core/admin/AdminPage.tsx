import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Slot } from '../slots/SlotRegistry'
import { useSidebarStore } from '../store/sidebarStore'
import { useToolbarStore } from '../store/toolbarStore'
import { useSearchStore } from '../store/searchStore'
import { Spinner } from '@ui'
import { usePrivileges } from '../authz/usePrivileges'
import { NAV_INDEX, canSeeTab } from './adminNav'
import { canonicalAdminUrl, sectionParams, tabFromPath } from './adminRoute'
import AdminNavTree from './AdminNavTree'
import AdminSearchBar from './AdminSearchBar'
import AdminSectionBoundary, { AdminForbidden, AdminSectionNotFound } from './AdminSectionBoundary'
import ComingSoon from './sections/ComingSoon'
import { ADMIN_SECTIONS } from './sections/registry'
import AdminBreadcrumb from './AdminBreadcrumb'

/**
 * Admin console entry point — navigation shell only: it guards the route, paints
 * the section title and dispatches the current tab to its section component.
 * A "tab" is the id of a navigable leaf in ADMIN_NAV, and it is the first PATH
 * segment: `/admin/users`, then the open record and its pane —
 * `/admin/users/<id>/security`. `/admin` alone renders the landing. Historic
 * `/admin?tab=users&user=<id>&pane=security` still resolves: it is redirected
 * here, in one hop (see `adminRoute.ts`).
 *
 * ── Anatomy ──────────────────────────────────────────────────────────────────
 *   adminNav.ts            declarative menu tree (ADMIN_NAV) + flat NAV_INDEX
 *   adminRoute.ts          path addressing: builder, reader, canonical form
 *   AdminNavTree.tsx       left panel (collapsible tree / collapsed icon rail)
 *   AdminSearchBar.tsx     shell search override while on /admin
 *   search/                matching, ranking, catalogues and painting of results
 *   adminAction.ts         `?action=<verb>` URL convention (adminUrl/useAdminAction)
 *   adminActions.ts        the registry of verbs the search offers
 *   sections/registry.tsx  tab id → section component (the dispatch table)
 *   sections/*.tsx         one file per section (panels living next to this file
 *                          — UsersPanel, ModulesPanel… — are sections too)
 *
 * ── Adding a new admin section ───────────────────────────────────────────────
 *   1. Declare the menu leaf in `adminNav.ts` (unique `id` = the tab id, plus a
 *      `labelKey` added to the i18n catalogues). Nest it under an existing group
 *      or create a new top-level entry with its own `Icon`.
 *   2. Write the section component in `sections/` (or reuse an existing panel).
 *      It may take `AdminSectionProps` ({ params, navigate }) or no props at all.
 *   3. Map the tab id to it in `sections/registry.tsx`. Set `ownHeader: true`
 *      when the section paints its own title, otherwise the generic <h1> below
 *      shows the nav label for you.
 *   4. Optional: register the tasks it performs in `adminActions.ts`, claiming
 *      each verb in the section with `useAdminAction('<verb>', …)` so the search
 *      opens the surface instead of merely landing on the page.
 *   Nothing else to touch — sidebar, search, breadcrumbs and routing all derive
 *   from the nav tree. A leaf flagged `soon: true` with no registry entry
 *   automatically renders the ComingSoon placeholder.
 */

// Override the left panel on /admin (registered once at module load; the stores
// match a prefix, so `/admin` and every `/admin/<section>` resolve to it and
// nothing else does).
useSidebarStore.getState().register({
  moduleId:      'core-admin',
  routePrefix:   '/admin',
  SidebarBody:   AdminNavTree,
  collapsedBody: true,
})

// Inset the module area content by 24px on /admin (registered once, inert
// elsewhere: `routePrefix: '/admin'` only resolves under that route and its
// section paths).
useToolbarStore.getState().register({
  moduleId:    'core-admin',
  routePrefix: '/admin',
  padding:     24,
})

// Override the global shell search bar while on /admin (inert elsewhere).
//
// `inline`: an administration console is searched constantly — an operator who
// knows the name of a setting types it rather than walking the tree — so the
// field is PERMANENT here instead of hiding behind a magnifier. The rest of the
// product keeps the magnifier and its full-screen search mode: this only
// changes the shape of the bar under `/admin`.
useSearchStore.getState().register({
  moduleId:        'core-admin',
  routePrefix:     '/admin',
  placeholder:     'Rechercher des utilisateurs, groupes ou paramètres',
  placeholderKey:  'admin.search_ph',
  SearchComponent: AdminSearchBar,
  inline:          true,
})

/** Is the keystroke going into something the operator is typing in? */
function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable
}

export default function AdminPage() {
  const { t } = useTranslation()
  const { can, isAdmin, isLoading } = usePrivileges()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  const tab = tabFromPath(pathname)
  // Historic links (alerts, e-mails, bookmarks) still land here in their old
  // spelling; this is the canonical one, or null when there is nothing to do.
  const legacy = canonicalAdminUrl(pathname, params)
  // What the section reads: the query string, plus the record and the pane the
  // path carries, republished under the parameter names sections already use.
  const forSection = sectionParams(pathname, params)

  /**
   * Global shortcuts into the search: ⌘/Ctrl+K anywhere, and `/` when nothing
   * is being typed into. They live here rather than in AdminSearchBar because
   * that component does not exist until search mode is open — which is the one
   * moment the shortcut has to work. The shell is asked through the store.
   */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const combo = (e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === 'k'
      const slash = e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !isTypingTarget(e.target)
      if (!combo && !slash) return
      e.preventDefault()
      useSearchStore.getState().requestSearchOpen(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Non-canonical address: rewrite it before anything else, and do it by
  // REPLACEMENT — an added entry would make the Back button bounce between
  // `?tab=users&user=x` and `/admin/users/x` forever.
  if (legacy) return <Navigate to={legacy} replace />

  // No verdict yet: waiting beats flashing a redirect at a legitimate delegate.
  if (isLoading) {
    return <div className="py-16 flex justify-center"><Spinner /></div>
  }
  // "At least an administrator" — a delegated administrator is `role = 'user'`
  // on purpose, so the old `role === 'admin'` test locked them out entirely.
  if (!isAdmin) return <Navigate to="/" replace />

  const meta     = NAV_INDEX.get(tab)
  const titleKey = meta?.item.labelKey
  const section  = ADMIN_SECTIONS[tab]
  const Section  = section?.Component

  // `/admin/nawak`: the segment names no leaf of ADMIN_NAV. Not a refusal (the
  // operator is denied nothing) and not a blank page — an explicit state.
  if (!meta) {
    return (
      <div>
        <h1 className="mb-6 text-text-primary" style={{ fontSize: 'var(--kb-text-page)' }}>{t('user.admin')}</h1>
        <AdminSectionNotFound tab={tab} />
      </div>
    )
  }

  // Hiding the entry in the menu is not enough: the tab is addressable by URL,
  // so resolution itself refuses.
  if (!canSeeTab(tab, can)) {
    return (
      <div>
        <h1 className="mb-6 text-text-primary" style={{ fontSize: 'var(--kb-text-page)' }}>{t('user.admin')}</h1>
        <AdminForbidden titleKey={titleKey} />
      </div>
    )
  }

  return (
    // `kb-admin` scopes the console's own type scale (see theme.css): the page
    // title is larger here than in a module screen, and it is set once on the
    // root rather than per heading.
    <div className="kb-admin">
      {/* Instance health moved to the top bar (`HealthTopbarChip`): the same
          three facts on one line, in the band that was empty, instead of a
          full-width callout pushing every page down. */}

      {/* Where you are, on one line, above every screen but the landing. Derived
          from ADMIN_NAV, so a section that moves branch cannot keep announcing
          the old one; a detail view appends its own last segment through
          `useAdminCrumbs`. */}
      {/* PINNED to the top of the panel, with the section's own toolbar docking
          under it (see `ReportDocument`, which measures this element). A trail
          that scrolls away is a trail you have to scroll back for, and above a
          paginated report — where the page being read is four screens down —
          that is the whole of it.
          The negative offset is not decoration: a sticky top is measured from
          the scrolling ancestor's PADDING box, and this panel carries 24 px of
          it, so `top: 0` would pin the bar 24 px low and let the content show
          through above it. The wrapper exists because `Breadcrumb` does not
          forward unknown props, so the marker has to live on a real element.
          The bottom spacing lives HERE rather than on the trail itself: a margin
          outside the pinned box is 8 px the band loses the moment it sticks, and
          a band that changes height as you start scrolling is worse than one
          that never froze. */}
      <div
        data-admin-crumbs
        className="no-print sticky -top-6 z-30 -mx-6 -mt-6 bg-surface-0 px-6 pt-6 pb-2"
      >
        <AdminBreadcrumb tab={tab} />
      </div>

      {/* Sections with `ownHeader` render their own header (landing / title). */}
      {!section?.ownHeader && (
        <h1 className="mb-6 text-text-primary" style={{ fontSize: 'var(--kb-text-page)' }}>
          {titleKey ? t(titleKey) : t('user.admin')}
        </h1>
      )}

      {/* Re-keyed per tab: a section that failed does not poison the next one. */}
      <AdminSectionBoundary key={tab}>
        {Section && <Section params={forSection} navigate={navigate} />}
      </AdminSectionBoundary>
      {meta?.item.soon && <ComingSoon titleKey={titleKey ?? 'user.admin'} />}

      <Slot name="admin-panels" />
    </div>
  )
}
