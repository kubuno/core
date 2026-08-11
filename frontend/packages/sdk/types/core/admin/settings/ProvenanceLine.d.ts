import type { ResolvedSetting, ScopeType } from './scopeTypes';
/** Human name of a level: the unit/group/account name, or the level itself. */
export declare function scopeLabel(t: (k: string, o?: Record<string, unknown>) => string, scopeType: ScopeType | undefined, name: string | null | undefined): string;
/**
 * The one-line provenance statement printed under every control.
 *
 * Three mutually exclusive states, and they are the whole point of the feature:
 * *inherited from X* (the value follows X and will keep following it),
 * *overridden here* (this scope holds its own row), *locked by X* (a level above
 * decided, and the control above this line is disabled).
 */
export default function ProvenanceLine({ setting, onRevert, onLock, onShowChain, }: {
    setting: ResolvedSetting;
    onRevert: () => void;
    onLock: (locked: boolean) => void;
    onShowChain: () => void;
}): import("react").JSX.Element;
