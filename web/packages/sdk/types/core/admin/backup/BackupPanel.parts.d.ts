import { type BackupOverview } from "./api";
import type { BackupPanel } from './BackupPanel';
declare function StatusBanner({ data }: {
    data: BackupOverview;
}): import("react").JSX.Element;
export { StatusBanner };
declare function Coverage({ data }: {
    data: BackupOverview;
}): import("react").JSX.Element;
export { Coverage };
declare function Fact({ label, value }: {
    label: string;
    value: string;
}): import("react").JSX.Element;
export { Fact };
declare function PolicySummary({ data }: {
    data: BackupOverview;
}): import("react").JSX.Element;
export { PolicySummary };
declare function RestoreDrill({ data, canManage }: {
    data: BackupOverview;
    canManage: boolean;
}): import("react").JSX.Element;
export { RestoreDrill };
declare function History({ data, loading }: {
    data: BackupOverview | undefined;
    loading: boolean;
}): import("react").JSX.Element;
export { History };
declare function RestoreFiles({ canRestore }: {
    canRestore: boolean;
}): import("react").JSX.Element | null;
export { RestoreFiles };
export declare function Part1({ anchor, t, canManage, run, data, trigger, isLoading }: {
    anchor: NonNullable<BackupPanel['anchor']>;
    t: NonNullable<BackupPanel['tr']>;
    canManage: NonNullable<BackupPanel['canManage']>;
    run: NonNullable<BackupPanel['run']>;
    data: NonNullable<BackupPanel['data']>;
    trigger: BackupPanel['trigger'];
    isLoading: NonNullable<BackupPanel['isLoading']>;
}): import("react").JSX.Element;
