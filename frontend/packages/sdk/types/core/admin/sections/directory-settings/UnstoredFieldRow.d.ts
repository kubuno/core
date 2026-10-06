/**
 * Code-behind of `UnstoredFieldRow.kbview` (converted from `UnstoredFieldRow.tsx` by @kubuno/views-migrate).
 */
import { type ValueChangedEventArgs } from '@kubuno/views';
import { ViewBase } from './UnstoredFieldRow.kbview';
export type UnstoredFieldRowProps = {
    field: string;
};
export declare class UnstoredFieldRow extends ViewBase {
    tr: UnstoredFieldRowStores['t'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get text(): string;
    check_box_checked_changed(_sender: unknown, _args: ValueChangedEventArgs): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type UnstoredFieldRowStores = ReturnType<UnstoredFieldRow['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<UnstoredFieldRowProps>>;
export default _default;
