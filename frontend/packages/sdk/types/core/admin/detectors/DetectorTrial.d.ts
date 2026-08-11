import { type DetectorInput } from './api';
interface Props {
    /** A saved detector… */
    detectorId?: string | null;
    /** …or the one being written, so a pattern can be tried before it is saved. */
    draft?: DetectorInput | null;
    /** Reason the draft cannot be tried yet (incomplete form). */
    draftError?: string | null;
}
export default function DetectorTrial({ detectorId, draft, draftError }: Props): import("react").JSX.Element;
export {};
