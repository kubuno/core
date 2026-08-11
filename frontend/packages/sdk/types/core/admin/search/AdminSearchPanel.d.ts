import { type AdminResult } from './adminSearchIndex';
import type { RecentTarget } from './adminSearchRecents';
export interface RowProps {
    result: AdminResult;
    active: boolean;
    optionId: string;
    mobile: boolean;
    onPick: (r: AdminResult) => void;
    /** Keeps the input focused: a row must never steal it away from the field. */
    onHover: () => void;
}
export declare function ResultRow({ result, active, optionId, mobile, onPick, onHover }: RowProps): import("react").JSX.Element;
export interface PanelProps {
    listId: string;
    optionId: (index: number) => string;
    /** Flat list in keyboard order — the single source of both orders. */
    results: AdminResult[];
    activeIndex: number;
    setActive: (index: number) => void;
    onPick: (result: AdminResult) => void;
    onNavigate: (url: string) => void;
    query: string;
    recents: RecentTarget[];
    suggestions: AdminResult[];
    nearMisses: AdminResult[];
    loading: boolean;
    mobile: boolean;
}
export default function AdminSearchPanel(props: PanelProps): import("react").JSX.Element;
