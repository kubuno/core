interface Props {
    /** Pre-filter on one rule (the rule sheet's own log). */
    ruleId?: string | null;
    /** Hide the page header — the section already painted one. */
    embedded?: boolean;
}
export default function ExecutionsPanel({ ruleId, embedded }: Props): import("react").JSX.Element;
export {};
