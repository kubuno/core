import { type Audience } from './api';
/**
 * What the audience is called and what it says it is — edited on the sheet.
 *
 * The counters live in each field's `hint` rather than in a message after a
 * refusal: 40 and 150 characters are short enough to reach by accident, and a
 * name typed in full only to be rejected is a name typed twice. Counted in
 * characters, like the server: a byte count would refuse a French name of forty
 * accented letters.
 *
 * The seeded "everyone" audience never gets a pencil — the server refuses to
 * rename it, and a button whose only outcome is an error is worse than none.
 */
export default function IdentityCard({ audience, canManage, }: {
    audience: Audience;
    canManage: boolean;
}): import("react").JSX.Element;
