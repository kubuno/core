import type { TFunction } from 'i18next';
/**
 * Localisation plumbing shared by the `@ui` primitives that carry their own text
 * (DataTable, Combobox, Stepper, Toast, EmptyState…).
 *
 * `@ui` is a standalone library consumed by 18 independent module bundles, so it
 * must never `import 'react-i18next'` and reach for a provider that may not be
 * mounted. The established convention (see `Tabs`) is therefore an OPTIONAL `t`
 * prop: when the caller passes its own `TFunction` the strings come from the
 * host catalogue (`ui.*` in `core/i18n/locales/<lng>/core.json`), and otherwise
 * they fall back to the English defaults below. A primitive is thus always
 * readable, never blank, and never crashes outside an i18n tree.
 */
/** English fallbacks — also the reference wording for the `ui.*` catalogue. */
export declare const UI_FALLBACK: Record<string, string>;
/**
 * Build a translator for a primitive: uses the caller's `t` when provided,
 * otherwise the English fallback. Unknown keys degrade to the key itself rather
 * than to an empty string, so a missing entry is visible instead of silent.
 */
export declare function uiT(t?: TFunction): (key: string, vars?: Record<string, unknown>) => string;
/**
 * Fold a string for local, human-friendly matching: Unicode-decomposed, stripped
 * of diacritics, lower-cased. This is what makes typing "unites" match "Unités"
 * — and, symmetrically, "Unités" match "unites". Decomposition (NFD) splits an
 * accented letter into base + combining mark, and the mark is then removed.
 */
export declare function foldText(value: string): string;
/** True when `needle` (folded) is contained in `haystack` (folded). */
export declare function foldIncludes(haystack: string, needle: string): boolean;
