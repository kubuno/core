import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { CircleSlash, Package, PackageX, SlidersHorizontal, TriangleAlert } from 'lucide-react'
import { Button, Callout, Card, EmptyState, Spinner, Toggle, useToast, type Crumb } from '@ui'
import { PRIV } from '../authz/types'
import { usePrivileges } from '../authz/usePrivileges'
import { formatDay } from './sections/format'
import type { AdminSectionProps } from './sections/registry'
import { adminUrl } from './adminAction'
import { adminPath } from './adminRoute'
import { useAdminCrumbs } from './AdminBreadcrumb'
import {
  Slot, moduleAdminSlot, useHasSlot, useModuleAdminSections,
  type ModuleAdminSection,
} from '../slots/SlotRegistry'
import { findIcon } from '../utils/iconMap'
import {
  LIVE_STATE_KEY, groupsOf, useAdminModules, useModuleLiveState, useToggleModule,
  type AdminModule, type ModuleLiveState, type ModuleSettingGroup,
} from './adminModules'
import ModuleAdminSettings, { useModuleInstanceSettings } from './ModuleAdminSettings'
import ModuleSidePanel from './settings/ModuleSidePanel'
import { INSTANCE_SCOPE, type ActiveScope } from './settings/scopeTypes'

/**
 * Applications ▸ Modules installés ▸ one module — `/admin/modules/<id>`.
 *
 * ── Why the page exists at all ───────────────────────────────────────────────
 * A module used to be administered from inside the list, in place, reachable
 * only by clicking a gear: no address, nothing to bookmark, nothing to link an
 * alert to. Now every module is a row of the menu and a URL of its own, and the
 * list is what `/admin/modules` alone still shows.
 *
 * ── What it must not do ──────────────────────────────────────────────────────
 * Half the modules on a real instance declare NO instance setting (`drive` and
 * `media` declare none, `calendar` declares twenty-three). Rendering an empty
 * form for those would state something false — that the module is configurable
 * and simply not configured yet. So the page asks the schema first and, when it
 * is empty, says so and offers what is actually on the table: switching the
 * module off, or going back to the inventory.
 *
 * ── An address outlives what it points at ────────────────────────────────────
 * `/admin/modules/<uninstalled>` is a link somebody bookmarked before the module
 * was removed. It answers with a sentence, exactly as `/admin/nawak` does one
 * level up — never a blank page, and never a silent redirect that would pretend
 * the address was right.
 *
 * ── What a module adds of its own ────────────────────────────────────────────
 * A generated form covers a value an administrator types; it cannot cover a key
 * to generate, a DNS record to copy, or a diagnostic to read. Those are the
 * module's own views, contributed through `ModuleAdminRegistry` (or, for a
 * module that has not moved yet, the plain `module-admin:<id>` slot) and
 * rendered ABOVE the form: on a mail server, "is anything broken" comes before
 * "which port". The core names no module — everything is keyed by the id in the
 * URL, so a module that contributes nothing costs nothing.
 *
 * ── One page, or several ─────────────────────────────────────────────────────
 * A module with forty-eight settings has no readable single page. So a module
 * may declare PAGES of its own (`[[setting_groups]]`): each is an address
 * (`/admin/modules/mail/filtering`) and a heading here; its settings'
 * `category` values become the tabs inside it. Everything about those pages —
 * ids, labels, icons, order, wording — comes from the module.
 *
 * They are listed in the CARD on the left of this page (`ModuleSidePanel`), not
 * in the console's navigation tree: nested there, under the module, under
 * "Modules installés", under "Applications", twenty modules' worth of pages
 * buried the applications an operator was scanning for.
 *
 * A module that declares none keeps EXACTLY the page it had: state card, its
 * own sections, one settings card. That is almost every module, and it is the
 * branch this file is careful not to disturb.
 *
 * ── A page id outlives the page ──────────────────────────────────────────────
 * `/admin/modules/mail/quotas` is a bookmark from before that page was merged
 * into another. It resolves to the module's FIRST page rather than to nothing:
 * the address named a real module, and answering a blank screen for a page that
 * moved is the failure the whole grouping was meant to remove.
 */

