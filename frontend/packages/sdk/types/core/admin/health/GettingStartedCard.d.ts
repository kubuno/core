/**
 * Code-behind of `GettingStartedCard.kbview` (converted from `GettingStartedCard.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs } from '@kubuno/views';
import { useNavigate } from 'react-router-dom';
import { type HealthCheck } from "./types";
import { ViewBase } from './GettingStartedCard.kbview';
import * as __parts from './GettingStartedCard.parts';
export declare class GettingStartedCard extends ViewBase {
    tr: GettingStartedCardStores['t'];
    data: GettingStartedCardStores['data'];
    isLoading: boolean;
    isError: boolean;
    navigate: ReturnType<typeof useNavigate>;
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        data: NoInfer<import("./types").HealthReport> | undefined;
        isLoading: boolean;
        isError: boolean;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get tasks(): HealthCheck[];
    get settled(): number;
    get scoreable(): number;
    get shown(): HealthCheck[];
    get show_case_1(): boolean;
    get show_case_2(): boolean;
    get href(): string;
    get show_main(): boolean;
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        tasks: HealthCheck[];
    };
    /** A part of the screen still written in React (<Link style>). */
    get Part1(): typeof __parts.Part1;
    get part2_props(): {
        settled: number;
        scoreable: number;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<ProgressBar> formatValue: no .kbview property). */
    get Part2(): typeof __parts.Part2;
    /** `<TaskRow>`, rendered by a ReactHost. */
    get TaskRow(): typeof __parts.TaskRow;
    /** The rows of the Repeater over `shown`. */
    get rows_shown(): {
        c: HealthCheck;
        task_row_props: {
            check: HealthCheck;
        } | undefined;
        key: string;
    }[];
    link_label_click(_sender: unknown, _args: MouseEventArgs): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type GettingStartedCardStores = ReturnType<GettingStartedCard['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
