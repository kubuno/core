import type { ReactNode } from 'react';
export interface SettingsSaveBarProps {
    /** Staged changes belonging to THIS section. Zero disables the write. */
    count: number;
    /** Staged changes waiting in another section, tab or page. */
    elsewhere?: number;
    /** The way to reach them — a link, or a button that opens their section. */
    elsewhereAction?: ReactNode;
    /** Values the module's own declaration refuses. Blocks the write. */
    invalid?: number;
    /** True while this section's write is in flight. */
    saving?: boolean;
    /** Flashes on the action for a moment after a successful write. */
    saved?: boolean;
    /**
     * The staged changes would create the first local value on this scope, so the
     * primary action is "override the inherited value" rather than "save".
     *
     * Writing a value on a scope that has none yet does something different from
     * updating one it already holds: the first REMOVES the unit from its parent's
     * authority for that key, for good, and every unit below it with it. Naming
     * both "Enregistrer" hides that.
     */
    overriding?: boolean;
    onSave: () => void;
    onCancel: () => void;
}
export default function SettingsSaveBar({ count, elsewhere, elsewhereAction, invalid, saving, saved, overriding, onSave, onCancel, }: SettingsSaveBarProps): import("react").JSX.Element;
