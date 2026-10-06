import { type DataTableColumn } from "@ui";
import type { InstalledModule } from "./api";
import { ViewBase } from './ModulesLicenceCard.kbview';
import * as __parts from './ModulesLicenceCard.parts';
export type ModulesLicenceCardProps = {
    modules: InstalledModule[];
};
export declare class ModulesLicenceCard extends ViewBase {
    tr: ModulesLicenceCardStores['t'];
    columns: DataTableColumn<InstalledModule>[];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        i18n: import("i18next").i18n;
        columns: DataTableColumn<InstalledModule>[];
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get part1_props(): {
        modules: InstalledModule[];
        columns: DataTableColumn<InstalledModule>[];
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<DataTable> columns, rowKey, defaultSort, t: no .kbview property). */
    get Part1(): typeof __parts.Part1;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type ModulesLicenceCardStores = ReturnType<ModulesLicenceCard['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<ModulesLicenceCardProps>>;
export default _default;
