import { type RightRailPrefs } from '../hooks/useRightRailPrefs';
import type { RailEntry } from '../store/rightPanelStore';
/**
 * Customisation of the right rail: which panels appear, and in which order.
 *
 * Edits are held in a DRAFT and written once on confirm, like the waffle launcher.
 * Saving on every click would fire a `PATCH /me` per keystroke-sized change, and two
 * responses landing out of order would put a stale `preferences` back into the store —
 * the race that already bit the module preferences.
 *
 * Order is changed with ↑/↓ rather than drag-and-drop: with a handful of rows it is
 * just as quick, works with a keyboard, and has no hidden failure mode.
 */
export default function RightRailCustomize({ entries, prefs, onSave, onClose, }: {
    entries: RailEntry[];
    prefs: RightRailPrefs;
    onSave: (next: RightRailPrefs) => void;
    onClose: () => void;
}): import("react").JSX.Element;
