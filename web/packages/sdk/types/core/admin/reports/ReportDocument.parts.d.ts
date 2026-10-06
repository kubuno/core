import type { ReportDocument } from './ReportDocument';
export declare function Part1({ barRef, crumbH, periodId, onPeriod, periodOptions, paper, setPaper, t, orientation, setOrientation, cover, setCover, watermark, setWatermark, exportCsv }: {
    barRef: NonNullable<ReportDocument['barRef']>;
    crumbH: NonNullable<ReportDocument['crumbH']>;
    periodId: NonNullable<ReportDocument['props']['periodId']>;
    onPeriod: NonNullable<ReportDocument['props']['onPeriod']>;
    periodOptions: NonNullable<ReportDocument['periodOptions']>;
    paper: NonNullable<ReportDocument['paper']>;
    setPaper: NonNullable<ReportDocument['setPaper']>;
    t: NonNullable<ReportDocument['tr']>;
    orientation: NonNullable<ReportDocument['orientation']>;
    setOrientation: NonNullable<ReportDocument['setOrientation']>;
    cover: NonNullable<ReportDocument['cover']>;
    setCover: NonNullable<ReportDocument['setCover']>;
    watermark: NonNullable<ReportDocument['watermark']>;
    setWatermark: NonNullable<ReportDocument['setWatermark']>;
    exportCsv: NonNullable<ReportDocument['exportCsv']>;
}): import("react").JSX.Element;
