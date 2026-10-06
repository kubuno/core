import { type Gradient, type PickerTheme } from "@ui";
import { ViewBase } from './PickersGroup.kbview';
export type PickersGroupProps = {
    pickerTheme: PickerTheme;
    grad: Gradient;
    setGrad: (g: Gradient) => void;
};
export declare class PickersGroup extends ViewBase {
    accessor swatch: string;
    accessor pick: string;
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    /** `<ColorSwatchPicker>`, rendered by a ReactHost. */
    get ColorSwatchPicker(): typeof import("../../../../ui/ColorSwatchPicker").ColorSwatchPicker;
    get color_swatch_picker_props(): {
        color: string;
        onChange: (value: PickersGroup["swatch"] | ((prev: PickersGroup["swatch"]) => PickersGroup["swatch"])) => void;
        theme: PickerTheme;
    };
    /** `<ColorPicker>`, rendered by a ReactHost. */
    get ColorPicker(): typeof import("../../../../ui/ColorPicker").ColorPicker;
    get color_picker_props(): {
        t?: import("i18next").TFunction;
        color: string;
        onChange: (hex: string) => void;
        onClose: () => void;
        C?: PickerTheme;
        history?: string[];
        onPickHistory?: (hex: string) => void;
        onConfirm?: (hex: string) => void;
        onCancel?: () => void;
        confirmLabel?: string;
        cancelLabel?: string;
        leftTools?: import("@ui").PickerTool[];
    };
    /** `<GradientPicker>`, rendered by a ReactHost. */
    get GradientPicker(): typeof import("../../../../ui/GradientPicker").GradientPicker;
    get gradient_picker_props(): {
        value: Gradient;
        onChange: (g: Gradient) => void;
        C: PickerTheme;
    };
    /** `setSwatch` of the TSX: a value, or an update of the previous one. */
    setSwatch(value: PickersGroup['swatch'] | ((prev: PickersGroup['swatch']) => PickersGroup['swatch'])): void;
    /** `setPick` of the TSX: a value, or an update of the previous one. */
    setPick(value: PickersGroup['pick'] | ((prev: PickersGroup['pick']) => PickersGroup['pick'])): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type PickersGroupStores = ReturnType<PickersGroup['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<PickersGroupProps>>;
export default _default;
