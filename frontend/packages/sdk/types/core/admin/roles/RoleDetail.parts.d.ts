import type { RoleDetail } from './RoleDetail';
export declare function Part1({ assignments, isLoading, t, canGrant, setAssignOpen, when, askRevoke }: {
    assignments: RoleDetail['assignments'];
    isLoading: NonNullable<RoleDetail['isLoading']>;
    t: NonNullable<RoleDetail['tr']>;
    canGrant: NonNullable<RoleDetail['canGrant']>;
    setAssignOpen: NonNullable<RoleDetail['setAssignOpen']>;
    when: RoleDetail['when'];
    askRevoke: RoleDetail['askRevoke'];
}): import("react").JSX.Element;
