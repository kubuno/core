interface Props {
    url: string;
    filename: string;
    onClose: () => void;
}
export default function PdfViewerModal({ url, filename, onClose }: Props): import("react").JSX.Element;
export {};
