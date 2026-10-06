export type WidgetConfigValue = Record<string, unknown>;
export interface WidgetConfigCtx {
    /** Current persisted config for this widget (raw, may be missing keys). */
    value: WidgetConfigValue;
    /** Update a single config key for this widget (persisted by the grid). */
    set: (key: string, value: unknown) => void;
}
export declare const WidgetConfigContext: import("react").Context<WidgetConfigCtx>;
/**
 * Read this widget's config, merged over `defaults`.
 * Usage: `const cfg = useWidgetConfig({ style: 'digital', seconds: false })`
 */
export declare function useWidgetConfig<T extends WidgetConfigValue>(defaults: T): T & {
    set: (key: keyof T & string, value: unknown) => void;
};
