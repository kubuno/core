/**
 * The web target's typography, as the views tooling needs it (VIEWS-SPEC §7): the production
 * faces with their files and licences, the family stacks, and the values of the shared
 * typographic roles (`Label Role="…"`, the `--kb-text-*` tokens).
 *
 * The source of truth stays `src/index.css` (`@font-face`, `--font-family-sans`, body and button
 * weights) and `src/theme.css` (`--kb-text-*`, `--font-family-mono`); the registry test reads both
 * files and fails when this table no longer matches them. The design surface (`@kubuno/host-runtime`,
 * the project's dev server, the VSIX fallback host) must serve exactly these files.
 */
/** One `@font-face` of the host, served from `/fonts/` (`public/fonts/` in the sources). */
export interface FontFace {
    readonly family: string;
    readonly style: 'normal' | 'italic';
    /** CSS `font-weight` range (variable faces) or single weight. */
    readonly weight: string;
    /** Path under `public/`. */
    readonly file: string;
    /** SPDX identifier of the face's licence. */
    readonly license: 'OFL-1.1' | 'Apache-2.0';
    /** The licence text shipped next to the file, under `public/` — `null` while it is missing. */
    readonly licenseFile: string | null;
}
export declare const WEB_FONT_FACES: readonly FontFace[];
/** The family stacks (`--font-family-sans` of `index.css`, `--font-family-mono` of `theme.css`). */
export declare const WEB_FONT_FAMILIES: {
    readonly sans: readonly ["Plus Jakarta Sans", "Outfit", "Roboto", "Arial", "sans-serif"];
    readonly mono: readonly ["DM Mono", "Fira Code", "monospace"];
};
/**
 * The typographic roles shared by both targets (`Label Role`, desktop `kubuno_ui::display::Role`),
 * with their web token and size in CSS px. The desktop keeps its own sizes for the same roles.
 */
export declare const WEB_TEXT_ROLES: {
    readonly Micro: {
        readonly token: "--kb-text-micro";
        readonly size: 10.5;
    };
    readonly Meta: {
        readonly token: "--kb-text-meta";
        readonly size: 11.5;
    };
    readonly Body: {
        readonly token: "--kb-text-body";
        readonly size: 13.5;
    };
    readonly Heading: {
        readonly token: "--kb-text-heading";
        readonly size: 15.5;
    };
    readonly Title: {
        readonly token: "--kb-text-title";
        readonly size: 21.5;
    };
};
/** Page titles (`--kb-text-page`): not a Label role, the page header's own step. */
export declare const WEB_PAGE_TITLE: {
    readonly token: "--kb-text-page";
    readonly size: 22.5;
    readonly adminSize: 27.5;
};
/** Weights the host enforces (`index.css`): running text 500, `font-medium` → 600, buttons 500. */
export declare const WEB_FONT_WEIGHTS: {
    readonly body: 500;
    readonly medium: 600;
    readonly button: 500;
};
