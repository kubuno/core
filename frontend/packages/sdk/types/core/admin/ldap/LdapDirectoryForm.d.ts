import { type DirectoryForm } from './types';
export default function LdapDirectoryForm({ form, setForm, isEdit, hasStoredPassword, onSave, onCancel, saving, onClearPassword, }: {
    form: DirectoryForm;
    setForm: (f: DirectoryForm) => void;
    isEdit: boolean;
    hasStoredPassword: boolean;
    onSave: () => void;
    onCancel: () => void;
    saving: boolean;
    onClearPassword?: () => void;
}): import("react").JSX.Element;
/** Icons re-exported so the section can label its cards consistently. */
export declare const StepIcons: {
    Network: import("react").ForwardRefExoticComponent<Omit<import("lucide-react").LucideProps, "ref"> & import("react").RefAttributes<SVGSVGElement>>;
    KeyRound: import("react").ForwardRefExoticComponent<Omit<import("lucide-react").LucideProps, "ref"> & import("react").RefAttributes<SVGSVGElement>>;
    Users: import("react").ForwardRefExoticComponent<Omit<import("lucide-react").LucideProps, "ref"> & import("react").RefAttributes<SVGSVGElement>>;
    RefreshCw: import("react").ForwardRefExoticComponent<Omit<import("lucide-react").LucideProps, "ref"> & import("react").RefAttributes<SVGSVGElement>>;
};
