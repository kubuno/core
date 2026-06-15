export type ConflictChoice = 'overwrite' | 'keep_both' | 'cancel';
interface Props {
    type: 'file' | 'folder';
    name: string;
    onChoice: (choice: ConflictChoice) => void;
}
export default function ConflictDialog({ type, name, onChoice }: Props): import("react").JSX.Element;
export {};
