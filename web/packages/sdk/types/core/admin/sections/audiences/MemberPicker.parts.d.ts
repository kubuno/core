import type { MemberPicker } from './MemberPicker';
export declare function Part1({ t, onCancel, chosen, addedReach, onAdd, busy, q, setQ, shown, picked, toggle, error }: {
    t: NonNullable<MemberPicker['tr']>;
    onCancel: NonNullable<MemberPicker['props']['onCancel']>;
    chosen: NonNullable<MemberPicker['chosen']>;
    addedReach: NonNullable<MemberPicker['addedReach']>;
    onAdd: NonNullable<MemberPicker['props']['onAdd']>;
    busy: NonNullable<MemberPicker['props']['busy']>;
    q: NonNullable<MemberPicker['q']>;
    setQ: NonNullable<MemberPicker['setQ']>;
    shown: NonNullable<MemberPicker['shown']>;
    picked: NonNullable<MemberPicker['picked']>;
    toggle: MemberPicker['toggle'];
    error: NonNullable<MemberPicker['props']['error']>;
}): import("react").JSX.Element;
