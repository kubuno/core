import type { ComboboxOption } from '@ui';
/**
 * ── The cartography of instance settings ─────────────────────────────────────
 *
 * One declarative table says, for every key of `core.settings`, WHICH admin page
 * owns it and WHICH titled group it sits in. Routing, page composition, heading
 * order and the search deep link all derive from this file, so a key can never
 * be listed in two places or claimed by none.
 *
 * ── The principle ────────────────────────────────────────────────────────────
 *
 * A setting lives on the page that shows its CONSEQUENCES, not on a page named
 * after its technical namespace. The retention of the audit log belongs above
 * the audit log; the detector scan budget belongs with the detectors; the alert
 * thresholds belong in the alert centre. An operator who is looking at the thing
 * is the operator who wants to tune it — and one who has just changed a
 * threshold can see, on the same screen, what it did.
 *
 * The instance profile keeps only what identifies the instance. Everything that
 * was piled onto it because it had nowhere else to go now has somewhere else.
 *
 * ── Three invariants ─────────────────────────────────────────────────────────
 *
 * NOTHING IS EVER LOST. A key claimed by no page falls back to the instance
 * profile, grouped by its declared category (`FALLBACK_TAB`). A module that
 * declares a setting tomorrow, or a core key added without touching this file,
 * shows up there rather than disappearing from the console.
 *
 * NOTHING IS EVER SHOWN TWICE. `DEDICATED_EDITOR` lists the keys that already
 * have a purpose-built control somewhere (the theme gallery, the login-animation
 * tuner, the "set as default" action of the module list). They are routed to
 * that page — so the search still lands in the right place — but never painted
 * as a raw control: a JSON blob in a text field is not an editor.
 *
 * ONE GROUP, ONE SENTENCE. Every group carries an i18n title AND a description
 * of what it governs. A settings page that only repeats the label of each
 * control tells the operator nothing they did not already know.
 */
/** i18n suffix of a setting key: `security.jwt_access_ttl_s` → `security_jwt_access_ttl_s`. */
export declare const flatKey: (key: string) => string;
export interface SettingGroup {
    /** i18n: `admin.sgrp_<id>` (title) and `admin.sgrp_<id>_desc` (what it governs). */
    id: string;
    /** Keys, in paint order. A key absent from the instance is simply skipped. */
    keys: string[];
}
export interface SettingsPageSpec {
    /** Nav leaf id (a tab of ADMIN_NAV) this block is painted on. */
    tab: string;
    groups: SettingGroup[];
}
/** Where an unclaimed key is painted — the page of last resort. */
export declare const FALLBACK_TAB = "settings";
export declare const SETTINGS_PAGES: SettingsPageSpec[];
/**
 * Keys a purpose-built control already owns.
 *
 * They are routed (the search must land on the page that edits them) but never
 * rendered as a generic control: `appearance.login_animation` is a tuning object
 * whose editor is a live preview, and painting it as a JSON text field — which
 * is what the old single page did — is an invitation to corrupt it.
 */
export declare const DEDICATED_EDITOR: Record<string, string>;
/**
 * Settings whose change has a consequence worth stating BEFORE it is made.
 * Rendered as an inline caution inside the card, above the control — a warning
 * that only appears after the click has already happened is an apology.
 * i18n: `admin.setwarn_<flatKey>`.
 */
export declare const CAUTION_KEYS: Set<string>;
/**
 * Descriptions the database never carried. `core.settings.description` is NULL
 * for the oldest keys — exactly the ones the reorganisation promotes onto small,
 * curated pages — and a page that shows "Nom de l'instance" over an empty field
 * has explained nothing. Supplied here so they are translated like any other
 * string; the database value still wins when it exists.
 * i18n: `admin.setdesc_<flatKey>`.
 */
export declare const I18N_DESCRIPTIONS: Set<string>;
/**
 * Closed value sets. `Dropdown` is not used anywhere here on purpose: it does
 * not follow the dark theme. `Combobox` does, and it filters — which the IANA
 * timezone list of the calendar module makes mandatory rather than pleasant.
 */
export declare const ENUM_OPTIONS: Record<string, ComboboxOption[]>;
/**
 * Keys rendered as a filtered list of IANA zones rather than a free-text field.
 *
 * `instance.timezone` and `calendar.default_timezone` are two different
 * decisions and neither replaces the other: the first says how the SERVER dates
 * what it writes to a human (the timestamp on outgoing mail), the second says
 * which grid a calendar draws. They are deliberately left independent.
 */
export declare const TIMEZONE_KEYS: Set<string>;
/** The page spec for a tab, or undefined when the tab carries no settings block. */
export declare const specForTab: (tab: string) => SettingsPageSpec | undefined;
/**
 * Which page shows this key — the answer the admin search needs to deep-link a
 * setting. Unclaimed keys resolve to the fallback page, where they really are.
 */
export declare const tabForSetting: (key: string) => string;
/** Is this key claimed by some page (or owned by a dedicated editor)? */
export declare const isClaimed: (key: string) => boolean;
