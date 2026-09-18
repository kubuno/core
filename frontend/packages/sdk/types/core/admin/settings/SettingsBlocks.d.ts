import type { ReactNode } from 'react';
import type { SettingItem } from './moduleSettingSchema';
/**
 * A run of rows, plus the "Avancé" disclosure that holds back the expert knobs.
 *
 * The disclosure is not decoration: `mail` declares nearly a third of its
 * settings `advanced`, and showing them by default is the difference between a
 * page an operator reads and one they scroll past.
 */
export declare function SettingRows({ basic, advanced, advancedOpen, onToggleAdvanced, renderRow }: {
    basic: SettingItem[];
    advanced: SettingItem[];
    advancedOpen: boolean;
    onToggleAdvanced: () => void;
    renderRow: (item: SettingItem) => ReactNode;
}): import("react").JSX.Element;
