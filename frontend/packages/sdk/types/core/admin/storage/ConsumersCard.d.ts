import { type ConsumerFilter } from './api';
export default function ConsumersCard({ warnPercent, initialFilter, }: {
    warnPercent: number;
    /** `/admin/storage?filter=full` — the saturated accounts, addressable directly. */
    initialFilter?: ConsumerFilter;
}): import("react").JSX.Element;
