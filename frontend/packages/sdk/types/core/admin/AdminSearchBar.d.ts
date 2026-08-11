/**
 * The admin console's search field — the way an experienced administrator gets
 * anywhere and does anything.
 *
 * Mounted in place of the shell's own bar while on `/admin` (registered through
 * `useSearchStore` in AdminPage). What it owns: the field, the keyboard, and the
 * decision of what a given key does. What it does NOT own: matching and ranking
 * (`search/adminSearchIndex.ts`), the catalogues (`search/useAdminSearchSources.ts`)
 * and the painting (`search/AdminSearchPanel.tsx`).
 *
 * ── Keyboard contract ────────────────────────────────────────────────────────
 *   ⌘/Ctrl+K, /   open the field from anywhere in the console (see AdminPage —
 *                 the shortcut must live where the field is not yet mounted)
 *   ↑ ↓           walk EVERY result, categories included: the operator ranks
 *                 answers, not sections
 *   ↵             activate the highlighted row — and the first row is always
 *                 highlighted, so "type, Enter" is a complete gesture
 *   Esc           close the list; a second Esc leaves search mode (the shell's)
 *
 * ── Why the empty field opens the list ───────────────────────────────────────
 * It used to render nothing until something was typed, which wasted the one
 * moment the console knows exactly what to offer: the five places this operator
 * came from, and a handful of things worth doing. An empty menu is a dead end;
 * this one is a shortcut.
 */
export default function AdminSearchBar(): import("react").JSX.Element;
