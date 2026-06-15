import type { WaffleApp } from '../registry/WaffleAppRegistry';
interface Props {
    allApps: WaffleApp[];
    compact?: boolean;
    dark?: boolean;
}
export default function WaffleMenu({ allApps, compact, dark }: Props): import("react").JSX.Element;
export {};
