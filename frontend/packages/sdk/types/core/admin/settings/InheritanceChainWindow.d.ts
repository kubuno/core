import type { ActiveScope } from './scopeTypes';
/**
 * The whole chain of one setting, most general level first, with the winner
 * marked.
 *
 * "Where does this value come from" is answerable from the provenance line
 * alone; this window answers the follow-up an operator asks when the answer
 * surprises them — *which levels set it, and why did that one win*. Locked
 * levels are called out because they are the only reason a more specific level
 * can lose.
 */
export default function InheritanceChainWindow({ settingKey, scope, onClose, title, }: {
    settingKey: string;
    scope: ActiveScope;
    onClose: () => void;
    /**
     * The name the control above used. Passed in rather than taken from the
     * server response so the window and the row it was opened from say the same
     * thing — the catalogue translates a key the database only stores once.
     */
    title?: string;
}): import("react").JSX.Element;
