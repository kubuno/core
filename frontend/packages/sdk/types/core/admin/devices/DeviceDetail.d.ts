/**
 * One device: what was observed, what was declared, which sessions it holds,
 * and what has happened to it.
 *
 * The panels are shared with the personal screen ([`../../devices/panels`]) so
 * the two audiences literally cannot be shown different facts. Only the action
 * bar differs — an operator approves, blocks and forgets; a user renames and
 * disowns.
 */
export default function DeviceDetail({ id, onBack }: {
    id: string;
    onBack: () => void;
}): import("react").JSX.Element;
