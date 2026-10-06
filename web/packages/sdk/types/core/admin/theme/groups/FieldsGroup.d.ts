import { type Gradient, type PickerTheme } from "@ui";
import { ViewBase } from './FieldsGroup.kbview';
import * as __parts from './FieldsGroup.parts';
export type FieldsGroupProps = {
    pickerTheme: PickerTheme;
    grad: Gradient;
    setGrad: (g: Gradient) => void;
};
export declare class FieldsGroup extends ViewBase {
    accessor num: number;
    accessor txt: string;
    accessor font: string;
    accessor floatSel: boolean;
    accessor colField: string;
    tr: FieldsGroupStores['t'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        txt: string;
        setTxt: (value: FieldsGroup["txt"] | ((prev: FieldsGroup["txt"]) => FieldsGroup["txt"])) => void;
    };
    /** A part of the screen still written in React (<TextArea> rows: no .kbview property). */
    get Part1(): typeof __parts.Part1;
    /** `<FontPicker>`, rendered by a ReactHost. */
    get FontPicker(): typeof import("../../../../ui/FontPicker").FontPicker;
    get font_picker_props(): {
        value: string;
        onChange: (value: FieldsGroup["font"] | ((prev: FieldsGroup["font"]) => FieldsGroup["font"])) => void;
        fonts: string[];
    };
    /** `<FloatCheckbox>`, rendered by a ReactHost. */
    get FloatCheckbox(): typeof import("../../../../ui/FloatCheckbox").FloatCheckbox;
    get float_checkbox_props(): import("../../../../ui/FloatCheckbox").FloatCheckboxProps;
    get part2_props(): {
        colField: string;
        setColField: (value: FieldsGroup["colField"] | ((prev: FieldsGroup["colField"]) => FieldsGroup["colField"])) => void;
        pickerTheme: PickerTheme;
    };
    /** A part of the screen still written in React (<ColorField> C: no .kbview property). */
    get Part2(): typeof __parts.Part2;
    get part3_props(): {
        grad: Gradient;
        setGrad: (g: Gradient) => void;
        pickerTheme: PickerTheme;
    };
    /** A part of the screen still written in React (<GradientField> value: a value the property converts (gradient-css)). */
    get Part3(): typeof __parts.Part3;
    /** `setTxt` of the TSX: a value, or an update of the previous one. */
    setTxt(value: FieldsGroup['txt'] | ((prev: FieldsGroup['txt']) => FieldsGroup['txt'])): void;
    /** `setFont` of the TSX: a value, or an update of the previous one. */
    setFont(value: FieldsGroup['font'] | ((prev: FieldsGroup['font']) => FieldsGroup['font'])): void;
    /** `setColField` of the TSX: a value, or an update of the previous one. */
    setColField(value: FieldsGroup['colField'] | ((prev: FieldsGroup['colField']) => FieldsGroup['colField'])): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type FieldsGroupStores = ReturnType<FieldsGroup['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<FieldsGroupProps>>;
export default _default;
