import type { ParamDef } from "./types";
import type { ActionsEditor } from './ActionsEditor';
declare function ParamControl({ param, value, onChange, disabled }: {
    param: ParamDef;
    value: unknown;
    onChange: (v: unknown) => void;
    disabled?: boolean;
}): import("react").JSX.Element;
export { ParamControl };
export declare function Part1({ t }: {
    t: NonNullable<ActionsEditor['tr']>;
}): import("react").JSX.Element;
export declare function Part2({ t }: {
    t: NonNullable<ActionsEditor['tr']>;
}): import("react").JSX.Element;
export declare function Part3({ schema, spec, setParam, index, disabled }: {
    schema: NonNullable<ActionsEditor['rows_value']>[number]['schema'];
    spec: NonNullable<ActionsEditor['rows_value']>[number]['spec'];
    setParam: ActionsEditor['setParam'];
    index: NonNullable<ActionsEditor['rows_value']>[number]['index'];
    disabled: ActionsEditor['props']['disabled'];
}): import("react").JSX.Element;
export declare function Part4({ menu_pos, addItems, menu }: {
    menu_pos: NonNullable<NonNullable<ActionsEditor['menu']>['pos']>;
    addItems: NonNullable<ActionsEditor['addItems']>;
    menu: NonNullable<ActionsEditor['menu']>;
}): import("react").JSX.Element;
