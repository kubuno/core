/**
 * Code-behind of `MockFileRow.kbview` (converted from `MockFileRow.tsx` by @kubuno/views-migrate).
 */
import { ViewBase } from './MockFileRow.kbview';
export type MockFileRowProps = {
    name?: string | undefined;
    size?: string | undefined;
    selected?: boolean | undefined;
};
export declare class MockFileRow extends ViewBase {
    get name(): string;
    get size(): string;
    get selected(): boolean;
    get div_class(): string;
}
declare const _default: import("react").FunctionComponent<Readonly<MockFileRowProps>>;
export default _default;
