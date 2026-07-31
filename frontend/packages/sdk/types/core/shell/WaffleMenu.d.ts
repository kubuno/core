import type { WaffleApp } from '../registry/WaffleAppRegistry';
interface Props {
    allApps: WaffleApp[];
    compact?: boolean;
    dark?: boolean;
    fab?: boolean;
    onOpenChange?: (open: boolean) => void;
}
export default function WaffleMenu({ allApps, compact, dark, fab, onOpenChange }: Props): import("react").JSX.Element;
export {};
