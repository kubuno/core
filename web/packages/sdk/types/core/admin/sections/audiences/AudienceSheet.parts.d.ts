import { type AudienceMember } from "./api";
import type { AudienceSheet } from './AudienceSheet';
declare function MemberRow({ m, canManage, onRemove, }: {
    m: AudienceMember;
    canManage: boolean;
    onRemove: () => void;
}): import("react").JSX.Element;
export { MemberRow };
export declare function Part1({ setAdding, t }: {
    setAdding: NonNullable<AudienceSheet['setAdding']>;
    t: NonNullable<AudienceSheet['tr']>;
}): import("react").JSX.Element;
