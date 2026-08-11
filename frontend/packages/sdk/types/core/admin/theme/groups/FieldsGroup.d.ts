import { type Gradient, type PickerTheme } from '@ui';
/**
 * Input fields (number, textarea, font, colour, gradient). The gradient value is
 * owned by the gallery so this group and the pickers group stay in sync, exactly
 * as before the split.
 */
export default function FieldsGroup({ pickerTheme, grad, setGrad }: {
    pickerTheme: PickerTheme;
    grad: Gradient;
    setGrad: (g: Gradient) => void;
}): import("react").JSX.Element;
