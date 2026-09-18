import { type SupportInfo } from './api';
/**
 * Who is obliged to help, if anybody is.
 *
 * ## Having no contract is the normal state, not a degraded one
 *
 * The software is free and self-hosted: the overwhelming majority of instances
 * will never register anything here, and the card they see must read as a
 * complete answer — community support, with the real addresses of the real
 * repository — rather than as an empty slot waiting to be filled. There is no
 * locked feature behind this card, no counter, and nothing that stops working
 * without it.
 *
 * ## Why the paid offer is one sentence
 *
 * Support is what the publisher actually sells, so saying so is honest. Saying
 * it more than once, or with a coloured banner, would turn an administration
 * page into an advertisement — on a screen an operator opened to answer a
 * question, not to buy anything.
 *
 * ## Verified versus declarative
 *
 * A key is a document the publisher signed offline; the instance checks the
 * signature against a public key compiled into it, and never opens a socket to
 * do so. Until the publisher mints that signing key, nothing can be checked, and
 * the card says exactly that instead of dressing a typed contract as a proven
 * one. Both states are shown; only the label differs.
 */
export default function SupportCard({ support, canManage, }: {
    support: SupportInfo;
    canManage: boolean;
}): import("react").JSX.Element;
