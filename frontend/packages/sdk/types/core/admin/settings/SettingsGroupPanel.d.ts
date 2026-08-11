/**
 * The settings block of ONE administration page.
 *
 * Every page that governs a subsystem paints its own knobs through this
 * component, and `settingsMap.ts` says which keys those are. The three things
 * that must not diverge between pages live here, once:
 *
 *   • the SCOPE BAR — instance or organisational unit — above every block, so
 *     inheritance survives the split intact. A page that silently edited the
 *     instance while the operator believed they were editing a unit would be
 *     worse than the single page it replaced;
 *   • the PROVENANCE LINE under every control (inherited / overridden / locked)
 *     with its revert, lock and "show the chain" affordances;
 *   • the action bar for buffered edits (free text and numbers), where booleans
 *     and closed value sets write immediately.
 *
 * Rendering nothing is a valid outcome: a caller who may not read settings, or
 * a page whose keys are all absent from this instance, gets no block at all
 * rather than an empty heading.
 */
interface Props {
    /** Nav leaf id whose keys this block paints. */
    tab: string;
    /**
     * How the block sits in its page.
     *   • `standalone` — the block IS the page (a pure-settings leaf). One
     *     readable column, whatever the count.
     *   • `tab` — the block is the "Réglages" tab beside a subsystem's content.
     *     It takes the full width the content established, and flows its
     *     categories into two columns once there are enough to fill them.
     * The block never wears a heading of its own: the page title or the tab
     * already names it, and a second "Réglages" heading only repeated that.
     */
    layout?: 'standalone' | 'tab';
}
export default function SettingsGroupPanel({ tab, layout }: Props): import("react").JSX.Element | null;
export {};
