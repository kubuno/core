import { type DataCardProps, type KubunoDataEnvelope } from './DataTransferRegistry';
export interface DriveFileData {
    id: string;
    name: string;
    size_bytes: number;
    mime_type: string;
    folder_id: string | null;
}
export declare function driveFileEnvelope(f: DriveFileData): KubunoDataEnvelope;
export declare function DriveFileCard({ envelope }: DataCardProps): import("react").JSX.Element | null;
