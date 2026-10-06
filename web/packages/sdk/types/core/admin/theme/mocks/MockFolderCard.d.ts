/**
 * Code-behind of `MockFolderCard.kbview` (converted from `MockFolderCard.tsx` by @kubuno/views-migrate).
 */
import { ViewBase } from './MockFolderCard.kbview';
export type MockFolderCardProps = {
    name?: string | undefined;
    selected?: boolean | undefined;
};
export declare class MockFolderCard extends ViewBase {
    get name(): string;
    get selected(): boolean;
    get div_class(): string;
}
declare const _default: import("react").FunctionComponent<Readonly<MockFolderCardProps>>;
export default _default;
