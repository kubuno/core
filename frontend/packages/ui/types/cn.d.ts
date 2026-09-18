/**
 * Class names, composed in house.
 *
 * `clsx` was pulled into eight repositories to do what fits in a dozen lines,
 * and `tailwind-merge` into one more. Neither earns a place in a supply chain we
 * want to keep small: this is finished logic — it will not gain features, and it
 * has no security surface worth tracking upstream.
 *
 * Accepts what call sites already pass: strings, conditions that fall through
 * when false, arrays, and objects keyed by class name.
 *
 *   cn('btn', isActive && 'btn--on', { 'btn--lg': big }, extra)
 */
export type ClassValue = string | number | bigint | null | undefined | false | ClassValue[] | {
    [key: string]: unknown;
};
export declare function cn(...inputs: ClassValue[]): string;
/** The name `clsx` used, kept so call sites can move without being rewritten. */
export declare const clsx: typeof cn;
export default cn;
