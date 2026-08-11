import React from 'react';
export type SlotName = 'sidebar-new-actions' | 'topbar-actions' | 'settings-sections' | 'admin-panels' | 'search-providers' | 'user-menu-items' | 'dashboard-widgets' | 'dashboard-stats-cards' | 'context-menu-items' | 'sidebar-storage' | 'help-menu-items' | 'header-search' | 'header-leading' | 'header-actions-right' | 'sidebar-footer' | 'module-toolbar' | 'left-rail-icons' | 'right-rail-icons' | 'app-dialogs' | 'global-services' | (string & Record<never, never>);
/**
 * Slot name of a module's own admin page — `/admin/modules/<id>`.
 *
 * The name CARRIES the module id rather than being one shared slot filtered at
 * render time, for two reasons. First, the core must not know that `mail` (or
 * anyone else) contributes an admin view: `ModuleAdminPage` builds the name from
 * the id in the URL, so discovery stays purely dynamic and no module is ever
 * named in core code. Second, a shared `module-admin` slot would render every
 * contributor on every module's page unless the consumer filtered them, and a
 * filter that is easy to forget is a leak waiting to happen — here a wrong id
 * simply means nothing is registered under that name.
 *
 * A module registers with its own id on both sides:
 *   SlotRegistry.register(moduleAdminSlot('mail'), 'mail', MailAdminPanel)
 */
export declare const moduleAdminSlot: (moduleId: string) => SlotName;
/**
 * A view a module contributes to its OWN admin page, and WHERE it belongs.
 *
 * ── Why the placement travels with the contribution ──────────────────────────
 * `module-admin:<id>` alone answers "who renders something here"; it cannot
 * answer "on which page, and under which tab", which is the only question left
 * once a module's panel is more than one page. The module is the one that knows
 * — it declared those pages itself, in its manifest — so it says so here, with
 * the same vocabulary: `group` is a `[[setting_groups]]` id of that module.
 *
 * ── The two ways a section shows up ──────────────────────────────────────────
 *  • WITHOUT a label — rendered inline at the top of its group's page, above
 *    the tabs. That is for what has to be read before anything is changed: a
 *    diagnostic, a status. It competes with nothing.
 *  • WITH a label — a tab of its own, sitting next to the tabs the settings'
 *    `category` produce. That is for a surface as large as a settings page and
 *    as unrelated to it as a key store.
 *
 * ── Degrading, never breaking ────────────────────────────────────────────────
 * A section naming a group the module does not declare, or naming none at all,
 * is not dropped: it renders on the module's FIRST page. Losing a diagnostic
 * because a manifest was renamed would be far worse than showing it one page
 * early — and the module keeps working while its two halves are out of step.
 */
