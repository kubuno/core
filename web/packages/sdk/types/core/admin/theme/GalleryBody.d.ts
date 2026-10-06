import type { ThemeDef } from '../../store/themeStore';
/**
 * The gallery body: one accordion group per family of objects. It is rendered by
 * PreviewFrame's nested React root (inside the shadow DOM), so its hooks and
 * event handlers all live in that root — clicks, toggles, slider/resize drags
 * resolve correctly. Accordion panels stay mounted, so each group owns its own
 * demo state; only the gradient is shared (fields ↔ pickers) and therefore lifted
 * here.
 *
 * To add a group: write a component under `groups/` and push an entry below.
 */
export default function GalleryBody({ theme }: {
    theme: ThemeDef;
}): import("react").JSX.Element;
