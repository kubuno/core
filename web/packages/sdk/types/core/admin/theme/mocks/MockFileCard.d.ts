/**
 * Code-behind of `MockFileCard.kbview` (converted from `MockFileCard.tsx` by @kubuno/views-migrate).
 */
import { ViewBase } from './MockFileCard.kbview';
export type MockFileCardProps = {
    name?: string | undefined;
    ext?: string | undefined;
    selected?: boolean | undefined;
};
export declare class MockFileCard extends ViewBase {
    get name(): string;
    get ext(): string;
    get selected(): boolean;
    get div_class(): string;
}
declare const _default: import("react").FunctionComponent<Readonly<MockFileCardProps>>;
export default _default;
