// Where you are in the console, on one line.
//
// ## Derived, never written by hand
//
// The trail comes from `ADMIN_NAV` through `NAV_INDEX`: adding a section to that
// declarative list gives it a correct breadcrumb with no further work, and a
// section moved from one group to another — as Domaines and Jours fériés were —
// cannot end up announcing the branch it left. The only hand-written part is
// what a *detail* page appends (an account, a domain, a rule), and it appends it
// through `useAdminCrumbs` rather than by rebuilding the trail.
//
// ## Groups are destinations here
//
// The reference console omits its non-navigable menu groups from the trail,
// because in its tree the intermediate levels happen to be real pages. Ours are
// expand-only, so following that rule literally would leave a single segment on
// nearly every page — the trail would say "Domaines" and never "Instance ›
// Domaines", losing exactly the context it exists to give. Instead a group
// segment leads to its first visible leaf, which is what clicking it in the
// collapsed rail already does. It names a place *and* goes somewhere, which is
// the property the rule was protecting.
//
// Privileges are respected on the way: an ancestor whose leaves this
// administrator cannot open is shown as plain text rather than as a link into a
// 403.

import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { create } from 'zustand'
import { Breadcrumb, type Crumb } from '@ui'
import { usePrivileges } from '../authz/usePrivileges'
import { NAV_INDEX, canSeeTab, firstLeafId } from './adminNav'
import { adminUrl } from './adminAction'

/** Segments a detail page appends after the current section. */
interface CrumbStore {
  extra: Crumb[]
  setExtra: (extra: Crumb[]) => void
}

const useCrumbStore = create<CrumbStore>(set => ({
  extra: [],
  setExtra: extra => set({ extra }),
}))

/**
 * Appends segments while a detail view is on screen — "Marie Dupont" under
 * Utilisateurs, "exemple.fr" under Domaines.
 *
 * Cleared on unmount, and that is the whole contract: a trail left behind by a
 * sheet somebody closed would claim they are somewhere they are not. Pass a
 * stable array (or memoise it) — the effect re-runs on identity change.
 */
export function useAdminCrumbs(extra: Crumb[]) {
  const setExtra = useCrumbStore(s => s.setExtra)
  // The labels are the dependency: rebuilding the array on every render is the
  // normal way a caller writes this, and comparing identities would then loop.
  const key = extra.map(c => `${c.title ?? String(c.label)}|${c.href ?? ''}`).join('›')

  useEffect(() => {
    setExtra(extra)
    return () => setExtra([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, setExtra])
}

export default function AdminBreadcrumb({ tab }: { tab: string }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { can } = usePrivileges()
  const extra = useCrumbStore(s => s.extra)

  const meta = NAV_INDEX.get(tab)
  // The landing page is not somewhere you navigated *into*; the reference
  // console shows no trail there either.
  if (!meta || tab === 'home') return null

  const go = (id: string) => {
    const to = adminUrl({ tab: firstLeafId(id) })
    return { href: to, onClick: () => navigate(to) }
  }

  const ancestors: Crumb[] = meta.ancestors.map(id => {
    const label = t(NAV_INDEX.get(id)?.item.labelKey ?? id)
    // A group whose every leaf is refused to this caller is context, not a link.
    return canSeeTab(id, can) ? { label, title: label, ...go(id) } : { label, title: label }
  })

  const current = t(meta.item.labelKey)
  const items: Crumb[] = [
    ...ancestors,
    // The section stays a link while a detail view is open — that is how you get
    // back to the list — and becomes the last, unlinked segment otherwise.
    extra.length > 0 ? { label: current, title: current, ...go(tab) } : { label: current, title: current },
    ...extra,
  ]

  return (
    <Breadcrumb
      items={items}
      ariaLabel={t('admin.breadcrumb')}
      // Discreet on purpose: the trail is context, the title below it is the
      // page. The shared component ships a 14px MEDIUM link; the weight is what
      // made it compete with the 22px heading below, not the size — so only the
      // weight and the colour are toned down here, and the body size (14px) is
      // kept: a path one reads to navigate has no business being metadata-sized.
      //
      // Written as descendant variants (`[&_a]`) so the override wins on
      // specificity — a second utility on the same element would be settled by
      // the stylesheet's order, not by ours.
      // `no-print`: a trail is a way of NAVIGATING back, and a sheet of paper
      // has nowhere to go. It matters most above a printed report, where the
      // document carries its own head, but it is noise on every printed admin
      // page — so it is suppressed here rather than per section.
      className="no-print min-h-5
                 [&_a]:text-[length:var(--kb-text-body)] [&_a]:font-normal
                 [&_a]:text-text-tertiary [&_a:hover]:text-primary
                 [&_li>span]:text-[length:var(--kb-text-body)] [&_li>span]:font-normal
                 [&_li>span]:text-text-secondary"
    />
  )
}
