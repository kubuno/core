import { ViewBase } from './StartPageDemo.kbview';
export declare class StartPageDemo extends ViewBase {
    /** `<StartPage>`, rendered by a ReactHost. */
    get StartPage(): typeof import("../../../ui/StartPage").StartPage;
    get start_page_props(): {
        recentItems: {
            id: string;
            name: string;
            subtitle: string;
            onClick: () => void;
        }[];
        tabs: {
            id: string;
            label: string;
            content: import("react").JSX.Element;
        }[];
    };
}
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
