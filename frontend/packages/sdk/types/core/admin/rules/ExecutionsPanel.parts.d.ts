import type { ExecutionRow } from "./types";
declare function Detail({ row, ruleSeverity }: {
    row: ExecutionRow;
    ruleSeverity: string | undefined;
}): import("react").JSX.Element;
export { Detail };
