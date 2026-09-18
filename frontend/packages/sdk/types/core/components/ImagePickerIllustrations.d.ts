import type { ImageSourceProps } from '../registry/ImageSourceRegistry';
/**
 * "Illustrations" tab of the image picker: Kubuno's own artwork, offered to
 * anyone who would rather pick a picture than upload one. Everything is drawn
 * locally (see `illustrations.ts`), so this tab works with no network and owes
 * nothing to a third-party image bank.
 *
 * A picked illustration is handed back as a FILE rather than a URL: the caller
 * usually uploads it (a contact photo, an avatar), and a data: URL would leave
 * whoever reads the record later with a blob they cannot resolve.
 */
export default function ImagePickerIllustrations({ onPick, query }: ImageSourceProps): import("react").JSX.Element;
