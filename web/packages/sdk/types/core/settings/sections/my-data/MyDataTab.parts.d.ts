import type { MyDataTab } from './MyDataTab';
export declare function Part1({ error, t }: {
    error: MyDataTab['error'];
    t: NonNullable<MyDataTab['tr']>;
}): import("react").JSX.Element;
export declare function Part2({ stepper, goTo, hasSomething, data, selected, setSelected, maxFileMb, setMaxFileMb, i18n, startOver }: {
    stepper: NonNullable<MyDataTab['stepper']>;
    goTo: NonNullable<MyDataTab['goTo']>;
    hasSomething: NonNullable<MyDataTab['hasSomething']>;
    data: NonNullable<MyDataTab['data']>;
    selected: NonNullable<MyDataTab['selected']>;
    setSelected: NonNullable<MyDataTab['setSelected']>;
    maxFileMb: MyDataTab['maxFileMb'];
    setMaxFileMb: NonNullable<MyDataTab['setMaxFileMb']>;
    i18n: NonNullable<MyDataTab['i18n']>;
    startOver: MyDataTab['startOver'];
}): import("react").JSX.Element;
