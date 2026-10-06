import { Project } from 'ts-morph';
import type { MigrateConfig } from './migrate.js';
/** `<root>/src/**\/locales/<lang>/<ns>.json` bundles of `lang`, by namespace. */
export declare function jsonBundles(root: string, lang: string): Map<string, Set<string>>;
export declare function openProject(root: string, files: readonly string[], opts?: {
    tsconfig?: string;
    defaultNs?: string;
    fallbackLng?: string;
}): {
    project: Project;
    config: MigrateConfig;
};
