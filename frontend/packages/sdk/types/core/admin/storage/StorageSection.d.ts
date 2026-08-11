import type { AdminSectionProps } from '../sections/registry';
/**
 * Storage — the capacity page.
 *
 * ## The three numbers, and why none of them is "the" number
 *
 *  * **Consumed** — what the accounts hold. The sum the modules maintain.
 *  * **Allocated** — the sum of the quotas: what has been *promised*. Routinely
 *    several times the disk, and legitimately so.
 *  * **The volume** — what the filesystem actually has. The only hard ceiling,
 *    and the only one whose exhaustion breaks the instance rather than one
 *    account.
 *
 * The page leads with consumption against the volume, because that is the
 * ceiling that fails, and keeps the other two beside it rather than folding them
 * into one reassuring bar.
 *
 * ## The split by module
 *
 * Still not derived from consumption — the core holds one figure per account
 * with no provenance, and slicing it into plausible parts would be a chart that
 * lies. It is assembled instead from what each module **declared about itself**,
 * which makes three states visible where there used to be one number: declared,
 * declared zero, and never declared. Whatever the declarations do not cover is
 * named on the card rather than folded into a module's slice.
 */
export default function StorageSection({ params, navigate }: AdminSectionProps): import("react").JSX.Element;
