import { Project } from 'ts-morph';
import type { MigrateConfig } from './migrate.js';
export declare function openProject(root: string, files: readonly string[], opts?: {
    tsconfig?: string;
    defaultNs?: string;
    fallbackLng?: string;
}): {
    project: Project;
    config: MigrateConfig;
};
