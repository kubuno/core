import type { ThemeDef } from '../store/themeStore';
/** Aperçu d'un thème dans un cadre d'appareil (mobile / tablette / PC). */
export default function ThemeDevicePreview({ theme }: {
    theme: ThemeDef;
}): import("react").JSX.Element;
