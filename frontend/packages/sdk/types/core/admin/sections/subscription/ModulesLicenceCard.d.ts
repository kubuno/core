import type { InstalledModule } from './api';
/**
 * What is installed, at which version, under which licence.
 *
 * The licence column is not decoration: a module is a separate repository with
 * its own manifest, so "the platform is AGPL" is a statement about the core and
 * nothing more. What each module declares is read back from `core.modules`,
 * where the manifest it shipped landed — so a module that ever declares
 * something else shows it here rather than being quietly assumed to match.
 *
 * The version column is the other half of a support request: "which version"
 * is the first question anybody answering one asks.
 */
export default function ModulesLicenceCard({ modules }: {
    modules: InstalledModule[];
}): import("react").JSX.Element;
