import type { WidgetSettingField } from './WidgetRegistry';
interface Props {
    fields: WidgetSettingField[];
    value: Record<string, unknown>;
    onChange: (key: string, value: unknown) => void;
    onClose: () => void;
}
/** Schema-driven settings panel shown under a widget's gear icon (edit mode). */
export default function WidgetSettingsPopover({ fields, value, onChange, onClose }: Props): import("react").JSX.Element;
export {};
