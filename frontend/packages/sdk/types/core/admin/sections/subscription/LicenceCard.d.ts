import type { LicenceInfo } from './api';
/**
 * What this software is held under — a fact, not a purchase.
 *
 * The card leads with the SPDX identifier the repository actually declares
 * (`LICENSE` at the root, `license = "AGPL-3.0"` in every module manifest), then
 * says in two sentences what the licence grants and what it asks in return. The
 * second sentence matters more than the first here: the AGPL's network clause is
 * the one obligation an operator of a *self-hosted, modified* instance can
 * breach without noticing, and a page about licensing that omitted it would be
 * decorative.
 */
export default function LicenceCard({ licence }: {
    licence: LicenceInfo;
}): import("react").JSX.Element;
