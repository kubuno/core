import { type Domain } from './api';
export default function AddDomainDialog({ domains, onClose, onAdded, }: {
    /** Candidates an alias can hang off: verified, non-alias. */
    domains: Domain[];
    onClose: () => void;
    /** Called with the new domain, so the page can open its verification screen. */
    onAdded: (domain: Domain) => void;
}): import("react").JSX.Element;
