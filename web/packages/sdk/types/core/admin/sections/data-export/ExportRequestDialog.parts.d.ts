import type { ExportRequestDialog } from './ExportRequestDialog';
declare function Legend({ children }: {
    children: React.ReactNode;
}): import("react").JSX.Element;
export { Legend };
declare function Hint({ children }: {
    children: React.ReactNode;
}): import("react").JSX.Element;
export { Hint };
declare function ScopeChoice({ checked, onSelect, title, description }: {
    checked: boolean;
    onSelect: () => void;
    title: string;
    description: string;
}): import("react").JSX.Element;
export { ScopeChoice };
export declare function Part1({ t, onClose, submit, canSubmit, request, scope, setScope, overview, query, setQuery, pickedLabels, setPicked, loadingUsers, shown, picked, services, toggleService, withInstance, setWithInstance, accounts, i18n, error }: {
    t: NonNullable<ExportRequestDialog['tr']>;
    onClose: NonNullable<ExportRequestDialog['props']['onClose']>;
    submit: ExportRequestDialog['submit'];
    canSubmit: NonNullable<ExportRequestDialog['canSubmit']>;
    request: NonNullable<ExportRequestDialog['request']>;
    scope: NonNullable<ExportRequestDialog['scope']>;
    setScope: NonNullable<ExportRequestDialog['setScope']>;
    overview: NonNullable<ExportRequestDialog['props']['overview']>;
    query: NonNullable<ExportRequestDialog['query']>;
    setQuery: NonNullable<ExportRequestDialog['setQuery']>;
    pickedLabels: NonNullable<ExportRequestDialog['pickedLabels']>;
    setPicked: NonNullable<ExportRequestDialog['setPicked']>;
    loadingUsers: NonNullable<ExportRequestDialog['loadingUsers']>;
    shown: NonNullable<ExportRequestDialog['shown']>;
    picked: NonNullable<ExportRequestDialog['picked']>;
    services: NonNullable<ExportRequestDialog['services']>;
    toggleService: ExportRequestDialog['toggleService'];
    withInstance: NonNullable<ExportRequestDialog['withInstance']>;
    setWithInstance: NonNullable<ExportRequestDialog['setWithInstance']>;
    accounts: NonNullable<ExportRequestDialog['accounts']>;
    i18n: NonNullable<ExportRequestDialog['i18n']>;
    error: NonNullable<ExportRequestDialog['error']>;
}): import("react").JSX.Element;
