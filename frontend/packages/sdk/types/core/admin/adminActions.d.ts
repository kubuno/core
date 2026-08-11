import { type LucideIcon } from 'lucide-react';
import { type AdminActionTarget } from './adminAction';
import { type CanFn } from '../authz/types';
/**
 * ── The action registry ──────────────────────────────────────────────────────
 *
 * An experienced administrator does not walk the tree: they type what they want
 * to *do*. This registry is the catalogue of those verbs — the first category
 * the search offers, ahead of every place and every record.
 *
 * Each entry is a task, not a page. Most carry an `action` verb that opens the
 * surface performing it (see `adminAction.ts` for the URL convention); the few
 * that do not are tasks whose surface *is* the page (installing a module is
 * browsing the marketplace).
 *
 * ── Why the keywords live in the catalogues ──────────────────────────────────
 *
 * They used to be a French string array in this file, which meant the search
 * only ever worked in French: an English operator typing "add user" matched
 * nothing, because the synonyms said "ajouter". `keysKey` now points at a
 * COMMA-SEPARATED i18n entry, translated like any other string, so each locale
 * carries the words its administrators actually type. Diacritics do not matter —
 * matching folds both sides (see `adminSearchIndex.ts`).
 *
 * ── Visibility ───────────────────────────────────────────────────────────────
 *
 * An action is offered only when the caller may both reach its section AND hold
 * every privilege it needs. The search must never enumerate what the console
 * refuses to show: naming an action is already telling someone it exists.
 */
export interface AdminAction {
    id: string;
    labelKey: string;
    /** i18n key of the comma-separated synonym list. */
    keysKey: string;
    Icon: LucideIcon;
    target: AdminActionTarget;
    /** ALL of these are required. Empty = any administrator who can see the tab. */
    privs?: string[];
    /** Super-user only (defining a role is guard-1 server-side, not a privilege). */
    superuser?: boolean;
}
export declare const ADMIN_ACTIONS: AdminAction[];
/** URL of an action — the same convention every other producer uses. */
export declare const actionUrl: (a: AdminAction) => string;
/**
 * Is this target a declared placeholder? Read from the nav tree rather than
 * repeated here, so a section that ships stops being flagged on its own.
 */
export declare const isSoonTarget: (tab: string) => boolean;
/** The actions this caller may actually perform. */
export declare function visibleActions(can: CanFn, isSuperuser: boolean): AdminAction[];
