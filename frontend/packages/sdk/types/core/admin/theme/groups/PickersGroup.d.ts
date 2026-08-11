import { type Gradient, type PickerTheme } from '@ui';
/** Swatch grid, full colour picker and gradient picker (open, inline). */
export default function PickersGroup({ pickerTheme, grad, setGrad }: {
    pickerTheme: PickerTheme;
    grad: Gradient;
    setGrad: (g: Gradient) => void;
}): import("react").JSX.Element;