/** Status chip: the same three-state vocabulary the sidebar rows use. */
function StateChip({ state }: { state: ModuleLiveState }) {
  const { t } = useTranslation()
  const skin: Record<ModuleLiveState, string> = {
    running:     'bg-success-light text-success',
    unknown:     'bg-surface-2 text-text-secondary',
    disabled:    'bg-surface-2 text-text-tertiary',
    unreachable: 'bg-warning-light text-warning',
  }
  const icon = state === 'disabled' ? <CircleSlash size={12} />
    : state === 'unreachable' ? <TriangleAlert size={12} />
      : null
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${skin[state]}`}
      style={{ fontSize: 'var(--kb-text-micro)' }}>
      {icon}
      {t(LIVE_STATE_KEY[state])}
    </span>
  )
}

/** The identity + on/off block — what the list card offered, given a page. */
function ModuleStateCard({ module, state }: { module: AdminModule; state: ModuleLiveState }) {
  const { t } = useTranslation()
  const { can } = usePrivileges()
  const toast = useToast()
  const toggle = useToggleModule()
  const canManage = can(PRIV.MODULES_MANAGE)

  const flip = () => toggle.mutate(
    { id: module.id, is_enabled: !module.is_enabled },
    {
      onSuccess: (data) => {
        if (!data.is_enabled && data.also_disabled.length > 0) {
          toast.info(t('admin.m_cascade', { list: data.also_disabled.join(', ') }))
        }
      },
      onError: () => toast.error(t('admin.m_toggle_failed')),
    },
  )

  return (
    <Card title={t('admin.m_state_title')} icon={<Package size={16} />} className="mb-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StateChip state={state} />
            {state === 'unreachable' && (
              <span className="text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
                {t('admin.m_unreachable_hint')}
              </span>
            )}
          </div>
          {module.description && (
            <p className="mt-2 leading-relaxed text-text-secondary"
              style={{ fontSize: 'var(--kb-text-meta)' }}>{module.description}</p>
          )}
        </div>
        {canManage && (
          <Toggle
            checked={module.is_enabled}
            onChange={flip}
            label={t('admin.m_toggle_label')}
          />
        )}
      </div>
    </Card>
  )
}

/** The page header of a module's group: what this page is, and what it is for. */
function GroupHeading({ group }: { group: ModuleSettingGroup }) {
  const Icon = findIcon(group.icon)
  return (
    <div className="mb-3">
      <div className="flex items-center gap-2">
        {Icon && <Icon size={16} className="shrink-0 text-text-secondary" />}
        {/* Section title: plain 14px bold, no small caps, no accent bar. */}
        <h2 className="text-sm font-bold text-text-primary">{group.label}</h2>
      </div>
      {group.description && (
        <p className="mt-1 max-w-3xl leading-relaxed text-text-secondary"
          style={{ fontSize: 'var(--kb-text-meta)' }}>
          {group.description}
        </p>
      )}
    </div>
  )
}

export default function ModuleAdminPage({ params, navigate }: AdminSectionProps) {
  const { t, i18n } = useTranslation()
  const id = params.get('module') ?? ''

  const { data, isLoading, isError, refetch } = useAdminModules()
  const liveState = useModuleLiveState()
  const module    = data?.find(m => m.id === id) ?? null

  // The schema is only worth asking for once the module is known to exist.
  const settings = useModuleInstanceSettings(id, !!module)

  // Does the module ship an admin view of its own? Asked before the early
  // returns below (hook order) and before the layout is decided: a module with
  // no declared setting but a section of its own must NOT be told it has
  // nothing to configure.
  const ownSlot     = moduleAdminSlot(id)
  const hasOwnAdmin = useHasSlot(ownSlot)
  const ownSections = useModuleAdminSections(id)

  // WHO the settings on screen apply to. It lives HERE and not in the settings
  // panel because the tree that changes it is in the card beside it, and that
  // card outlives the panel: moving from one page of a module to the next
  // remounts nothing on the left.
  const [scope, setScope] = useState<ActiveScope>(INSTANCE_SCOPE)

  // Another module, another org chart to answer for: a selected unit carried
  // over would silently point the form at a scope the operator never chose for
  // this module.
  useEffect(() => { setScope(INSTANCE_SCOPE) }, [id])

  // The pages the module declares, and the one addressed. An id that names no
  // declared page (a stale bookmark) resolves to the first, never to nothing.
  const groups   = useMemo(() => groupsOf(module), [module])
  const wanted   = params.get('pane') ?? ''
  const active   = groups.find(g => g.id === wanted) ?? groups[0] ?? null
  const isFirst  = !!active && active.id === groups[0]?.id

  // What the module contributes to THIS page. A section naming an unknown page
  // (or none) lands on the first one rather than disappearing.
  const placed = (section: ModuleAdminSection) =>
    groups.some(g => g.id === section.group) ? section.group : groups[0]?.id
  const here     = ownSections.filter(s => !active || placed(s) === active.id)
  const inline   = here.filter(s => !s.label && !s.labelKey)
  const asTabs   = here.filter(s => !!s.label || !!s.labelKey)

  // Breadcrumb: the module, then the page inside it. Memoised on the labels
  // alone — `useAdminCrumbs` re-runs on array identity, and a fresh literal per
  // render would loop.
  useAdminCrumbs(useMemo(
    () => {
      if (!module) return []
      const crumbs: Crumb[] = [{
        label: module.display_name,
        title: module.display_name,
        // The module's own address, so the trail leads back to the page the
        // menu lands on rather than being dead text next to a live segment.
        href:  active ? adminPath('modules', module.id) : undefined,
      }]
      if (active) crumbs.push({ label: active.label, title: active.label })
      return crumbs
    },
    [module?.id, module?.display_name, active?.id, active?.label], // eslint-disable-line react-hooks/exhaustive-deps
  ))

  /**
   * Heals the address when it names no page of this module — a bookmark from
   * before a page was renamed, or the module's bare URL.
   *
   * Rendering the first page under the wrong address would leave the menu
   * highlighting nothing (no row matches `quotas`) and would hand back a URL
   * that still points at a page that does not exist. A REPLACEMENT, never an
   * addition: an entry per arrival would make Back bounce forever.
   */
  useEffect(() => {
    if (!module || !active || wanted === active.id) return
    navigate(adminPath('modules', module.id, active.id), { replace: true })
  }, [module?.id, active?.id, wanted]) // eslint-disable-line react-hooks/exhaustive-deps

  const backToList = () => navigate(adminUrl({ tab: 'modules' }))

  if (isLoading) {
    return <div className="py-16 flex justify-center"><Spinner /></div>
  }

  if (isError) {
    return (
      <EmptyState
        variant="error"
        icon={<PackageX size={26} />}
        title={t('admin.m_load_error_title')}
        description={t('admin.m_load_error_desc')}
        action={{ label: t('admin.m_retry'), onClick: () => void refetch() }}
        t={t}
      />
    )
  }

  // A bookmark that outlived its module — or a typo. Say which, and offer the
  // inventory rather than pretending the address named something.
  if (!module) {
    return (
      <EmptyState
        variant="unavailable"
        icon={<PackageX size={26} />}
        title={t('admin.m_not_installed_title')}
        description={t('admin.m_not_installed_desc', { id })}
        action={{ label: t('admin.m_back_to_list'), onClick: backToList }}
        t={t}
      />
    )
  }

  const state    = liveState(module)
  const paged    = groups.length > 0
  const hasAdmin = hasOwnAdmin || ownSections.length > 0

  const header = (
    <div className="mb-3 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
      <h1 className="min-w-0 text-text-primary" style={{ fontSize: 'var(--kb-text-page)' }}>
        {module.display_name}
      </h1>
      <span className="text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
        v{module.version} · {t('admin.m_installed_on', { date: formatDay(module.installed_at, i18n.language) })}
      </span>
    </div>
  )

  // The frame everything below is read in: these knobs govern the instance, not
  // the operator's own preferences.
  //
  // It is dropped for a module that declares something `overridable`: that page
  // carries a scope column saying, permanently and more precisely, WHO the
  // values apply to. Leaving the banner there would state the opposite of the
  // column right under it — "toute l'instance" over a selected unit.
  const perUnit = settings.items.some(s => s.scope === 'overridable')
  const scopeCallout = perUnit ? null : (
    <Callout variant="info" className="mb-4" title={t('admin.m_scope_title')}>
      {t('admin.m_scope_body')}
    </Callout>
  )

  const configError = (
    <Card>
      <EmptyState
        compact
        variant="error"
        icon={<SlidersHorizontal size={22} />}
        title={t('admin.m_config_error_title')}
        description={t('admin.m_config_error_desc')}
        action={{ label: t('admin.m_retry'), onClick: () => void settings.refetch() }}
        t={t}
      />
    </Card>
  )

  const backLink = (
    <div className="mt-4">
      <Button variant="ghost" size="sm" onClick={backToList}>{t('admin.m_back_to_list')}</Button>
    </div>
  )

  /**
   * The two columns of the page: what qualifies the settings, then the settings.
   *
   * From `md` up the card is a 240px column beside the content; below it, the
   * same card sits ABOVE — a phone has no width to give away, and a fold the
   * operator has to scroll past is cheaper than a form squeezed into what is
   * left of the screen. The card returns `null` when the module has neither
   * pages nor overridable settings, and the row then holds a single column.
   */
  const columns = (content: ReactNode) => (
    <div className="flex min-w-0 flex-col gap-5 md:flex-row md:items-start">
      <ModuleSidePanel
        module={module}
        groups={groups}
        activeGroup={active?.id ?? null}
        scopable={perUnit}
        scope={scope}
        onScopeChange={setScope}
      />
      <div className="min-w-0 flex-1">{content}</div>
    </div>
  )

  // ── Split into pages ───────────────────────────────────────────────────────
  if (paged && active) {
    return (
      <div className="min-w-0">
        {header}
        {columns(
          <>
            <GroupHeading group={active} />

            {/* Both belong to the module, not to any one of its pages — so they
                sit on the FIRST one, which is where the menu lands, instead of
                being repeated five times over. */}
            {isFirst && scopeCallout}
            {isFirst && <ModuleStateCard module={module} state={state} />}

            {/* The module's own views for this page, above the form: a
                diagnostic is read before a setting is changed, and it is what
                tells the operator WHICH setting to change. */}
            {inline.map(({ id: sectionId, Component }) => <Component key={sectionId} />)}
            {/* A module that contributes through the plain slot said nothing
                about pages; its views belong to the module as a whole, so they
                show where the menu lands rather than on every page. */}
            {isFirst && <Slot name={ownSlot} />}

            {settings.isLoading ? (
              <div className="py-10 flex justify-center"><Spinner /></div>
            ) : settings.isError ? (
              configError
            ) : settings.items.length > 0 ? (
              // Mounted on EVERY page, including one with no setting of its
              // own: it holds the pending edits and the module-wide filter, and
              // unmounting it while moving between pages would throw away
              // staged changes the footer had just promised to save.
              <ModuleAdminSettings
                key={module.id}
                moduleId={module.id}
                group={active.id}
                groups={groups}
                extraTabs={asTabs}
                scope={scope}
              />
            ) : (
              // No setting anywhere in the module, but it does administer
              // itself: the contributed sections above are the page.
              asTabs.map(({ id: sectionId, Component }) => <Component key={sectionId} />)
            )}

            {backLink}
          </>,
        )}
      </div>
    )
  }

  // ── One page — every module that declares none ─────────────────────────────
  return (
    <div className="min-w-0">
      {header}
      {columns(
        <>
          {scopeCallout}

          <ModuleStateCard module={module} state={state} />

          {/* The module's own sections, above the generated form. */}
          {ownSections.map(({ id: sectionId, Component }) => <Component key={sectionId} />)}
          <Slot name={ownSlot} />

          {settings.isLoading ? (
            <div className="py-10 flex justify-center"><Spinner /></div>
          ) : settings.isError ? (
            configError
          ) : settings.items.length === 0 ? (
            hasAdmin ? (
              // The module declares no setting but administers itself above.
              // Saying "not configurable" here would contradict the panel the
              // operator is looking at; only the way back is still owed.
              backLink
            ) : (
              // Declares nothing at all: an empty form would claim it is
              // configurable.
              <Card>
                <EmptyState
                  compact
                  variant="unavailable"
                  icon={<SlidersHorizontal size={22} />}
                  title={t('admin.m_no_settings_title')}
                  description={t('admin.m_no_settings_desc')}
                  action={{ label: t('admin.m_back_to_list'), onClick: backToList }}
                  t={t}
                />
              </Card>
            )
          ) : (
            <>
              <ModuleAdminSettings key={module.id} moduleId={module.id} scope={scope} />
              {/* Only here: the two states above already offer the way back
                  inside their own empty state, and a second identical button
                  reads as a different destination. */}
              {backLink}
            </>
          )}
        </>,
      )}
    </div>
  )
}
