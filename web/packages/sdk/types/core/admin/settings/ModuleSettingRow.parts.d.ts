import { type Risk, type SettingItem } from "./moduleSettingSchema";
interface ControlProps {
    item: SettingItem;
    value: unknown;
    invalid: boolean;
    readOnly: boolean;
    onChange: (v: unknown) => void;
}
declare function RiskPill({ risk }: {
    risk: Risk;
}): import("react").JSX.Element | null;
export { RiskPill };
declare function Control({ item, value, invalid, readOnly, onChange }: ControlProps): import("react").JSX.Element;
export { Control };
