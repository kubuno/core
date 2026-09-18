import type { AccountCounts, InstanceInfo } from './api';
/**
 * Which installation this is.
 *
 * Every field here already existed somewhere — the name is `instance.name`, the
 * version is what `/health` reports, the account counts are the dashboard's —
 * except the identifier and the installation date, which had no home until
 * migration `000120`. The identifier is minted locally and transmitted nowhere:
 * it exists so that an operator opening a ticket can say *which* instance, and
 * for nothing else.
 */
export default function InstanceCard({ instance, accounts, }: {
    instance: InstanceInfo;
    accounts: AccountCounts | null;
}): import("react").JSX.Element;
