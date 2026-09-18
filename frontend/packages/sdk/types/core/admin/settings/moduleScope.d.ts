import type { ActiveScope, ResolvedSetting } from './scopeTypes';
import type { SettingItem } from './moduleSettingSchema';
/** `notes` + `autosave_interval_s` → `notes.autosave_interval_s`. */
export declare const prefixedKey: (moduleId: string, key: string) => string;
/**
 * Resolved values for one module at one scope, indexed by the SHORT key the
 * module's own schema uses.
 *
 * Disabled outright when the module has nothing that can vary by scope: asking
 * the core to resolve fifty keys that are instance-wide by declaration would
 * cost a request per scope change and answer nothing the schema did not already
 * say.
 */
export declare function useResolvedModuleSettings(moduleId: string, scope: ActiveScope, enabled: boolean): {
    byKey: Map<string, ResolvedSetting>;
    isLoading: boolean;
    isError: boolean;
};
/**
 * Can this setting hold a different value from one unit to the next?
 *
 * The module says so itself: `overridable` means "an administrator may pin this
 * for part of the instance", `global` means the value is the instance's and has
 * no per-unit meaning (a listener's port, a retry delay). The console must not
 * offer to override what the module cannot read per user.
 */
export declare const isScopable: (item: SettingItem) => boolean;
/** Does this module expose anything at all that a unit could override? */
export declare const hasScopableSettings: (items: SettingItem[]) => boolean;
/**
 * The three states a scoped value can be in, named once so the chip, the row
 * and the section counter cannot drift apart.
 *
 *  • `own`       — this scope holds its own row: the value was decided HERE.
 *  • `inherited` — the value comes from a level above and will keep following it.
 *  • `locked`    — a level above pinned it; the control is read-only here.
 */
export type Inheritance = 'own' | 'inherited' | 'locked';
export declare function inheritanceOf(resolved: ResolvedSetting | undefined): Inheritance | null;
