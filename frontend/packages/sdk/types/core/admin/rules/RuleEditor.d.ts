import './detectorLeaf';
export type Pane = 'basics' | 'conditions' | 'actions' | 'scope' | 'mode' | 'impact' | 'history';
interface Props {
    /** `null` ⇒ creation. */
    ruleId: string | null;
    onClose: () => void;
    canWrite: boolean;
    /** Deep link into one pane (`/admin/rules?rule=…&pane=impact`). */
    initialPane?: Pane;
}
export default function RuleEditor({ ruleId, onClose, canWrite, initialPane }: Props): import("react").JSX.Element;
export {};