export interface ModuleAdminSection {
    /** The contributing module. Its page is `/admin/modules/<moduleId>`. */
    moduleId: string;
    /** Stable, untranslated id — unique per module. Also the tab id. */
    id: string;
    /** `[[setting_groups]]` id of that module. Absent = its first page. */
    group?: string;
    /** Already-translated tab label. Absent = inline, above the tabs. */
    label?: string;
    /**
     * i18n key of the label, preferred over `label` when both are given: it is
     * resolved at RENDER time, so the tab follows a change of language instead of
     * keeping whatever the language was when the module registered.
     */
    labelKey?: string;
    /** Lucide icon name for the tab; unknown names simply show none. */
    icon?: string;
    /** Order among the contributed items of the same page (lower first). */
    position?: number;
    Component: React.ComponentType;
}
export declare const ModuleAdminRegistry: {
    /**
     * Declares one section of the module's own admin page. Re-registering the
     * same `moduleId` + `id` REPLACES the previous one, so a module bundle that
     * is evaluated twice (hot reload, a remount) does not draw its panel twice.
     */
    register(section: ModuleAdminSection): void;
    /** What `moduleId` contributes, in display order. */
    sectionsFor(moduleId: string): ModuleAdminSection[];
};
interface SlotEntry {
    moduleId: string;
    Component: React.ComponentType;
    /** Prédicat optionnel d'applicabilité. Quand il est fourni, le consommateur du
     *  slot peut filtrer les contributeurs qui ne s'appliquent pas à un contexte
     *  donné (ex. « files-open-with » : ne garder que les modules capables d'ouvrir
     *  le fichier visé). L'argument est défini par le consommateur du slot. */
    match?: (arg?: unknown) => boolean;
}
export declare const SlotRegistry: {
    register(slot: SlotName, moduleId: string, Component: React.ComponentType, match?: (arg?: unknown) => boolean): void;
    getSlot(slot: SlotName): SlotEntry[];
    /** Whether at least one ACTIVE module contributes to `slot` — the same
     *  filtering `<Slot>` applies, exposed so a page can decide its layout BEFORE
     *  rendering (e.g. not claiming a module has nothing to configure when it
     *  does contribute a section of its own). */
    hasActive(slot: SlotName, activeIds: Set<string>): boolean;
    registerOverride(key: string, moduleId: string, Component: React.ComponentType<any>): void;
    getActiveOverride<T = Record<string, unknown>>(key: string, activeIds: Set<string>): React.ComponentType<T> | null;
    unregisterModule(moduleId: string): void;
};
export declare const ModuleSettingsRegistry: {
    /** Legacy: declare the module's per-user settings route (default `/<moduleId>/settings`).
     *  Kept for modules not yet migrated to the admin/user split. */
    register(moduleId: string, route?: string): void;
    /** Declare the module's admin (instance-wide) settings route. */
    registerAdmin(moduleId: string, route?: string): void;
    /** Declare the module's per-user settings route. */
    registerUser(moduleId: string, route?: string): void;
    /** Per-user settings route for `moduleId` if registered and active, else null.
     *  This is what the header gear button navigates to. */
    getRoute(moduleId: string | undefined, activeIds: Set<string>): string | null;
    /** Admin (instance-wide) settings route for `moduleId` if registered and active. */
    getAdminRoute(moduleId: string | undefined, activeIds: Set<string>): string | null;
    /** Whether `pathname` is a registered settings page (full-bleed, no toolbar). */
    isSettingsRoute(pathname: string): boolean;
};
export interface NotifActivity {
    /** Stable id, unique within the group. */
    id: string;
    /** Human label (already translated; modules pass `t(..., { defaultValue })`). */
    label: string;
    /** Default channel states when the user hasn't chosen yet. */
    emailDefault?: boolean;
    pushDefault?: boolean;
}
export interface NotifGroup {
    /** Owning module ('core' = always shown; others shown only when the module is active). */
    moduleId: string;
    /** Group heading (e.g. "Tâches"). */
    title: string;
    /** Sort order among groups (lower first; default 100). */
    order?: number;
    activities: NotifActivity[];
}
export declare const NotificationRegistry: {
    /** Register (or replace, by moduleId+title) a notification activity group. */
    register(group: NotifGroup): void;
    /** Groups to display: core groups always, module groups only when active. */
    getGroups(activeIds: Set<string>): NotifGroup[];
};
interface SlotProps {
    name: SlotName;
    fallback?: React.ReactNode;
    [prop: string]: any;
}
/** Reactive counterpart of `SlotRegistry.hasActive` — re-evaluated whenever the
 *  active module list changes, so a page laid out around a contribution follows
 *  a module being switched off. */
export declare function useHasSlot(name: SlotName): boolean;
/**
 * The sections `moduleId` contributes to its own admin page — `[]` while the
 * module is switched off, like every other slot: a disabled module's bundle may
 * still be loaded in this tab, and rendering its panel would say it is running.
 */
export declare function useModuleAdminSections(moduleId: string): ModuleAdminSection[];
export declare function Slot({ name, fallback, ...ctx }: SlotProps): React.JSX.Element;
export {};
