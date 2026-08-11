import type { AdminSectionProps } from '../sections/registry';
/**
 * Devices ▸ Networks — every live session of the instance, and where it comes
 * from.
 *
 * ── Why this page did not exist ──────────────────────────────────────────────
 * Until now the only way to answer "who is signed in right now" was to open
 * each account in turn. A question that costs one click per user is a question
 * nobody asks, which is why an instance could carry a forgotten session for a
 * year without anyone noticing.
 *
 * ── The 2FA filter earns its place ───────────────────────────────────────────
 * "Sessions that never passed a second factor" is the one query an operator
 * runs after tightening the policy, and the tri-state rule applies to it too:
 * a session whose strength is unknown counts as NOT having passed 2FA. The
 * server does that narrowing, not this component.
 */
export default function NetworksSection({ params }: AdminSectionProps): import("react").JSX.Element;
