import type { ReportModel } from '../model';
/**
 * The front sheet — optional, and off by default.
 *
 * A report that circulates outside the console (a board pack, an audit file, a
 * printout handed across a desk) is read by somebody who needs to know what
 * they are holding before they see a single figure. A report consulted for two
 * minutes and thrown away does not, and a cover would just be a sheet of paper
 * to skip. So it is a switch, next to the paper format, and the operator
 * decides — which is what "ajouter ou retirer une page de garde" means.
 *
 * It carries nothing the document does not already state on page 1. That is
 * deliberate: a cover holding a fact of its own would be a second source for
 * it, and the two would eventually disagree.
 */
export default function CoverSheet({ instance, title, about, periodLabel, generatedAt, generatedBy, model, }: {
    instance: string;
    title: string;
    about: string;
    periodLabel: string;
    generatedAt: string;
    generatedBy: string;
    model: ReportModel;
}): import("react").JSX.Element;
