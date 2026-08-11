import { type RailEntry } from '../store/rightPanelStore';
export interface RightRailPrefs {
    order: string[];
    hidden: string[];
}
/** Apply the saved order/visibility to the live entries. */
export declare function applyPrefs(entries: RailEntry[], prefs: RightRailPrefs): RailEntry[];
export declare function useRightRailPrefs(): {
    prefs: RightRailPrefs;
    entries: RailEntry[];
    visible: RailEntry[];
    save: (next: RightRailPrefs) => void;
};
