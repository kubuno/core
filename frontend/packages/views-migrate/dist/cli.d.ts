import { type MigrationResult } from './migrate.js';
export declare function main(argv?: readonly string[]): Promise<number>;
export declare function summary(root: string, results: MigrationResult[]): {
    converted: number;
    partial: number;
    skipped: number;
    elements: number;
    elementsMapped: number;
    parts: number;
    classAttributes: number;
    files: {
        file: string;
        component: string | undefined;
        status: import("./migrate.js").Status;
        reasons: string[];
        stats: import("./migrate.js").MigrationStats;
        outputs: string[];
        defaults: number;
    }[];
};
