import type { FieldsGroup } from './FieldsGroup';
export declare function Part1({ t, txt, setTxt }: {
    t: NonNullable<FieldsGroup['tr']>;
    txt: NonNullable<FieldsGroup['txt']>;
    setTxt: NonNullable<FieldsGroup['setTxt']>;
}): import("react").JSX.Element;
export declare function Part2({ colField, setColField, pickerTheme }: {
    colField: NonNullable<FieldsGroup['colField']>;
    setColField: NonNullable<FieldsGroup['setColField']>;
    pickerTheme: NonNullable<FieldsGroup['props']['pickerTheme']>;
}): import("react").JSX.Element;
export declare function Part3({ grad, setGrad, pickerTheme }: {
    grad: NonNullable<FieldsGroup['props']['grad']>;
    setGrad: NonNullable<FieldsGroup['props']['setGrad']>;
    pickerTheme: NonNullable<FieldsGroup['props']['pickerTheme']>;
}): import("react").JSX.Element;
