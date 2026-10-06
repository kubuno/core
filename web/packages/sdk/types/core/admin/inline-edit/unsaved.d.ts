import type { TFunction } from 'i18next';
import type { ConfirmOptions } from '@ui/ConfirmDialog';
/** Are there in-place edits nobody has saved? */
export declare function hasUnsavedEdits(): boolean;
/**
 * Registers an editing card for as long as it holds unsaved changes, and asks
 * the browser to confirm a reload or a tab close while it does.
 */
export declare function useUnsavedEditor(dirty: boolean): void;
/**
 * Guards an in-app departure (a Back link, a tab switch). Returns `true` when
 * the caller may proceed.
 *
 * Takes the sheet's own `confirm` so the dialog it opens is the one the sheet
 * already renders — this file owns no UI.
 */
export declare function confirmLeave(confirm: (options: ConfirmOptions) => Promise<boolean>, t: TFunction): Promise<boolean>;
