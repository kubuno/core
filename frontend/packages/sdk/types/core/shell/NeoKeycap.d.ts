/**
 * Canvas-painted keycap SURFACE for the sidebar « Nouveau » button.
 *
 * CSS box-shadows could not reproduce the reference render (a plastic key with
 * a domed face, a bright rolled top edge and a thick shaded bottom roll whose
 * boundary with the face is crisp): shadows either blur into a haze or read as
 * an inner frame. A canvas paints the exact gradient profile instead — same
 * approach as the @ui Toggle, which is canvas-drawn for the same reason.
 *
 * The canvas fills the button (absolute, z 0) and paints ONLY the face; the
 * outer drop shadows, the 1px press travel and the focus ring stay CSS
 * (`.kb-neo-btn`). The label/icon are ordinary DOM children above (z 1).
 * Repaints on resize (the button morphs during sidebar collapse), on `pressed`
 * (menu open / pointer down) and follows the element's own border-radius.
 */
export declare function NeoKeycap({ pressed }: {
    pressed: boolean;
}): import("react").JSX.Element;
