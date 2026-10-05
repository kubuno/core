/**
 * Administration ▸ System ▸ "Main database": the two superadmin operations on
 * the core's own database — changing the schema prefix at run time and switching
 * to another engine while keeping the data. Both are guarded server-side to
 * superusers; this page tells a non-superadmin why it is empty rather than
 * showing a blank.
 */
export default function DatabasePanel(): import("react").JSX.Element;
