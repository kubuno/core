/**
 * The mark of THIS instance — its own when an administrator set one, the
 * product's otherwise.
 *
 * `instance.logo_url` has been a public setting since the first migration and
 * was editable in the console, but nothing ever read it: a knob that changed
 * nothing. This component is the single place that honours it, so a
 * self-hosted deployment carries its own identity everywhere the product mark
 * used to be hard-coded — sign-in, shell, printed reports.
 *
 * Read from the PUBLIC configuration (`/config`), never from the admin
 * settings: the sign-in page must draw it before anybody is authenticated.
 * Same query key as the sign-in page and the reports header, so the whole
 * console shares one cached read.
 *
 * `className` styles the FALLBACK only. The product mark is a glyph coloured
 * through `currentColor` (`text-primary`, `text-white`); a custom logo is an
 * image whose colours are its own, and tinting it would be wrong.
 */
export declare function InstanceLogo({ size, className }: {
    size?: number;
    className?: string;
}): import("react").JSX.Element;
