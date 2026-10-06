import { type SupportInfo } from "./api";
import type { SupportCard } from './SupportCard';
declare function CommunitySupport({ support }: {
    support: SupportInfo;
}): import("react").JSX.Element;
export { CommunitySupport };
declare function ContractDetails({ contract, locale, verificationAvailable, }: {
    contract: NonNullable<SupportInfo['contract']>;
    locale: string;
    /** Whether this build carries any trusted signing key at all — the two
     *  reasons a contract can be declarative call for opposite explanations. */
    verificationAvailable: boolean;
}): import("react").JSX.Element;
export { ContractDetails };
declare function ContactLink({ contact }: {
    contact: string;
}): import("react").JSX.Element;
export { ContactLink };
export declare function Part1({ t, draft, setDraft }: {
    t: NonNullable<SupportCard['tr']>;
    draft: NonNullable<SupportCard['draft']>;
    setDraft: NonNullable<SupportCard['setDraft']>;
}): import("react").JSX.Element;
