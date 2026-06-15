import type React from 'react';
export type WidgetSize = 'small' | 'medium' | 'large';
/**
 * Declarative settings schema for a widget. Rendered as controls in the
 * per-widget settings popover (gear icon, edit mode). `label` and option
 * labels are i18n keys, translated at render time.
 */
export type WidgetSettingField = {
    key: string;
    type: 'select';
    label: string;
    default: string;
    options: {
        value: string;
        label: string;
    }[];
} | {
    key: string;
    type: 'toggle';
    label: string;
    default: boolean;
};
export interface WidgetDef {
    id: string;
    moduleId: string;
    Component: React.ComponentType;
    size?: WidgetSize;
    order?: number;
    /** Optional per-widget settings, surfaced via the gear icon in edit mode. */
    settings?: WidgetSettingField[];
}
export declare const WidgetRegistry: {
    register(def: WidgetDef): void;
    getAll(): WidgetDef[];
};
